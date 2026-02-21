// logger.js

const Logger = {
    LOG_LEVELS: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        NONE: 4 // Loglamayı tamamen kapatmak için
    },
    currentLogLevel: 0, // Varsayılan olarak DEBUG seviyesinden başla (DEBUG ve üstünü logla)
    logs: [], // Lokal olarak biriktirilecek loglar
    MAX_LOG_BUFFER_SIZE: 100, // Sunucuya göndermeden önce biriktirilecek maksimum log sayısı
    serverLogEndpoint: "/api/v1/core/device-logs/", // Sunucunuzdaki log kabul endpoint'i
    heartbeatEndpoint: "/api/v1/core/heartbeat/", // Lightweight heartbeat endpoint
    credentials: null, // Sunucuya göndermek için kimlik bilgileri
    flushIntervalId: null, // Periodic flush timer
    FLUSH_INTERVAL_MS: 30000, // Send logs every 30 seconds (heartbeat for device status)

    init: function(logLevel, serverUrl, username, password) {
        if (logLevel !== undefined) {
            this.currentLogLevel = logLevel;
        }
        if (serverUrl && username && password) {
            this.credentials = { server: serverUrl, username: username, password: password };
        }
        console.log("Logger initialized. Log level: " + this.currentLogLevel);
        this.startPeriodicFlush();
    },

    startPeriodicFlush: function() {
        var self = this;
        if (this.flushIntervalId) {
            clearInterval(this.flushIntervalId);
        }
        this.flushIntervalId = setInterval(function() {
            // Always send heartbeat to keep device status active
            self.sendHeartbeat();
            if (self.logs.length === 0 && self.credentials && self.credentials.server) {
                // Send a heartbeat log even if no logs buffered
                self.logs.push({
                    timestamp: new Date().toISOString(),
                    level: 'INFO',
                    message: 'heartbeat'
                });
            }
            self.sendLogs();
        }, this.FLUSH_INTERVAL_MS);
    },

    stopPeriodicFlush: function() {
        if (this.flushIntervalId) {
            clearInterval(this.flushIntervalId);
            this.flushIntervalId = null;
        }
    },

    _log: function(level, message, data) {
        if (level < this.currentLogLevel) {
            return; // Mevcut log seviyesinden düşükse loglama
        }

        const timestamp = new Date().toISOString();
        const levelStr = Object.keys(this.LOG_LEVELS).find(key => this.LOG_LEVELS[key] === level);

        const logEntry = {
            timestamp: timestamp,
            level: levelStr,
            message: message,
        };

        if (data !== undefined) {
            // Tizen üzerinde 'data' karmaşık bir nesne veya DOM elemanı olabilir, string'e çevirmeye çalışalım
            try {
                if (data instanceof Error) {
                    logEntry.data = { name: data.name, message: data.message, stack: data.stack };
                } else if (typeof data === 'object' && data !== null) {
                    logEntry.data = JSON.parse(JSON.stringify(data)); // Döngüsel referansları kırmak için
                } else {
                    logEntry.data = data;
                }
            } catch (e) {
                logEntry.data = "Data could not be serialized: " + e.message;
            }
        }

        // Konsola da yazdıralım (geliştirme için)
        const consoleArgs = [`[${levelStr}] ${timestamp}: ${message}`];
        if (data !== undefined) {
            consoleArgs.push(data);
        }
        switch (level) {
            case this.LOG_LEVELS.DEBUG:
                console.debug(...consoleArgs);
                break;
            case this.LOG_LEVELS.INFO:
                console.info(...consoleArgs);
                break;
            case this.LOG_LEVELS.WARN:
                console.warn(...consoleArgs);
                break;
            case this.LOG_LEVELS.ERROR:
                console.error(...consoleArgs);
                break;
        }

        this.logs.push(logEntry);

        // Send immediately on error or when buffer is full
        // Normal logs are sent by the periodic flush timer (every 30s)
        if (level === this.LOG_LEVELS.ERROR || this.logs.length >= this.MAX_LOG_BUFFER_SIZE) {
            this.sendLogs();
        }
    },

    debug: function(message, data) {
        this._log(this.LOG_LEVELS.DEBUG, message, data);
    },

    info: function(message, data) {
        this._log(this.LOG_LEVELS.INFO, message, data);
    },

    warn: function(message, data) {
        this._log(this.LOG_LEVELS.WARN, message, data);
    },

    error: function(message, data) {
        this._log(this.LOG_LEVELS.ERROR, message, data);
    },

    sendLogs: async function() {
        if (this.logs.length === 0 || !this.credentials || !this.credentials.server) {
            if (this.logs.length > 0 && (!this.credentials || !this.credentials.server)) {
                // console.warn("Logger: Credentials or server URL not set. Cannot send logs.");
                // Logları kaybetmemek için biriktirmeye devam et, belki daha sonra gönderilir.
            }
            return;
        }

        const logsToSend = [...this.logs]; // Gönderilecek logların kopyasını al
        this.logs = []; // Lokal buffer'ı temizle

        const url = this.credentials.server + this.serverLogEndpoint;

        var deviceId = 'unknown';
        try {
            if (typeof tizen !== 'undefined' && tizen.systeminfo) {
                deviceId = tizen.systeminfo.getCapability("http://tizen.org/system/tizenid");
            }
        } catch (e) { /* ignore */ }

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    deviceId: deviceId,
                    username: this.credentials.username,
                    password: this.credentials.password,
                    logs: logsToSend
                }),
            });

            if (!response.ok) {
                // console.error(`Logger: Failed to send logs. Status: ${response.status}`, await response.text());
                // Başarısız olan logları geri ekleyebiliriz (tekrar denemek için dikkatli olun, sonsuz döngüye girebilir)
                this.logs.unshift(...logsToSend); // Başa ekle ki yeni loglar kaybolmasın
            } else {
                // console.info("Logger: Logs sent successfully.");
            }
        } catch (error) {
            // console.error("Logger: Error sending logs:", error);
            this.logs.unshift(...logsToSend); // Ağ hatası durumunda da geri ekle
        }
    },

    sendHeartbeat: async function() {
        if (!this.credentials || !this.credentials.server) {
            return;
        }
        var url = this.credentials.server + this.heartbeatEndpoint;
        try {
            await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: this.credentials.username,
                    password: this.credentials.password,
                    source: "tizen"
                })
            });
        } catch (e) {
            // Heartbeat failure is non-critical; next interval will retry
        }
    }
};