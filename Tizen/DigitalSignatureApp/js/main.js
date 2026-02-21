/// <reference path="../../index.d.ts" />

let newPlayList = null;
let fetchInterval = null;
let _lastPlaylistStr = null; // In-memory cache for playlist comparison (works when filesystem is unavailable)
let _isFetching = false; // Guard against concurrent getFetchNew calls

async function getFetchNew(credentials, fromCredentialPage) {
    if (fromCredentialPage === undefined) fromCredentialPage = false;
    if (_isFetching && !fromCredentialPage) {
        Logger.warn("getFetchNew skipped — previous fetch still in progress");
        return;
    }
    _isFetching = true;
    Logger.info("Attempting to fetch new playlist...", { server: credentials.server, username: credentials.username });

    const oldResponse = await loadJsonFromFile(); // Default playlist.json
    const oldData = await loadJsonFromFile("playlist2.json");
    
    // ✅ DETAILED DEBUGGING - Log what we loaded from files
    Logger.info("Loaded local files debug info", {
        oldResponseExists: !!oldResponse,
        oldResponseSlideCount: (oldResponse && oldResponse.slides && oldResponse.slides.length) || 0,
        oldDataExists: !!oldData,
        oldDataSlideCount: (oldData && oldData.slides && oldData.slides.length) || 0
    });

    const url = credentials.server + "/api/v1/playlist/";

    try {
        Logger.info("Sending POST request to playlist endpoint", { url: url });
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username: credentials.username, password: credentials.password }),
        });

        if (!response.ok) {
            Logger.error(`HTTP error while fetching playlist. Status: ${response.status}`, { url: url, status: response.status });
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        let newResponse = await response.json();
        
        // ✅ DETAILED DEBUGGING - Log API response structure
        Logger.info("API response debug info", {
            exists: !!newResponse,
            slideCount: (newResponse && newResponse.slides && newResponse.slides.length) || 0,
            generalId: (newResponse && newResponse.general) ? newResponse.general.id : null
        });
        
        Logger.info("Received response from playlist API", { newId: newResponse.general ? newResponse.general.id : null });
        document.getElementById("red-indicator").style.display = "none";
        document.getElementById("loading_text").textContent = "Məlumatlar yüklənir...";
        
        if (newPlayList === null) {
            showAndHideLoading(false);
        }

        console.log("✅ API cavabı:", newResponse);
        console.log("✅ API old cavabı:", oldResponse, JSON.stringify(newResponse) !== JSON.stringify(oldData));

        // ✅ IMPROVED COMPARISON - Use in-memory cache as primary, filesystem as fallback
        const newResponseStr = newResponse ? JSON.stringify(newResponse) : 'null';
        const oldDataStr = oldData && Object.keys(oldData).length > 0 ? JSON.stringify(oldData) : _lastPlaylistStr;
        const hasChanged = newResponseStr !== oldDataStr;
        
        Logger.info("Playlist comparison", {
            hasChanged,
            newResponseExists: !!newResponse,
            oldDataExists: !!oldData,
            newId: (newResponse && newResponse.general) ? newResponse.general.id : null,
            oldId: (oldData && oldData.general) ? oldData.general.id : null
        });

        if (
            newResponse &&
            newResponse.general && newResponse.general.id !== null &&
            hasChanged
        ) {
            Logger.info("New playlist detected, processing update", { 
                newId: newResponse.general.id, 
                oldId: (oldData && oldData.general) ? oldData.general.id : null 
            });
            _lastPlaylistStr = JSON.stringify(newResponse); // Update in-memory cache
            saveJsonToFile(newResponse, "playlist2.json");
            console.log("🆕 Yeni playlist gəldi:", newResponse.general.id, newResponse.slides);

            showAndHideLoading(true);

            if (fetchInterval) {
                clearInterval(fetchInterval);
                Logger.info("Cleared existing fetch interval to avoid duplicates");
            }
            
            if (newPlayList !== null) {
                Logger.info("Stopping existing playlist player before recreating", { 
                    oldPlayerId: (newPlayList.general) ? newPlayList.general.id : null 
                });
                newPlayList.stopPlayer();
            }
            newPlayList = null;

            // Try downloading files to local storage (works on real TV)
            // If download fails (e.g., emulator), fall back to streaming from server URLs
            let downloadSuccess = false;
            try {
                Logger.info("Deleting all old files before downloading new ones");
                await deleteAllFiles();
                console.log("🧹 Bütün köhnə fayllar silindi, yükləmə başlayır...");
                Logger.info("All old files deleted, download starting");

                Logger.info("Starting download of all new slide files", { 
                    slideCount: (newResponse.slides && newResponse.slides.length) || 0 
                });
                await downloadAllFile(newResponse.slides);
                Logger.info("Finished downloading all slide files");
                downloadSuccess = true;
            } catch (downloadErr) {
                Logger.warn("Download failed, falling back to streaming mode", { 
                    error: downloadErr.message 
                });
                console.warn("⚠️ Download failed, switching to streaming mode:", downloadErr.message);
                
                // Fix media URLs to be absolute server URLs for streaming
                newResponse.slides.forEach(function(slide) {
                    if (slide.items) {
                        slide.items.forEach(function(item) {
                            if (item.attr && item.attr.location) {
                                if (item.attr.location.startsWith('/')) {
                                    item.attr.location = credentials.server + item.attr.location;
                                } else if (!item.attr.location.startsWith('http') && !item.attr.location.startsWith('file://')) {
                                    item.attr.location = credentials.server + '/' + item.attr.location;
                                }
                            }
                            if (item.attr && item.attr.url) {
                                if (item.attr.url.startsWith('/')) {
                                    item.attr.url = credentials.server + item.attr.url;
                                }
                            }
                        });
                    }
                });
                downloadSuccess = true; // URLs are now streamable
            }

            showAndHideLoading(false);
            saveJsonToFile(newResponse); // Save to default playlist.json

            if (downloadSuccess) {
                Logger.info("Rendering playlist", { 
                    playlistId: newResponse.general ? newResponse.general.id : null 
                });
                getSlidesArrayWithoutInternet(newResponse);
            }

            // Interval is set up in the finally block below

        } else {
            Logger.info("Playlist has not changed or is invalid");
            console.log("🔁 Playlist dəyişməyib və ya keçərsizdir.");
            
            if (newPlayList === null) {
                // ✅ IMPROVED FALLBACK LOGIC with detailed logging
                // Prefer playlist.json first — it has LOCAL file paths from previous downloads.
                // API newResponse has server URLs which require streaming (slow/unreliable on Tizen).
                let fallbackData = null;
                let fallbackSource = '';
                
                // Try oldResponse (playlist.json) first — has local downloaded file paths
                if (oldResponse && oldResponse.slides && Array.isArray(oldResponse.slides) && oldResponse.slides.length > 0) {
                    fallbackData = oldResponse;
                    fallbackSource = 'playlist.json (local paths)';
                }
                // Then try newResponse (from API — server URLs, streaming mode)
                else if (newResponse && newResponse.slides && Array.isArray(newResponse.slides) && newResponse.slides.length > 0) {
                    fallbackData = newResponse;
                    fallbackSource = 'API newResponse (streaming)';
                } 
                // Finally try oldData (playlist2.json)
                else if (oldData && oldData.slides && Array.isArray(oldData.slides) && oldData.slides.length > 0) {
                    fallbackData = oldData;
                    fallbackSource = 'playlist2.json';
                }
                
                if (fallbackData) {
                    Logger.info("Using fallback data for offline rendering", { 
                        source: fallbackSource,
                        slideCount: fallbackData.slides.length,
                        playlistId: (fallbackData.general ? fallbackData.general.id : null) || 'unknown'
                    });
                    showAndHideLoading(false);
                    getSlidesArrayWithoutInternet(fallbackData);
                } else {
                    Logger.error("No valid playlist data available from any source", {
                        newResponseSlides: (newResponse && newResponse.slides && newResponse.slides.length) || 0,
                        oldResponseSlides: (oldResponse && oldResponse.slides && oldResponse.slides.length) || 0,
                        oldDataSlides: (oldData && oldData.slides && oldData.slides.length) || 0
                    });
                    handleNoValidData();
                }
            } else {
                Logger.info("Playlist unchanged and player already active, continuing with current playlist");
                showAndHideLoading(false);
            }
        }

    } catch (error) {
        Logger.error("Error fetching new playlist or no internet connectivity detected", { 
            name: error.name, 
            message: error.message 
        });
        console.error("🚫 Xəta baş verdi və ya internet yoxdur:", error.message, error.name);

        if (fromCredentialPage) {
            showCredPage();
            const errDiv = document.getElementById("cred-error");
            if (errDiv) {
                const msg = error.message || "";
                errDiv.textContent = (msg.includes("401") || msg.includes("403"))
                    ? "Invalid credentials. Please check username and password."
                    : "Cannot reach server. Please check the server URL.";
            }
            return;
        }

        if (error.name === "AbortError" || error.name === "TypeError") {
            Logger.warn("Network or request aborted, switching to offline mode if available", { 
                errorName: error.name 
            });
            document.getElementById("red-indicator").style.display = "block";
            
            if (newPlayList === null) {
                // ✅ SAME IMPROVED FALLBACK LOGIC for offline mode
                let fallbackData = null;
                let fallbackSource = '';
                
                if (oldResponse && oldResponse.slides && Array.isArray(oldResponse.slides) && oldResponse.slides.length > 0) {
                    fallbackData = oldResponse;
                    fallbackSource = 'playlist.json (offline)';
                } else if (oldData && oldData.slides && Array.isArray(oldData.slides) && oldData.slides.length > 0) {
                    fallbackData = oldData;
                    fallbackSource = 'playlist2.json (offline)';
                }
                
                if (fallbackData) {
                    Logger.info("Using offline fallback data", { 
                        source: fallbackSource,
                        slideCount: fallbackData.slides.length 
                    });
                    showAndHideLoading(false);
                    getSlidesArrayWithoutInternet(fallbackData);
                } else {
                    Logger.error("No offline data available");
                    handleNoValidData();
                }
            }
        } else {
            Logger.error("Unexpected error during playlist fetch", { errorName: error.name });
            handleNoValidData();
        }
    } finally {
        _isFetching = false;

        // Clear previous interval
        if (fetchInterval) {
            clearInterval(fetchInterval);
            Logger.info("Cleared previous fetchInterval before scheduling a new one");
        }

        // Set up new interval
        fetchInterval = setInterval(function() {
            Logger.info("Interval triggered: fetching new playlist");
            getFetchNew(credentials);
        }, 10000);
        Logger.info("Scheduled next playlist fetch", { intervalMs: 10000 });
    }
}

