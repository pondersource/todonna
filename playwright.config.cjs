const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  use: { baseURL: process.env.TODONNA_URL || 'http://127.0.0.1:8106/', launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } },
  webServer: [
    ...(process.env.TODONNA_URL ? [] : [{ command: 'npm start', url: 'http://127.0.0.1:8106' }]),
    { command: 'node tests/storage-server.cjs', url: 'http://127.0.0.1:8111' },
  ],
});
