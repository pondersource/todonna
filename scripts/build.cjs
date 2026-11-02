const fs = require('node:fs');
const path = require('node:path');
const output = path.join(__dirname, '../public');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const name of ['index.html', 'manifest.json', 'sw.js', 'css', 'font', 'img', 'js']) {
  fs.cpSync(path.join(__dirname, '..', name), path.join(output, name), { recursive: true });
}
fs.mkdirSync(path.join(output, 'vendor'));
for (const [source, name] of [
  ['remotestoragejs/release/remotestorage.js', 'remotestorage.js'],
  ['remotestorage-widget/build/widget.js', 'widget.js'],
]) {
  fs.copyFileSync(path.join(__dirname, '../node_modules', source), path.join(output, 'vendor', name));
}
