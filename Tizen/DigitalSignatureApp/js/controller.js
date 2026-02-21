/**
 * 
 */

async function downloadAllFile(slides) {
    if (!Array.isArray(slides) || slides.length === 0) {
        Logger.warn("downloadAllFile called with empty or invalid slides, skipping.");
        return slides;
    }
    Logger.info("Starting to download all files for slides.", { count: slides.length }); //

    // Collect all downloadable items
    var tasks = [];
    slides.forEach(function(slide) {
        slide.items.forEach(function(item) {
            var url = item.attr ? item.attr.location : null;
            if (!url) {
                Logger.info("Skipping item because location is empty.", {
                    slideId: slide.id,
                    itemId: item.id
                });
                return;
            }
            var filename = url.split("/").pop();
            tasks.push({ item: item, url: url, filename: filename });
        });
    });

    var totalFiles = tasks.length;
    if (totalFiles === 0) {
        Logger.info("No files to download.");
        return slides;
    }

    // Show progress UI
    var progressContainer = document.getElementById("progress-container");
    var overallBar = document.getElementById("overall-progress");
    var overallText = document.getElementById("overall-progress-text");
    var fileBar = document.getElementById("file-progress");
    var fileText = document.getElementById("file-progress-text");
    var fileNumEl = document.getElementById("current-file-number");
    var totalFilesEl = document.getElementById("total-files");
    var fileNameEl = document.getElementById("current-file-name");
    var loadingText = document.getElementById("loading_text");

    if (progressContainer) progressContainer.style.display = "block";
    if (totalFilesEl) totalFilesEl.textContent = String(totalFiles);
    if (loadingText) loadingText.textContent = "Videolar yüklənir...";

    // Download files one by one for smooth progress tracking
    for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        var fileIndex = i + 1;

        // Update file info
        if (fileNumEl) fileNumEl.textContent = String(fileIndex);
        if (fileNameEl) fileNameEl.textContent = task.filename;
        if (fileBar) { fileBar.style.width = "0%"; }
        if (fileText) fileText.textContent = "0%";

        Logger.info("Downloading file", { index: fileIndex, total: totalFiles, filename: task.filename });

        var path = await download.start(task.url, task.filename, 0, function(received, total, percent) {
            // Update per-file progress bar
            if (fileBar) fileBar.style.width = percent + "%";
            if (fileText) fileText.textContent = Math.round(percent) + "%";
        });

        // Update item location to local path
        Logger.info("Updating item location to local path", { oldLocation: task.item.attr.location, newLocation: path });
        task.item.attr.location = path;

        // Update overall progress bar
        var overallPercent = (fileIndex / totalFiles) * 100;
        if (overallBar) overallBar.style.width = overallPercent + "%";
        if (overallText) overallText.textContent = Math.round(overallPercent) + "%";

        Logger.info("File download complete", { index: fileIndex, total: totalFiles, path: path });
    }

    // Hide progress UI
    if (progressContainer) progressContainer.style.display = "none";
    if (loadingText) loadingText.textContent = "Məlumatlar hazırlanır...";

    Logger.info("All files downloaded successfully.", { totalFiles: totalFiles });
    return slides;
}

const MAX_RETRIES = 3;

