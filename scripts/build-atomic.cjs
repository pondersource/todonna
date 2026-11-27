const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const index = read('index.html');
const home = index.slice(index.indexOf('<section data-page="home"'), index.indexOf('<section class="section" data-page="settings"'));
const undo = index.slice(index.indexOf('<div id="notification-undo-delete"'), index.indexOf('</body>')).trim();
const markup = (home + undo).replace(/\s+onclick="[^"]*"/g, '');
const css = ['todonna.css', 'todonna-bulma-light.css'].map(file => read('css/' + file)
    .replace(/@import\s+url\(https:\/\/fonts\.googleapis\.com\/[^)]*\);/g, '')).join('\n');
const font = fs.readFileSync(path.join(root, 'font/mobilohm-font.woff2')).toString('base64');
const icons = read('css/mobilohm-font.css').slice(read('css/mobilohm-font.css').indexOf('[class^="icon-"]'));
const stylesheet = css + '\n@font-face{font-family:mobilohm-font;src:url(data:font/woff2;base64,' + font + ') format("woff2");}\n' + icons;
const exported = `
export async function view({root, store}) {
    const client = await atomicTodoClient(store);
    root.innerHTML = ${JSON.stringify(markup)};
    const style = document.createElement('style');
    style.textContent = ${JSON.stringify(stylesheet)};
    root.prepend(style);

    const tabs = Array.from(root.querySelectorAll('#tabs .tablinks'));
    for (const [index, tab] of tabs.entries()) {
        tab.addEventListener('click', () => {
            tabs.forEach((link, position) => link.parentElement.classList.toggle('is-active', index === position));
            root.querySelector('#Todo').style.display = index === 0 ? 'block' : 'none';
            root.querySelector('#Done').style.display = index === 1 ? 'block' : 'none';
        });
    }
    await mountTodoList(client);
}
`;
const output = path.join(root, 'public/atomic');
fs.mkdirSync(output, {recursive: true});
fs.writeFileSync(path.join(output, 'todonna-0.1.0.js'), [read('js/list.js'), read('js/atomic-list.js'), exported].join('\n'));
