const express = require('express');
const cors = require('cors');
const config = require('./config');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- In-memory session store ---
// Map<normalizedUUID, { username: string, lastSeen: number }>
const sessions = new Map();

// --- UUID normalization ---
// Converts to lowercase and strips all dashes for reliable lookup
function normalizeUuid(uuid) {
  if (typeof uuid !== 'string') return '';
  return uuid.toLowerCase().replace(/-/g, '');
}

// --- Helper: format timestamp for console logs ---
function formatTimestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

// --- POST /api/vanta/ping ---
// Registers or refreshes an active user session
app.post('/api/vanta/ping', (req, res) => {
  const { uuid, username } = req.body;

  if (!uuid || !username) {
    console.warn(`[${formatTimestamp()}] [Vanta API] Ping rejected: missing uuid or username`);
    return res.status(400).json({ error: 'Missing required fields: uuid, username' });
  }

  const normalizedUuid = normalizeUuid(uuid);
  if (!normalizedUuid) {
    console.warn(`[${formatTimestamp()}] [Vanta API] Ping rejected: invalid uuid format`);
    return res.status(400).json({ error: 'Invalid uuid format' });
  }

  sessions.set(normalizedUuid, {
    username: String(username),
    lastSeen: Date.now(),
  });

  console.log(`[${formatTimestamp()}] [Vanta API] User [${username}] pinged`);

  res.json({ status: 'ok' });
});

// --- GET /api/vanta/active ---
// Returns the list of active UUIDs within the session timeout window
app.get('/api/vanta/active', (_req, res) => {
  const now = Date.now();
  const timeoutMs = config.SESSION_TIMEOUT_MINUTES * 60 * 1000;

  const activeUuids = [];

  for (const [uuid, session] of sessions) {
    if (now - session.lastSeen < timeoutMs) {
      activeUuids.push(uuid);
    }
  }

  res.json({ active: activeUuids });
});

// --- Background cleanup ---
// Periodically removes stale sessions to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  const timeoutMs = config.SESSION_TIMEOUT_MINUTES * 60 * 1000;
  let removedCount = 0;

  for (const [uuid, session] of sessions) {
    if (now - session.lastSeen >= timeoutMs) {
      sessions.delete(uuid);
      removedCount++;
    }
  }

  if (removedCount > 0) {
    console.log(
      `[${formatTimestamp()}] [Vanta API] Cleanup: removed ${removedCount} stale session(s), ` +
      `${sessions.size} active session(s) remaining`
    );
  }
}, config.CLEANUP_INTERVAL_MINUTES * 60 * 1000);

// --- Start server ---
app.listen(config.PORT, '0.0.0.0', () => {
  console.log('============================================');
  console.log('  Vanta Launcher API Server');
  console.log('============================================');
  console.log(`  Port:                  ${config.PORT}`);
  console.log(`  Session timeout:       ${config.SESSION_TIMEOUT_MINUTES} min`);
  console.log(`  Cleanup interval:      ${config.CLEANUP_INTERVAL_MINUTES} min`);
  console.log('--------------------------------------------');
  console.log('  Endpoints:');
  console.log(`  POST  /api/vanta/ping   - Register activity`);
  console.log(`  GET   /api/vanta/active - List active UUIDs`);
  console.log('--------------------------------------------');
  console.log('  Client mods should connect to:');
  console.log(`  http://<PUBLIC_IP>:${config.PORT}/api/vanta/...`);
  console.log('============================================');
});