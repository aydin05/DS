import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axiosClient, { AUTO_FETCH } from "../../../config";

const HEARTBEAT_INTERVAL = 30000;
const LOG_FLUSH_INTERVAL = 30000;

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

function OpenLink() {
  const params = useParams();
  const [mergedVideoUrl, setMergedVideoUrl] = useState(null);
  const [displaySize, setDisplaySize] = useState({ width: null, height: null });
  const autoFetchRef = useRef(null);
  const videoRef = useRef(null);

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
        setDisplaySize({ width: data.general.width, height: data.general.height });
      }

      setMergedVideoUrl(prev => {
        const newUrl = data.merged_video_url || null;
        if (prev === newUrl) return prev;
        if (newUrl) {
          deviceLog("INFO", "Merged video URL updated", { url: newUrl });
        }
        return newUrl;
      });
    } catch (err) {
      deviceLog("ERROR", "API fetch failed", { error: err.message, name: err.name });
      console.error("API Error:", err);
    }
  }, [params.username]);

  // --- Initial fetch and periodic refresh ---
  useEffect(() => {
    getData();
    autoFetchRef.current = setInterval(getData, AUTO_FETCH || 30000);
    return () => clearInterval(autoFetchRef.current);
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
    <div style={{ width: "100%", height: "100vh", backgroundColor: "#000", overflow: "hidden" }}>
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
          Waiting for merged video...
        </div>
      )}
    </div>
  );
}

export default OpenLink;