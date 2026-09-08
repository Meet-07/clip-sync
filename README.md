# ClipSync • Cross-Platform Clipboard Manager

> **Remember up to 500 copied texts & sync seamlessly between PC and Phone — 100% silently on PC with no desktop app required!**

---

## 🌟 Key Features

- **Last 500 Copied Texts Buffer**:
  - Automatically remembers up to 500 clipboard entries in a FIFO (First-In, First-Out) buffer.
  - Automatic deduplication of identical consecutive copies.
  - **Star / Pin** favorite items so they are permanently protected from being purged.
  - Persistent offline storage (saved in `IndexedDB` on phone & `history.json` on PC).

- **100% Silent on PC (Zero Desktop Window Required)**:
  - Runs silently in the background with zero open console or browser windows.
  - Detects `Ctrl+C` in any PC application (browser, Word, VS Code, Notepad, terminal, etc.) and silently syncs to your phone in real time (<10ms).
  - Automatically updates the Windows clipboard when you send text from your phone, making it immediately available for `Ctrl+V` on PC.

- **Dedicated Mobile App (PWA)**:
  - Open on any mobile browser and tap **"Add to Home Screen"** to install it as a standalone app on your phone with zero app store setup.
  - **1-Tap Copy**: Tap "Copy" on any item to set it to your phone's clipboard.
  - **Instant Search**: Search through all 500 items in real time.
  - **Smart Category Filters**: Automatically classifies text into *Links/URLs*, *Code Snippets*, *Emails/Phone Numbers*, *Pinned*, and *Plain Text*.
  - **Send to PC**: Paste or type text on phone to push it directly into your PC's active clipboard.
  - **Native Sharing**: Share any clip directly to WhatsApp, Telegram, Notes, or email via the native mobile share sheet.

---

## 🚀 Quick Start Guide

### 1. Launch on PC
In the `clip-sync` directory, double-click one of the following:

- **`START_SILENT.bat`** *(Recommended)*:
  Runs the service completely invisibly in the background. No window stays open.
- **`START_IN_TERMINAL.bat`**:
  Runs in a visible command window showing live activity logs and connection events.
- **`STATUS_AND_QR.bat`**:
  Checks if the service is running, shows your local Wi-Fi IP address, and displays a QR code for mobile pairing.
- **`STOP_SILENT.bat`**:
  Stops the silent background service anytime.

---

### 2. Connect Your Phone
1. Ensure your phone and PC are connected to the same Wi-Fi router (or phone mobile hotspot).
2. Scan the QR code displayed when you run `STATUS_AND_QR.bat` with your phone camera, OR open your mobile browser and navigate to:
   ```
   http://<YOUR-PC-IP>:7331
   ```
   *(e.g., `http://10.245.55.51:7331`)*

3. **Install to Home Screen (Mobile App Mode)**:
   - **Android (Chrome/Edge)**: Tap the 3 dots in the top-right &rarr; Tap **"Add to Home screen"** or **"Install app"**.
   - **iPhone (Safari)**: Tap the **Share** button at the bottom &rarr; Tap **"Add to Home Screen"**.

Now you have a full standalone app icon on your phone!

---

## 🛠️ Project Structure

```
clip-sync/
├── START_SILENT.bat        <- Start silently in background (0 windows)
├── START_IN_TERMINAL.bat   <- Start with visible terminal logs
├── STATUS_AND_QR.bat       <- Check status & print pairing QR code
├── STOP_SILENT.bat         <- Cleanly stop the background process
├── server/
│   ├── src/
│   │   ├── clipboardWatcher.js  <- Silent Windows clipboard monitor (Ctrl+C & auto-paste)
│   │   ├── historyManager.js    <- 500-item FIFO ring buffer with pin protection
│   │   ├── syncServer.js        <- Express + WebSockets + Smart Wi-Fi IP detection
│   │   └── index.js             <- Main service entrypoint
│   ├── scripts/                 <- Launcher and status scripts
│   ├── test/
│   │   ├── history.test.js      <- Unit tests for 500 limit & FIFO buffer
│   │   └── integration.test.js  <- End-to-end PC & Phone sync test
│   └── data/history.json        <- Saved history
└── client/
    ├── src/                     <- Mobile App (React, Tailwind styling, PWA)
    │   ├── components/          <- Cards, Search, Categories, Modals, Toasts
    │   ├── hooks/               <- WebSocket sync & IndexedDB caching
    │   └── utils/               <- Dual-mode clipboard & content detector
    └── dist/                    <- Production build served directly by server
```

---

## 🧪 Running Automated Tests

Run the unit tests:
```bash
cd server
npm test
```

Run the end-to-end integration test:
```bash
cd server
node test/integration.test.js
```
