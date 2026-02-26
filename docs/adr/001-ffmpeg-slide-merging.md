# ADR-001: FFmpeg Slide Merging in Backend for Tizen App

**Status:** Rejected  
**Date:** 2026-02-26  
**Context:** Evaluating whether to merge slides server-side with FFmpeg into a single video and send it to the Tizen app, instead of the current approach of sending individual slides as JSON + media files.

---

## Current Architecture

The Tizen digital signage app uses a **client-side rendering** approach:

1. **Backend** (`playlist` API) returns slides as structured JSON — each slide contains positioned widget items (text, image, video, table, iframe, globaltext).
2. **Tizen app** (`controller.js`) downloads individual media files (images, videos) to local device storage.
3. **Tizen app** (`slider.js`) renders each slide natively in HTML/CSS using a **dual-decoder player** — it pre-loads the next slide behind the current one to avoid black frames between video transitions.
4. The app **polls every 10 seconds** for playlist updates, making content changes near-instant.

### Widget types rendered on-device

| Widget | Rendering |
|--------|-----------|
| `text` | HTML with rich formatting, optional marquee scrolling |
| `globaltext` | Persistent overlay rendered on every slide |
| `video` | Native `<video>` element via Tizen hardware decoder |
| `image` | `<img>` element |
| `table` | HTML `<table>` with dynamic rows/columns |
| `iframe` | Live embedded web page |

---

## Proposed Change

Use FFmpeg on the backend to composite all slides into a **single continuous video** (e.g., an MP4 file), then deliver that single file to the Tizen app for playback.

---

## Analysis

### Potential Benefits

1. **Simpler Tizen app logic** — the player reduces to a single looping `<video>` element; no slide sequencing, no dual-decoder management, no DOM manipulation.
2. **Consistent rendering** — every display shows pixel-identical output since the server controls rendering.
3. **Fewer client-side bugs** — eliminates edge cases in slide transitions, orphaned video elements, and media load failures on the device.

### Critical Drawbacks

#### 1. Loss of Interactive / Dynamic Widget Types
- **`iframe`** widgets embed **live web pages** (dashboards, external content). A pre-rendered video cannot display live web content. This widget type would be completely broken.
- **`globaltext`** is a persistent overlay across all slides; rendering it into the video is possible but removes the ability to update it independently.
- **`table`** content may come from dynamic sources; pre-rendering freezes it at the time of generation.

#### 2. Significant Increase in File Size and Bandwidth
- Current approach: a 10-slide playlist with five 2 MB images and two 30 MB videos ≈ **70 MB** total download.
- Merged video approach: the same playlist at 1920×1080, H.264, ~4 Mbps for the full loop duration (e.g., 5 minutes) ≈ **150 MB** single file. Static image slides that currently cost kilobytes become high-bitrate video frames.
- Every playlist edit requires re-downloading the **entire** merged video, not just the changed slide's assets.

#### 3. High Server-Side Processing Cost
- Rendering slides to video requires a **headless browser** (e.g., Puppeteer/Playwright) to capture HTML/CSS layout as frames, then piping those frames through FFmpeg. FFmpeg alone cannot render HTML widgets, tables, or styled text.
- Each publish or playlist change triggers a full re-render — CPU and time cost scales with (number of slides × resolution × duration).
- Concurrent playlists across many companies multiply this load.

#### 4. Increased Content Update Latency
- Currently, the Tizen app picks up playlist changes in **~10 seconds** (next poll cycle).
- With the merged approach, every edit requires: server renders video (seconds to minutes depending on length) → uploads/stores new file → Tizen downloads entire file → playback restarts. Expect **minutes** of delay for any change.

#### 5. Text Quality Degradation
- Rich text rendered natively on Tizen is **crisp at any resolution**. Text encoded into a video is rasterized at a fixed resolution and subject to video compression artifacts, especially at lower bitrates required by Samsung display specs (≤8 Mbps).

#### 6. Loss of Existing Tizen Optimizations
- The dual-decoder approach in `slider.js` provides **seamless transitions** between slides with zero black frames — specifically engineered for Tizen hardware. A single-video approach loses fine-grained control over transitions and playback behavior.
- Single-slide playlists currently loop a video in-place efficiently; a merged video adds unnecessary re-encoding overhead.

#### 7. Device Storage Pressure
- Merged videos are larger, consuming more of the Tizen device's limited local storage.
- Re-downloads on every change compound this issue.

#### 8. No Partial Updates
- Currently, the app can update individual media files (only re-downloading changed assets). A merged video is all-or-nothing.

---

## Recommendation

**Do not implement FFmpeg slide merging.** The current client-side rendering architecture is better suited for this platform because:

- It supports all widget types, including live iframes and dynamic tables.
- It provides near-instant content updates (10-second polling).
- It minimizes bandwidth and storage usage by downloading only individual assets.
- It leverages Tizen-specific hardware optimizations (dual-decoder, seamless video transitions).
- Text and UI elements remain crisp at native resolution.

The only scenario where server-side merging could make sense is for **export/preview** — generating a preview video of a playlist for the admin dashboard. This would be a separate feature and would not replace the live playback mechanism on Tizen devices.

---

## Decision

Retain the current architecture: backend serves slide data as structured JSON, and the Tizen app handles rendering on-device.
