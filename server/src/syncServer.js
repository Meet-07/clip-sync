import http from 'http';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import QRCode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIST_DIR = path.join(__dirname, '..', '..', 'client', 'dist');

export class SyncServer {
  constructor({ port = 7331, historyManager, clipboardWatcher }) {
    this.port = port;
    this.historyManager = historyManager;
    this.clipboardWatcher = clipboardWatcher;
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server, path: '/ws' });
    this.connectedClients = new Set();
    this.localIp = this._getPrimaryLocalIp();
    this.qrCodeDataUrl = '';

    this._setupExpress();
    this._setupWebSocket();
  }

  _getPrimaryLocalIp() {
    const interfaces = os.networkInterfaces();
    let fallbackIp = '127.0.0.1';
    let wifiIp = null;
    let bluetoothIp = null;
    let ethernetIp = null;

    for (const [name, nets] of Object.entries(interfaces)) {
      const lower = name.toLowerCase();
      // Skip known virtual adapters
      if (
        lower.includes('virtualbox') ||
        lower.includes('vmware') ||
        lower.includes('vethernet') ||
        lower.includes('wsl') ||
        lower.includes('loopback')
      ) {
        continue;
      }

      for (const net of nets || []) {
        if (net.family === 'IPv4' && !net.internal) {
          // Skip VirtualBox MAC addresses (0a:00:27:... / 08:00:27:...)
          if (net.mac && (net.mac.startsWith('0a:00:27') || net.mac.startsWith('08:00:27'))) {
            continue;
          }

          if (lower.includes('bluetooth') || lower.includes('bt') || lower.includes('bth') || lower.includes('pan')) {
            bluetoothIp = net.address;
          } else if (lower.includes('wi-fi') || lower.includes('wlan') || lower.includes('wireless')) {
            wifiIp = net.address;
          } else if (lower.includes('ethernet') && !ethernetIp) {
            ethernetIp = net.address;
          } else if (fallbackIp === '127.0.0.1') {
            fallbackIp = net.address;
          }
        }
      }
    }

    // Priority: Wi-Fi -> Bluetooth Tethering (PAN) -> Ethernet -> Fallback
    return wifiIp || bluetoothIp || ethernetIp || fallbackIp;
  }

  getAllLocalIps() {
    const ips = [];
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          ips.push({ name, ip: net.address });
        }
      }
    }
    return ips;
  }

  _setupExpress() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));

    // Serve built client static files if available
    this.app.use(express.static(CLIENT_DIST_DIR));

    // API Routes
    this.app.get('/api/info', async (req, res) => {
      const accessUrl = `http://${this.localIp}:${this.port}`;
      if (!this.qrCodeDataUrl) {
        this.qrCodeDataUrl = await QRCode.toDataURL(accessUrl, { margin: 2, scale: 6 });
      }
      res.json({
        name: 'ClipSync Silent Service',
        version: '1.0.0',
        port: this.port,
        localIp: this.localIp,
        allIps: this.getAllLocalIps(),
        accessUrl,
        qrCode: this.qrCodeDataUrl,
        connectedDevices: this.connectedClients.size,
        stats: this.historyManager.getStats()
      });
    });

    this.app.get('/api/history', (req, res) => {
      const { search = '', type = 'all', limit = 500 } = req.query;
      const items = this.historyManager.getItems({
        search,
        type,
        limit: Math.min(parseInt(limit, 10) || 500, 500)
      });
      res.json({ items, total: items.length });
    });

    this.app.post('/api/copy', async (req, res) => {
      const { text, source = 'phone' } = req.body;
      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: 'Valid text is required' });
      }

      const item = this.historyManager.addItem({ text, source });
      if (item) {
        // Automatically write to Windows clipboard
        await this.clipboardWatcher.writeToClipboard(text);
        this.broadcast({ type: 'NEW_CLIP', data: item });
      }

      res.json({ success: true, item });
    });

    this.app.post('/api/history/:id/pin', (req, res) => {
      const item = this.historyManager.togglePin(req.params.id);
      if (!item) return res.status(404).json({ error: 'Item not found' });
      this.broadcast({ type: 'ITEM_UPDATED', data: item });
      res.json({ success: true, item });
    });

    this.app.delete('/api/history/:id', (req, res) => {
      const item = this.historyManager.deleteItem(req.params.id);
      if (!item) return res.status(404).json({ error: 'Item not found' });
      this.broadcast({ type: 'ITEM_DELETED', id: req.params.id });
      res.json({ success: true, item });
    });

    this.app.post('/api/history/clear', (req, res) => {
      const { keepPinned = true } = req.body;
      const remaining = this.historyManager.clear(keepPinned);
      this.broadcast({ type: 'HISTORY_CLEARED', remaining });
      res.json({ success: true, count: remaining.length });
    });

    // Fallback route for client SPA routing (Express 5 compatible)
    this.app.use((req, res) => {
      res.sendFile(path.join(CLIENT_DIST_DIR, 'index.html'), err => {
        if (err) {
          res.send(`
            <html>
              <head><title>ClipSync Service</title><style>body{font-family:sans-serif;padding:40px;text-align:center;background:#0f172a;color:#f8fafc;}</style></head>
              <body>
                <h2>ClipSync Server is Running</h2>
                <p>Client build in progress. Access URL: <code>http://${this.localIp}:${this.port}</code></p>
              </body>
            </html>
          `);
        }
      });
    });
  }

  _setupWebSocket() {
    this.wss.on('connection', ws => {
      this.connectedClients.add(ws);
      console.log(`[SyncServer] Mobile device connected. Total active devices: ${this.connectedClients.size}`);

      // Send initial history and stats
      ws.send(JSON.stringify({
        type: 'INIT',
        history: this.historyManager.getItems({ limit: 500 }),
        stats: this.historyManager.getStats(),
        serverInfo: {
          localIp: this.localIp,
          port: this.port
        }
      }));

      ws.on('message', async rawData => {
        try {
          const message = JSON.parse(rawData.toString());
          await this._handleClientMessage(ws, message);
        } catch (err) {
          console.error('[SyncServer] Error parsing client message:', err.message);
        }
      });

      ws.on('close', () => {
        this.connectedClients.delete(ws);
        console.log(`[SyncServer] Device disconnected. Remaining: ${this.connectedClients.size}`);
      });

      ws.on('error', err => {
        console.error('[SyncServer] WebSocket error:', err.message);
        this.connectedClients.delete(ws);
      });
    });

    // Keepalive ping every 15s
    setInterval(() => {
      this.connectedClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      });
    }, 15000);
  }

  async _handleClientMessage(ws, message) {
    switch (message.type) {
      case 'COPY_TO_PC': {
        const { text } = message;
        if (text && typeof text === 'string') {
          const item = this.historyManager.addItem({ text, source: 'phone' });
          if (item) {
            // Write to PC Windows clipboard
            await this.clipboardWatcher.writeToClipboard(text);
            this.broadcast({ type: 'NEW_CLIP', data: item });
          }
        }
        break;
      }
      case 'TOGGLE_PIN': {
        const item = this.historyManager.togglePin(message.id);
        if (item) {
          this.broadcast({ type: 'ITEM_UPDATED', data: item });
        }
        break;
      }
      case 'DELETE_ITEM': {
        const item = this.historyManager.deleteItem(message.id);
        if (item) {
          this.broadcast({ type: 'ITEM_DELETED', id: message.id });
        }
        break;
      }
      case 'CLEAR_HISTORY': {
        const remaining = this.historyManager.clear(message.keepPinned !== false);
        this.broadcast({ type: 'HISTORY_CLEARED', remaining });
        break;
      }
      case 'PING': {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        break;
      }
    }
  }

  broadcast(data) {
    const payload = JSON.stringify(data);
    this.connectedClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  async start() {
    return new Promise(resolve => {
      this.server.listen(this.port, '0.0.0.0', async () => {
        const url = `http://${this.localIp}:${this.port}`;
        console.log('====================================================');
        console.log(`🚀 ClipSync Silent Server running on:`);
        console.log(`   Local URL:    http://localhost:${this.port}`);
        console.log(`   Phone Access: ${url}`);
        console.log('====================================================');

        try {
          this.qrCodeDataUrl = await QRCode.toDataURL(url, { margin: 2, scale: 6 });
          if (process.stdout && process.stdout.isTTY) {
            console.log('\nScan this QR code from your phone to open the app:\n');
            qrcodeTerminal.generate(url, { small: true });
          }
        } catch (e) {
          // Ignore terminal QR generation error if unsupported
        }

        resolve(url);
      });
    });
  }

  stop() {
    this.wss.close();
    this.server.close();
  }
}