var download = {
    getInfo: function () {
        Logger.info("Retrieving download capability and storage info"); //
        var downloadPossible = tizen.systeminfo.getCapability(
            "http://tizen.org/feature/download"
        );

        var wifiCapable = tizen.systeminfo.getCapability(
            "http://tizen.org/feature/network.wifi"
        );

        console.log("Download possible: " + downloadPossible);
        console.log("Wifi capable: " + wifiCapable);

        // —— Buradan etibarən storage məlumatı ——
        tizen.systeminfo.getPropertyValue(
            "STORAGE",
            function (storage) {
                const toMB = bytes => (bytes / 1024 / 1024).toFixed(2);

                console.log(`📦 STORAGE units sayı: ${storage.units.length}`);
                storage.units.forEach((unit, idx) => {
                    const totalMB = toMB(unit.capacity);
                    const availMB = toMB(unit.availableCapacity);
                    const usedMB  = toMB(unit.capacity - unit.availableCapacity);

                    Logger.info("Storage unit info", {
                        index: idx,
                        type: unit.type,
                        totalMB: totalMB,
                        availableMB: availMB,
                        usedMB: usedMB
                    }); //
                    console.log(`\n— Unit #${idx + 1} —`);
                    console.log(`Type:           ${unit.type}`);
                    console.log(`Toplam yaddaş:  ${totalMB} MB`);
                    console.log(`Boş yaddaş:     ${availMB} MB`);
                    console.log(`İstifadə olunmuş: ${usedMB} MB`);
                });
            },
            function (err) {
                Logger.error("Storage info error", { error: err.message }); //
                console.error("Storage info error: " + err.message);
            }
        );
    },

    start: function (url, file_name, retryCount, onProgress) {
        if (retryCount === undefined) retryCount = 0;
        Logger.info("Initiating download start", { url, file_name, retryCount }); //
        return new Promise((resolve, reject) => {
            try {
                const req = new tizen.DownloadRequest(
                    url,
                    "downloads",
                    file_name,
                    "ALL"
                );
                req.httpHeader["Pragma"] = "no-cache";

                const listener = {
                    onprogress: function (id, receivedSize, totalSize) {
                        const percent = (receivedSize / totalSize * 100).toFixed(1);
                        Logger.info("Download progress", { file_name, id, receivedSize, totalSize, percent }); //
                        console.log(`📥 ${file_name}: ${percent}%`);
                        if (onProgress) {
                            onProgress(receivedSize, totalSize, parseFloat(percent));
                        }
                    },
                    onpaused: function (id) {
                        Logger.warn("Download paused", { file_name, id }); //
                        console.log(`⏸️ Paused: ${id}`);
                    },
                    oncanceled: function (id) {
                        Logger.warn("Download cancelled by user or system", { file_name, id }); //
                        console.log(`🚫 Cancelled: ${id}`);
                        reject(new Error("Cancelled"));
                    },
                    oncompleted: function (id, fullPath) {
                        Logger.info("Download completed successfully", { file_name, fullPath, id }); //
                        console.log(`✅ Completed: ${fullPath}`);
                        resolve(fullPath);
                    },
                    onfailed: function (id, error) {
                        Logger.error("Download failed", { file_name, error: error.message, retryCount }); //
                        console.warn(`❌ Yükləmə uğursuz oldu (${file_name}): ${error.message}`);

                        if (retryCount < MAX_RETRIES) {
                            Logger.warn("Retrying download due to failure", { file_name, attempt: retryCount + 1 }); //
                            console.log(`🔁 Yenidən cəhd edilir (${retryCount + 1}/${MAX_RETRIES})`);
                            // Delay ilə təkrar yüklə
                            setTimeout(function() {
                                resolve(download.start(url, file_name, retryCount + 1, onProgress));
                            }, 1000); // 1 saniyə sonra təkrar cəhd
                        } else {
                            Logger.error("Maximum retry attempts reached, download aborted", { file_name }); //
                            reject(new Error(`Maksimum cəhd sayı keçildi: ${file_name}`));
                        }
                    },
                };

                const id = tizen.download.start(req, listener);
                this.id = id;  
                Logger.info("Download request submitted to Tizen API", { file_name, id }); //
                console.log(`⬇️ Download started (ID: ${id})`);

            } catch (e) {
                Logger.error("Error initiating download", { file_name, error: e.message }); //
                reject(e);
            }
        });
    },

    pause: function () {
        if (this.id && tizen.download.getState(this.id) === "DOWNLOADING") {
            try {
                Logger.warn("Pausing download", { id: this.id }); //
                tizen.download.pause(this.id);
            } catch (e) {
                Logger.error("Error pausing download", { id: this.id, error: e.message }); //
                console.log(e.message);
            }
        }
    },

    resume: function () {
        if (this.id && tizen.download.getState(this.id) === "PAUSED") {
            try {
                Logger.info("Resuming download", { id: this.id }); //
                tizen.download.resume(this.id);
            } catch (e) {
                Logger.error("Error resuming download", { id: this.id, error: e.message }); //
                console.log(e.message);
            }
        }
    },

    cancel: function () {
        var state;
        var isCorrectState;

        if (!this.id) {
            Logger.warn("No download ID found, cannot cancel"); //
            return;
        }

        state = tizen.download.getState(this.id);
        isCorrectState =
            state === "QUEUED" || state === "DOWNLOADING" || state === "PAUSED";

        if (this.id && isCorrectState) {
            try {
                Logger.warn("Cancelling download", { id: this.id, state }); //
                tizen.download.cancel(this.id);
            } catch (e) {
                Logger.error("Error cancelling download", { id: this.id, error: e.message }); //
                console.log(e.message);
            }
        }
    },

    onProgress: function (id, receivedSize, totalSize) {
        // Note: file_name is not defined here; if needed, pass context
        Logger.debug("Download progress event", { id, receivedSize, totalSize }); //
        //progress.updateProgress(receivedSize, totalSize);
    },

    onPaused: function (id) {
        Logger.warn("Download paused event received", { id }); //
    },

    onComplete: function (id, fullPath) {
        this.id = null;
        Logger.info("Download completed event received", { id, fullPath }); //
        console.log("Download completed: " + fullPath);

        //progress.hide();
        filesystem.listDownloadedFiles();
    },

    onCancelled: function (id) {
        Logger.warn("Download cancelled event received", { id }); //
        //progress.hide();
        filesystem.listDownloadedFiles();
    },

    onFailed: function (error) {
        this.id = null;
        Logger.error("Download failed event received", { error: error }); //
        console.log("Download fail: " + error);
    },
};