// ✅ IMPROVED handleNoValidData function
function handleNoValidData() {
    Logger.error("No valid playlist data available for offline rendering");
    document.getElementById("loading_text").textContent = "Məlumat tapılmadı! Serverdən məlumat gözlənir...";
    showAndHideLoading(false);
    
    // Don't immediately show credentials page - maybe the next API call will work
    // Instead, keep trying and only show creds page after several failures
    Logger.info("Continuing to attempt periodic fetches - will retry in next interval");
}

function registerKeys() {
    const usedKeys = [
        "MediaPause",
        "MediaPlay",
        "MediaStop",
        "MediaPlayPause",
        "0",
        "1",
        "2",
        "3",
    ];

    Logger.info("Registering TV input keys for Tizen remote", { keys: usedKeys });
    usedKeys.forEach(function (keyName) {
        tizen.tvinputdevice.registerKey(keyName);
    });
}

function registerKeyHandler() {
    Logger.info("Registering global keydown handler");

    document.addEventListener("keydown", function (e) {
        Logger.info("Key pressed", { keyCode: e.keyCode });
        switch (e.keyCode) {
            case 49:
                Logger.info("Key '1' pressed - reserved for future use");
                //filesystem.listDownloadedFiles();
                break;
            case 48:
                Logger.info("Key '0' pressed - logging out");
                logout();
                break;
            case 51:
                Logger.info("Key '3' pressed - reserved for future use");
                break;
            case 10252:
                Logger.info("Key 'PLAY_PAUSE' pressed - reserved for future use");
                break;
            case 19:
                Logger.info("Key 'MediaPause' pressed - reserved for future use");
                //download.pause();
                break;
            case 415:
                Logger.info("Key 'MediaPlay' pressed - reserved for future use");
                //download.resume();
                break;
            case 413:
                Logger.info("Key 'MediaStop' pressed - reserved for future use");
                //download.cancel();
                break;
            case 38:
                Logger.info("Arrow Up pressed - moving to previous field", { activeElement: document.activeElement.id });
                changeFieldPosition(document.activeElement.id, 38);
                break;
            case 40:
                Logger.info("Arrow Down pressed - moving to next field", { activeElement: document.activeElement.id });
                changeFieldPosition(document.activeElement.id, 40);
                break;
            case 10009:
                Logger.info("Exit key pressed - exiting Tizen application");
                if (typeof tizen !== 'undefined' && tizen.application) {
                    tizen.application.getCurrentApplication().exit();
                }
                break;
            default:
                // Unhandled key; no logging needed
                break;
        }
    });
}

