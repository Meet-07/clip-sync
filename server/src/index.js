import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { HistoryManager } from './historyManager.js';
import { ClipboardWatcher } from './clipboardWatcher.js';
import { SyncServer } from './syncServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PID_FILE = path.join(__dirname, '..', 'server.pid');

process.on('uncaughtException', err => {
  console.error('[ClipSync] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[ClipSync] Unhandled Rejection:', reason);
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 7331;

async function main() {
  // Save current PID for easy stop-silent.bat termination
  try {
    fs.writeFileSync(PID_FILE, process.pid.toString(), 'utf-8');
  } catch (err) {
    console.error('Failed to write PID file:', err.message);
  }

  const historyManager = new HistoryManager();

  let syncServer = null;

  const clipboardWatcher = new ClipboardWatcher({
    historyManager,
    pollIntervalMs: 400,
    onCopy: (item) => {
      // When PC copies something, broadcast to all connected phones
      if (syncServer) {
        syncServer.broadcast({ type: 'NEW_CLIP', data: item });
      }
    }
  });

  syncServer = new SyncServer({
    port: PORT,
    historyManager,
    clipboardWatcher
  });

  await syncServer.start();
  await clipboardWatcher.start();

  const shutdown = (sig) => {
    try {
      fs.appendFileSync(path.join(__dirname, '..', 'shutdown.log'), `Shutdown called with signal: ${sig} at ${new Date().toISOString()}\n`);
    } catch {}
    clipboardWatcher.stop();
    syncServer.stop();
    try {
      if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    } catch {}
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('exit', (code) => {
    try {
      fs.appendFileSync(path.join(__dirname, '..', 'shutdown.log'), `Process exit event with code: ${code}\n`);
    } catch {}
  });
}

main().catch(err => {
  console.error('[ClipSync] Fatal error during startup:', err);
  process.exit(1);
});