async function deleteAllFiles() {
    Logger.info("Attempting to delete all files from downloads directory."); //
    if (typeof tizen === 'undefined' || !tizen.filesystem) {
        Logger.info("Tizen filesystem not available, skipping file deletion (URL Launcher mode)");
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        tizen.filesystem.resolve(
            "downloads",
            function (handle) {
                if (!handle.isDirectory) {
                    Logger.warn("Resolved path is not a directory, nothing to delete"); //
                    console.warn("Not a directory!");
                    return resolve();
                }

                handle.listFiles(function (files) {
                    if (files.length === 0) {
                        Logger.info("Downloads directory is already empty"); //
                        console.log("📁 Downloads qovluğu boşdur.");
                        return resolve();
                    }

                    let deletedCount = 0;
                    Logger.info("Deleting files in downloads directory", { totalFiles: files.length }); //

                    files.forEach(function (file) {
                        handle.deleteFile(
                            file.fullPath,
                            function () {
                                Logger.info("Deleted file", { fullPath: file.fullPath }); //
                                console.log("🗑️ Silindi: " + file.fullPath);
                                deletedCount++;

                                if (deletedCount === files.length) {
                                    Logger.info("All files deleted successfully"); //
                                    resolve(); // ✅ hamısı silinib
                                }
                            },
                            function (e) {
                                Logger.error("Failed to delete file", { fullPath: file.fullPath, errorName: e.name }); //
                                console.error("❌ Silinmədi: " + file.fullPath + " | " + e.name);
                                deletedCount++;

                                if (deletedCount === files.length) {
                                    Logger.info("Finished delete attempts, some files may not have been removed"); //
                                    resolve(); // ✅ hata olsa da davam
                                }
                            }
                        );
                    });
                });
            },
            function (e) {
                Logger.error("Error resolving downloads directory", { errorName: e.name }); //
                console.error("🚫 resolve error:", e.name);
                reject(e);
            },
            "rw"
        );
    });
}