function showAndHideLoading(show) {
    if (show) {
        Logger.info("Displaying loading overlay");
        document.getElementById("loading-overlay").style.display = "flex";
        document.getElementById("content-wrap").style.display = "none";
    } else {
        Logger.info("Hiding loading overlay and showing content");
        document.getElementById("loading-overlay").style.display = "none";
        document.getElementById("content-wrap").style.display = "block";
    }
}

function logout() {
    Logger.warn("Logout triggered - clearing credentials and stopping all activity");

    // Stop periodic playlist fetch
    if (fetchInterval) {
        clearInterval(fetchInterval);
        fetchInterval = null;
        Logger.info("Cleared fetch interval on logout");
    }

    // Stop heartbeat so device goes inactive on server
    Logger.stopPeriodicFlush();
    Logger.credentials = null;
    Logger.info("Stopped heartbeat and cleared logger credentials");

    // Stop current playlist player
    if (newPlayList !== null) {
        try { newPlayList.stopPlayer(); } catch(e) {}
        newPlayList = null;
        Logger.info("Stopped playlist player on logout");
    }
    _lastPlaylistStr = null;

    // Clear credentials.json from storage
    if (typeof tizen !== 'undefined' && tizen.filesystem) {
        tizen.filesystem.resolve("documents", function(dir) {
            dir.listFiles(function(files) {
                var credFile = files.find(function(f) { return f.name === "credentials.json"; });
                if (credFile) {
                    dir.deleteFile(credFile.fullPath, function() {
                        Logger.info("credentials.json deleted on logout");
                    }, function(e) {
                        Logger.warn("Failed to delete credentials.json", { error: e.name });
                    });
                }
            }, function() {});
        }, function() {}, "rw");
    } else {
        // URL Launcher / localStorage mode
        try { localStorage.removeItem('ds_credentials.json'); } catch(e) {}
    }

    // Clear form fields but keep default server URL
    document.getElementById("server").value = "https://aydin.technolink.az";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    var errDiv = document.getElementById("cred-error");
    if (errDiv) errDiv.textContent = "";

    // Clear content
    document.getElementById("content-wrap").innerHTML = "";

    showCredPage();
}

