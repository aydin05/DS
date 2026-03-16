import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axiosClient, { AUTO_FETCH } from "../../../config";

const HEARTBEAT_INTERVAL = 30000;
const LOG_FLUSH_INTERVAL = 30000;

// LocalStorage keys for offline fallback
const LS_VIDEO_URL_PREFIX = "ds_cached_video_url_";
const LS_DISPLAY_SIZE_PREFIX = "ds_cached_display_size_";

// --- Device Logger ---
const logBuffer = [];
let lastPlaylistId = null;

function deviceLog(level, message, data) {
  logBuffer.push({
    timestamp: new Date().toISOString(),
    level,
    message,
    data: data || {},
  });
}

function flushLogs(username) {
  if (logBuffer.length === 0) return;
  const logsToSend = logBuffer.splice(0, logBuffer.length);
  axiosClient.post("core/device-logs/", {
    username,
    source: "openlink",
    logs: logsToSend,
  }).catch(() => {
    logBuffer.unshift(...logsToSend.slice(-50 + logBuffer.length));
  });
}

// --- Register Service Worker for offline caching ---
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/newds/sw.js")
      .then((reg) => {
        console.log("[SW] Registered, scope:", reg.scope);
        deviceLog("INFO", "Service Worker registered", { scope: reg.scope });
      })
      .catch((err) => {
        console.warn("[SW] Registration failed:", err.message);
      });
  }
}

function OpenLink() {
  const params = useParams();
  const [mergedVideoUrl, setMergedVideoUrl] = useState(() => {
    // On mount: try to load last known video URL from localStorage (offline fallback)
    try {
      return localStorage.getItem(LS_VIDEO_URL_PREFIX + params.username) || null;
    } catch (e) { return null; }
  });
  const [displaySize, setDisplaySize] = useState(() => {
    try {
      const cached = localStorage.getItem(LS_DISPLAY_SIZE_PREFIX + params.username);
      return cached ? JSON.parse(cached) : { width: null, height: null };
    } catch (e) { return { width: null, height: null }; }
  });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [apiReachable, setApiReachable] = useState(true);
  const autoFetchRef = useRef(null);
  const videoRef = useRef(null);

  // Connection is considered lost if browser is offline OR API is unreachable
  const connectionLost = isOffline || !apiReachable;

  // --- Register Service Worker once ---
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // --- Log flush interval ---
  useEffect(() => {
    deviceLog("INFO", "OpenLink started", { username: params.username, userAgent: navigator.userAgent });
    const flushInterval = setInterval(() => flushLogs(params.username), LOG_FLUSH_INTERVAL);
    return () => {
      clearInterval(flushInterval);
      flushLogs(params.username);
    };
  }, [params.username]);

  // --- Data fetching (merged video URL only) ---
  const getData = useCallback(async () => {
    try {
      const res = await axiosClient(`display/display-detail?username=${params.username}`);
      const data = res.data;

      const newPlaylistId = data.general?.id;
      if (lastPlaylistId !== null && newPlaylistId !== lastPlaylistId) {
        deviceLog("INFO", "Playlist changed", { from: lastPlaylistId, to: newPlaylistId });
      }
      lastPlaylistId = newPlaylistId;

      if (data.general) {
        const size = { width: data.general.width, height: data.general.height };
        setDisplaySize(size);
        // Persist display size for offline use
        try { localStorage.setItem(LS_DISPLAY_SIZE_PREFIX + params.username, JSON.stringify(size)); } catch (e) {}
      }

      setMergedVideoUrl(prev => {
        const newUrl = data.merged_video_url || null;
        if (prev === newUrl) return prev;
        if (newUrl) {
          deviceLog("INFO", "Merged video URL updated", { url: newUrl });
          // Persist video URL for offline fallback
          try { localStorage.setItem(LS_VIDEO_URL_PREFIX + params.username, newUrl); } catch (e) {}
        }
        return newUrl;
      });

      // API succeeded — connection is healthy
      setApiReachable(true);
    } catch (err) {
      deviceLog("ERROR", "API fetch failed", { error: err.message, name: err.name });
      console.error("API Error:", err);
      // Mark API as unreachable — shows red dot
      setApiReachable(false);
      // Keep current mergedVideoUrl (already set from localStorage or previous fetch)
    }
  }, [params.username]);

  // --- Initial fetch and periodic refresh ---
  useEffect(() => {
    getData();
    autoFetchRef.current = setInterval(getData, AUTO_FETCH || 30000);
    return () => clearInterval(autoFetchRef.current);
  }, [getData]);

  // --- Online/offline detection ---
  useEffect(() => {
    const goOnline = () => {
      setIsOffline(false);
      deviceLog("INFO", "Network restored — fetching latest playlist");
      // Immediately fetch new data when network comes back
      getData();
    };
    const goOffline = () => {
      setIsOffline(true);
      deviceLog("WARN", "Network lost — using cached content");
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [getData]);

  // --- Heartbeat ---
  useEffect(() => {
    const sendHeartbeat = () => {
      axiosClient.post("core/heartbeat/", {
        username: params.username,
        source: "openlink",
      }).catch(() => {});
    };
    sendHeartbeat();
    const hbInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    return () => clearInterval(hbInterval);
  }, [params.username]);

  return (
    <div style={{ width: "100%", height: "100vh", backgroundColor: "#000", overflow: "hidden", position: "relative" }}>
      {/* Red dot — visible when connection is lost */}
      {connectionLost && (
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 16,
            height: 16,
            borderRadius: "50%",
            backgroundColor: "#ef4444",
            zIndex: 10,
            boxShadow: "0 0 6px 2px rgba(239, 68, 68, 0.6)",
          }}
        />
      )}

      {mergedVideoUrl ? (
        <video
          ref={videoRef}
          src={mergedVideoUrl}
          autoPlay
          muted
          loop
          playsInline
          style={{
            width: displaySize.width ? `${displaySize.width}px` : "100%",
            height: displaySize.height ? `${displaySize.height}px` : "100%",
            margin: "0 auto",
            display: "block",
            objectFit: "contain",
            backgroundColor: "#000",
          }}
          onError={(e) => {
            deviceLog("ERROR", "Merged video playback error", { src: mergedVideoUrl, error: e?.target?.error?.message });
            console.error("Merged video error:", e?.target?.error?.message);
          }}
        />
      ) : (
        <div style={{ color: "white", textAlign: "center", paddingTop: "20%", fontSize: 18 }}>
          {connectionLost ? "Offline — no cached video available" : "Waiting for merged video..."}
        </div>
      )}
    </div>
  );
}

export default OpenLink;