function saveJsonToFile(playlistObject, fileName) {
    if (fileName === undefined) fileName = "playlist.json";
    Logger.info("Attempting to save JSON to file: " + fileName); //
    if (typeof tizen === 'undefined' || !tizen.filesystem) {
        // URL Launcher mode — use localStorage
        try {
            localStorage.setItem('ds_' + fileName, JSON.stringify(playlistObject));
            Logger.info("Saved JSON to localStorage", { key: 'ds_' + fileName });
        } catch (e) {
            Logger.error("localStorage save error", { error: e.message });
        }
        return;
    }
    tizen.filesystem.resolve("documents", function (dir) {
        if (!dir.isDirectory) {
            Logger.error("Resolved 'documents' path is not a directory", { fileName }); //
            return;
        }

        dir.listFiles(function (files) {
            const existing = files.find(f => f.name === fileName);

            function createAndWriteFile() {
                try {
                    const newFile = dir.createFile(fileName);
                    Logger.info("Created new file for JSON", { fileName }); //

                    newFile.openStream("w", function (fs) {
                        const dataStr = JSON.stringify(playlistObject);
                        Logger.info("Writing JSON data to file", { fileName, dataLength: dataStr.length }); //
                        console.log("📦 Yazılacaq JSON:", dataStr);

                        fs.write(dataStr);
                        fs.close();

                        Logger.info("File written successfully", { fileName }); //
                        console.log("✅ Fayl yazıldı:", fileName);
                    }, function (e) {
                        Logger.error("openStream Error while writing JSON", { fileName, errorMessage: e.message }); //
                        console.error("❌ openStream Error:", e.message);
                    }, "UTF-8");
                } catch (e) {
                    Logger.error("createFile Error while saving JSON", { fileName, errorMessage: e.message }); //
                    console.error("❌ createFile Error:", e.message);
                }
            }

            // Əgər fayl mövcuddursa, əvvəl sil → sonra yaz
            if (existing) {
                Logger.info("Existing JSON file found, deleting before rewrite", { fileName, fullPath: existing.fullPath }); //
                try {
                    dir.deleteFile(existing.fullPath, function () {
                        Logger.info("Deleted old JSON file", { fullPath: existing.fullPath }); //
                        console.log("🧹 Köhnə fayl silindi:", existing.fullPath);
                        createAndWriteFile(); // silindikdən sonra yaz
                    }, function (delErr) {
                        Logger.warn("Failed to delete existing JSON file, attempting to overwrite", { fileName, errorMessage: delErr.message }); //
                        console.warn("⚠️ Silmək alınmadı:", delErr.message);
                        createAndWriteFile(); // yenə də yazmağa çalış
                    });
                } catch (e) {
                    Logger.error("Error during deleteFile operation", { fileName, errorMessage: e.message }); //
                    console.warn("⚠️ deleteFile Error:", e.message);
                    createAndWriteFile();
                }
            } else {
                createAndWriteFile(); // birbaşa yaz
            }

        }, function (listErr) {
            Logger.error("listFiles Error while checking existing JSON files", { errorMessage: listErr.message }); //
            console.error("❌ listFiles Error:", listErr.message);
        });

    }, function (resolveErr) {
        Logger.error("documents resolve error while saving JSON", { errorMessage: resolveErr.message }); //
        console.error("❌ documents resolve error:", resolveErr.message);
    }, "rw");
}