function showCredPage() {
    Logger.warn("Showing credentials input page");
    document.getElementById("cred-page").style.display = "flex";
    document.getElementById("loading-overlay").style.display = "none";

    // ⚠️ Tizen web engine focus üçün element hazır olduqdan sonra çağırılmalıdır
    const server = document.getElementById("server");
    server.focus();
}

function handleEnterKeyToFocusNext() {
    Logger.info("Registering Enter key handler for credential form inputs");
    const inputs = Array.from(document.querySelectorAll("#cred-form input"));

    inputs.forEach((input, index) => {
        input.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.keyCode === 13) {
                event.preventDefault();

                if (index < inputs.length - 1) {
                    Logger.info("Enter pressed - moving focus to next input field", { from: inputs[index].id, to: inputs[index + 1].id });
                    inputs[index + 1].focus();
                } else {
                    Logger.info("Enter pressed on last input - submitting credentials");
                    submitCredentials();
                }
            }
        });
    });
}

window.onload = async function init() {
    Logger.info("Window onload event fired - initializing application");
    var isTizen = (typeof tizen !== 'undefined');
    Logger.info("Runtime detected", { isTizen: isTizen });

    showAndHideLoading(true);
    handleEnterKeyToFocusNext();

    var loginBtn = document.getElementById("login-btn");
    if (loginBtn) {
        loginBtn.addEventListener("click", function () {
            Logger.info("Login button clicked");
            submitCredentials();
        });
        loginBtn.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.keyCode === 13) {
                e.preventDefault();
                Logger.info("Enter pressed on login button");
                submitCredentials();
            }
        });
    }

    if (isTizen) {
        registerKeys();
        registerKeyHandler();
    } else {
        Logger.info("Skipping Tizen key registration (URL Launcher mode)");
    }

    Logger.info("Loading credentials from local file");
    const credentials = await loadJsonFromFile("credentials.json");

    // Logger'ı başlat
    if (credentials && credentials.server) {
        Logger.init(Logger.LOG_LEVELS.INFO, credentials.server, credentials.username, credentials.password);
        Logger.info("Logger initialized with provided credentials", { server: credentials.server, username: credentials.username });
    } else {
        Logger.init(Logger.LOG_LEVELS.INFO);
        Logger.warn("Logger initialized without server credentials");
    }

    Logger.info("Application starting...");

    if (!credentials || !credentials.username || !credentials.password || !credentials.server) {
        Logger.warn("Credentials missing or incomplete - showing credential page");
        showCredPage();
        showAndHideLoading(false);
        return;
    } else {
        Logger.info("Credentials loaded successfully", { username: credentials.username });
        document.getElementById("username").value = credentials.username;
        document.getElementById("server").value = credentials.server;
        document.getElementById("cred-page").style.display = "none";

        Logger.info("Starting initial playlist fetch");
        // getFetchNew sets up its own interval in the finally block
        getFetchNew(credentials);
    }
};

