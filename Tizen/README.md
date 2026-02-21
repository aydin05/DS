# Tizen TV Apps

This directory contains two Samsung Tizen TV web applications and a browser-based demo player.

## Apps

### 1. DigitalSignatureApp (`DigitalSignatureApp.wgt` — 158 KB)
Plays playlists (images, videos, text, tables, iframes) on Samsung TVs. Fetches playlist data from the backend API and auto-refreshes every 10 seconds.

### 2. DeviceStatusApp (`DeviceStatusApp.wgt` — 27 KB)
Monitors device health status. Shows active/inactive devices with filters, search, and detail views. Uses token-based authentication.

### 3. Playlist Demo (`playlist_demo.html`)
Browser-based demo of the DigitalSignatureApp player. Fetches real playlists from the backend and plays them locally. Auto-refreshes every 10 seconds. Open via `http://localhost:8888/playlist_demo.html`.

---

## Compatibility

| Tizen Version | Samsung TV Year | Supported |
|---------------|----------------|-----------|
| 4.0+          | 2018+          | Yes       |
| 7.0           | 2022           | Yes       |

Both apps use `required_version="4.0"` in their config.xml.

---

## Backend Connection

The apps connect to the backend API at `http://164.92.179.18/api/v1/`. The backend and TV do **not** need to be on the same network — any internet connection works.

### Key API Endpoints

| Endpoint | Method | Used By | Purpose |
|----------|--------|---------|---------|
| `/api/v1/playlist/` | POST | DigitalSignatureApp | Fetch playlist (`{username, password}`) |
| `/api/v1/accounts/login/` | POST | DeviceStatusApp | User login (`{email, password}`) |
| `/api/v1/core/logs/` | GET | DeviceStatusApp | Device status list |
| `/api/v1/core/device-logs/` | POST | DigitalSignatureApp (logger) | Send device logs |

---

## How Playlists Work

1. **Create a playlist** in the frontend editor (React app at `:3000` or `:3333`)
2. **Add slides** (images, videos, text, etc.)
3. **Click "Save"** — saves to `extra_fields` (draft state)
4. **Click "Publish"** — creates actual Slide records in the database
5. **Assign the playlist** to a Display (inside Branches page)
6. The TV app fetches published slides every 10 seconds

> **Important:** The TV app only shows **published** slides. If you edit a playlist but don't publish, the TV won't see the changes.

---

## How Device Status Works

1. Admin creates a **Display** in the frontend (Branches → select branch → Add Display)
2. The Display gets a `username` and `password` (device credentials)
3. When the Tizen app runs on a TV with those credentials, it sends periodic logs to the backend
4. The backend creates/updates a `DeviceLog` entry
5. A device is **Active** if it sent a log within the last **120 seconds**, otherwise **Inactive**

> **Note:** A Display only appears in the Device Status page after the TV app sends its first log. Simply creating a Display won't add it to the status list.

---

## Installing on Samsung TVs

### Prerequisites
- [Samsung Developer Account](https://developer.samsung.com/) (free)
- [Tizen Studio](https://developer.tizen.org/development/tizen-studio/download) installed on your PC/Mac
- TV and PC on the same Wi-Fi network (for installation only)

### Step 1: Enable Developer Mode on TV
1. Open **Apps** on the TV
2. Press **1-2-3-4-5** on the remote (numpad)
3. Developer Mode toggle appears — turn it **ON**
4. Enter your PC's local IP address (e.g., `192.168.1.100`)
5. Restart the TV

### Step 2: Create a Samsung Certificate
1. Open **Tizen Studio → Certificate Manager**
2. Click **+** to create a new certificate profile
3. Select **Samsung** certificate type
4. Choose **TV** as the device type
5. Sign in with your Samsung Developer account
6. Add your TV's **DUID** (shown in Developer Mode settings on the TV)
7. Complete the wizard

### Step 3: Sign the .wgt Files
1. Open **Tizen Studio**
2. Go to **Tools → Certificate Manager** and select your certificate profile
3. Right-click the project → **Build Signed Package**
4. Or use CLI:
   ```bash
   tizen package -t wgt -s <certificate-profile-name> -- /path/to/DigitalSignatureApp/
   tizen package -t wgt -s <certificate-profile-name> -- /path/to/DeviceStatusApp/
   ```

### Step 4: Install on TV
1. Open **Tizen Studio → Device Manager**
2. Click **Remote Device Manager** → **Scan** or add TV IP manually
3. Connect to the TV
4. Right-click the TV → **Install App** → select the signed `.wgt` file
5. The app appears in the TV's app list

### Alternative: Install via SDB (command line)
```bash
# Connect to TV
sdb connect <TV-IP-ADDRESS>

# Install the app
sdb install /path/to/DigitalSignatureApp.wgt
sdb install /path/to/DeviceStatusApp.wgt
```

---

## Sharing .wgt Files with Your Team

| Method | Steps |
|--------|-------|
| **USB** | Copy `.wgt` to USB → plug into TV → install via Tizen device manager on a PC connected to TV |
| **Email / Slack** | Send the `.wgt` file; recipient uses Tizen Studio to install |
| **Google Drive** | Upload and share the link |
| **Samsung Seller Office** | Upload as a private app for managed TV deployment at scale |

> **Important:** Each team member who installs the app on a different TV needs to add that TV's DUID to the certificate. Or use a **Distributor Certificate** that works on any TV.

---

## Project Structure

```
Tizen/
├── DigitalSignatureApp/          # Playlist player app
│   ├── config.xml                # App config (package: x5zi5EOBpv)
│   ├── index.html                # Main HTML
│   ├── icon.png                  # App icon
│   ├── css/
│   │   ├── style.css
│   │   ├── styleLandscape.css
│   │   └── stylePortrait.css
│   ├── js/
│   │   ├── main.js               # App entry, playlist fetching, auto-refresh
│   │   ├── slider.js             # Slide player (video fix included)
│   │   ├── controller.js         # File download manager
│   │   ├── player.js             # Basic video player wrapper
│   │   ├── logger.js             # Structured logging + server log shipping
│   │   └── jquery.js             # jQuery
│   └── images/
│       └── loading.gif
│
├── DeviceStatusApp/              # Device monitoring app
│   ├── config.xml                # App config (package: d3v1c3StMs)
│   ├── index.html                # Login + dashboard UI
│   ├── icon.png                  # App icon
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js                # All logic (auth, API, rendering, filters)
│
├── playlist_demo.html            # Browser demo player
├── DigitalSignatureApp.wgt       # Packaged app (unsigned)
├── DeviceStatusApp.wgt           # Packaged app (unsigned)
└── README.md                     # This file
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| TV rejects .wgt installation | The .wgt needs to be signed with a Samsung certificate |
| App shows "Tizen object not found" | The DigitalSignatureApp can only run on a real Tizen TV, not in a browser. Use `playlist_demo.html` for browser testing |
| Playlist not updating on TV | Make sure you clicked **Publish** in the frontend editor after saving |
| Device not appearing in Device Status | The TV app must send at least one log first. Simply creating a Display isn't enough |
| Video stuck between slides | Fixed in `slider.js` — old video decoder is released before starting new video |
| App won't install on Tizen 4 TV | Both apps support Tizen 4.0+. If `fetch()` fails on Tizen 4, an XMLHttpRequest fallback may be needed |
| "No slides in this playlist" | The playlist has no published slides. Go to the editor → Save → Publish |