function loadJsonFromFile(fileName) {
    if (fileName === undefined) fileName = "playlist.json";
    Logger.info("Attempting to load JSON from file: " + fileName); //
    if (typeof tizen === 'undefined' || !tizen.filesystem) {
        // URL Launcher mode — use localStorage
        try {
            var data = localStorage.getItem('ds_' + fileName);
            if (data) {
                Logger.info("Loaded JSON from localStorage", { key: 'ds_' + fileName });
                return Promise.resolve(JSON.parse(data));
            }
        } catch (e) {
            Logger.error("localStorage load error", { error: e.message });
        }
        return Promise.resolve({});
    }
    return new Promise((resolve, reject) => {
        try {
            tizen.filesystem.resolve("documents", function(dir) {
                dir.listFiles(function(files) {
                    Logger.info("Listing files in 'documents' directory for JSON load", { filesCount: files.length }); //
                    const file = files.find(f => f.name === fileName);

                    if (!file) {
                        Logger.warn("JSON file not found, returning empty object", { fileName }); //
                        console.warn("⚠️ Playlist faylı tapılmadı, boş obyekt qaytarılır.");
                        return resolve({});  // ✅ BOŞ OBYEKT QAYTAR
                    }

                    try {
                        if (file.fileSize > 0) {
                            Logger.info("Opening stream to read JSON file", { fileName, fileSize: file.fileSize }); //
                            file.openStream("r", function (fs) {
                                const contents = fs.read(file.fileSize);
                                fs.close();
                                const jsonData = JSON.parse(contents);
                                Logger.info("Local playlist loaded successfully", { fileURI: file.toURI() }); //
                                console.log("📂 Lokal playlist yükləndi:", file.toURI());
                                resolve(jsonData);
                            }, function (e) {
                                Logger.error("openStream Error while reading JSON", { fileName, errorMessage: e.message }); //
                                console.log("openStream Error: " + e.message);
                                resolve({});
                            }, "UTF-8");
                        } else {
                            Logger.error("JSON file is empty", { fileName }); //
                            console.warn("⚠️ Fayl boşdur, boş obyekt qaytarılır");
                            resolve({});
                        }
                    } catch (e) {
                        Logger.error("Error parsing JSON or reading file, returning empty object", { fileName, errorMessage: e.message }); //
                        console.warn("⚠️ Playlist oxunarkən xəta oldu, boş obyekt qaytarılır:", e.message);
                        resolve({});  // ✅ JSON xətası olsa da boş qaytar
                    }

                }, function(error) {
                    Logger.error("Error listing files while loading JSON, returning empty object", { errorMessage: error.message }); //
                    console.warn("⚠️ Fayl siyahısı oxunmadı, boş obyekt qaytarılır:", error.message);
                    resolve({});  // ✅ listFiles xətası olsa da boş qaytar
                });
            }, function(error) {
                Logger.error("Error resolving 'documents' for JSON load, returning empty object", { errorMessage: error.message }); //
                console.warn("⚠️ Qovluğa daxil olmaq mümkün olmadı, boş obyekt qaytarılır:", error.message);
                resolve({});  // ✅ resolve xətası olsa da boş qaytar
            }, "r");
        } catch (e) {
            Logger.error("Unexpected error in loadJsonFromFile, returning empty object", { fileName, errorMessage: e.message }); //
            console.warn("⚠️ Gözlənilməz xəta, boş obyekt qaytarılır:", e.message);
            resolve({});  // ✅ try/catch xətası olsa da boş qaytar
        }
    });
}

function changeFieldPosition(currentId, dest){
    Logger.info("changeFieldPosition invoked", { currentId, dest }); //
    if(currentId === "server" && dest === 38){
        Logger.info("At 'server' field and up arrow pressed - no action"); //
    } else if(currentId === "server" && dest === 40){
        Logger.info("Moving focus from 'server' to 'username'"); //
        document.getElementById("username").focus();
    } else if(currentId === "username" && dest === 38){
        Logger.info("Moving focus from 'username' to 'server'"); //
        document.getElementById("server").focus();
        document.getElementById("server").scrollIntoView();
    } else if(currentId === "username" && dest === 40){
        Logger.info("Moving focus from 'username' to 'password'"); //
        document.getElementById("password").focus();
    } else if(currentId === "password" && dest === 38){
        Logger.info("Moving focus from 'password' to 'username'"); //
        document.getElementById("username").focus();
        document.getElementById("username").scrollIntoView();
    } else if(currentId === "password" && dest === 40){
        Logger.info("Moving focus from 'password' to 'submit' button"); //
        document.getElementById("login-btn").focus();
    } else if(currentId === "login-btn" && dest === 38){
        Logger.info("Moving focus from 'login-btn' to 'password'"); //
        document.getElementById("password").focus();
    } else {
        Logger.warn("changeFieldPosition called with unhandled currentId/dest combination", { currentId, dest }); //
    }
}
