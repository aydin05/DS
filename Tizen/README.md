# Tizen TV — SimpleUrlLauncher

Lightweight Samsung Tizen TV app that loads the OpenLink web page in a full-screen iframe. All playlist rendering is handled server-side via **merged video** — the TV simply plays a single looping MP4.

## Architecture

```
TV (SimpleUrlLauncher)
  └── iframe → https://aydin.technolink.az/branches/open-link/{username}
                  └── OpenLink React component
                        └── <video src="{merged_video_url}" loop />
```

- **No slide-by-slide rendering on the device** — eliminates decoder switching, black frames, and stuttering on Tizen 4
- **Merged video** is generated server-side (FFmpeg) on every Publish
- **OpenLink** polls the backend every 30s for updates and plays the merged video

---

## Compatibility

| Tizen Version | Samsung TV Year | Supported |
|---------------|----------------|-----------|
| 4.0+          | 2018+          | Yes       |
| 7.0           | 2022           | Yes       |

---

## How It Works

1. **Create a playlist** in the frontend editor
2. **Add slides** (images, videos, text, etc.) and **Save**
3. **Click Publish** — backend generates a merged MP4 video from all slides
4. **Assign the playlist** to a Display (Branches page)
5. TV loads the OpenLink page → plays the merged video in a loop
6. On re-publish, the old video keeps playing until the new merge completes (no interruption)

---

## Device Tracking

- **Heartbeat**: OpenLink sends a heartbeat every 30 seconds
- **Device Logs**: OpenLink reports events (startup, playlist changes, video errors, API failures) every 30 seconds
- **Status**: Devices appear as Active/Inactive in the admin Device Status page

---

## Installing on Samsung TVs

### Prerequisites
- [Samsung Developer Account](https://developer.samsung.com/) (free)
- [Tizen Studio](https://developer.tizen.org/development/tizen-studio/download)
- TV and PC on the same Wi-Fi network (for installation only)

### Steps
1. Enable **Developer Mode** on TV: Apps → press 1-2-3-4-5 → enable → enter PC IP → restart
2. Create a **Samsung Certificate** in Tizen Studio Certificate Manager (add TV DUID)
3. Build signed package: right-click project → **Build Signed Package**
4. Connect to TV via **Device Manager** → install the `.wgt` file

### CLI alternative
```bash
sdb connect <TV-IP>
sdb install SimpleUrlLauncher.wgt
```

---

## Project Structure

```
Tizen/
├── SimpleUrlLauncher/
│   ├── config.xml          # Tizen app config (required_version 4.0)
│   ├── index.html          # Settings UI + iframe loader
│   ├── .project             # Tizen Studio project file
│   └── .tproject            # Tizen Studio platform config
├── sssp/
│   ├── index.html          # SSSP placeholder
│   └── sssp_config.xml     # SSSP auto-update config
└── README.md               # This file
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| TV rejects .wgt | Sign with Samsung certificate including TV's DUID |
| Black screen after install | Enter the OpenLink URL in the app settings screen |
| Video not playing | Ensure playlist is published and merged video generation completed |
| "Waiting for merged video..." | Playlist hasn't been published yet, or merge is still processing |
| Device not in status page | Wait ~30s for the first heartbeat to be sent |