function submitCredentials() {
    try {
        Logger.info("submitCredentials called");
        var server = document.getElementById("server").value.trim();
        var username = document.getElementById("username").value.trim();
        var password = document.getElementById("password").value.trim();

        var errDiv = document.getElementById("cred-error");

        if (!server || !username || !password) {
            Logger.warn("User attempted to submit credentials with missing fields");
            if (errDiv) errDiv.textContent = "Please fill in all fields.";
            return;
        }

        if (errDiv) errDiv.textContent = "";

        Logger.info("Credentials submitted by user", { server: server, username: username });
        saveJsonToFile({ "server": server, "username": username, "password": password }, "credentials.json");
        Logger.info("Credentials saved to local file", { file: "credentials.json" });

        // Re-initialize Logger with new credentials so heartbeats/logs go to the correct server
        Logger.init(Logger.LOG_LEVELS.INFO, server, username, password);
        Logger.info("Logger re-initialized with new credentials", { server: server, username: username });

        var credentials = { server: server, username: username, password: password };

        if (newPlayList !== null) {
            Logger.info("Stopping existing playlist player before credential-based restart");
            newPlayList.stopPlayer();
        }
        newPlayList = null;

        showAndHideLoading(true);

        if (fetchInterval) {
            clearInterval(fetchInterval);
            Logger.info("Cleared previous fetch interval after credential submission");
        }

        document.getElementById("cred-page").style.display = "none";

        getFetchNew(credentials, true);
    } catch (e) {
        Logger.error("submitCredentials crashed", { error: e.message });
        var errDiv2 = document.getElementById("cred-error");
        if (errDiv2) errDiv2.textContent = "Error: " + e.message;
    }
}

async function getSlidesArrayWithoutInternet(response, downloadedFilesPaths, downloadedFilesNames) {
    const jsonSlides1 = response.slides;
    Logger.info("Entering offline slide rendering function", { slideCount: jsonSlides1.length });
    console.log("getSlidesArrayWithoutInternet start: ", JSON.stringify(jsonSlides1));

    if (newPlayList === null) {
        Logger.info("Creating new Player instance with offline slides");
        newPlayList = new Player(jsonSlides1);
        newPlayList.startPlayer();
        Logger.info("Started player for the first time");
    } else {
        Logger.info("Stopping existing player to update slides", { oldPlaylistId: newPlayList.general ? newPlayList.general.id : null });
        newPlayList.stopPlayer();
        newPlayList.slides = jsonSlides1;
        newPlayList.startPlayer();
        Logger.info("Restarted player with updated offline slides");
    }
}
