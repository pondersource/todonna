const Armadietto = require('armadietto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'todonna-sync-'));
const server = new Armadietto({
  store: new Armadietto.FileTree({ path: directory }),
  http: { host: '127.0.0.1', port: 8111 },
  https: {},
  allow: { signup: true },
  logging: { stdout: ['error'], log_files: [] },
});
server.boot();
process.on('SIGTERM', () => {
  fs.rmSync(directory, { recursive: true, force: true });
  process.exit();
});
