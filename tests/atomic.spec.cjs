const { readFileSync } = require('node:fs');
const { test, expect } = require('@playwright/test');

function run(source) {
    const core = 'https://atomicdata.dev/properties/';
    const table = 'https://example.test/tasks';
    const rowClass = table + '/task';
    const rows = new Map();
    let next = 0;
    function resource(subject) {
        const values = {...rows.get(subject)};
        return {
            get: property => values[property],
            set: (property, value) => { values[property] = value; },
            save: async () => { rows.set(subject, values); },
            destroy: async () => { rows.delete(subject); },
        };
    }
    const store = {
        getData: async () => ({table, rowClass}),
        query: async ({property, value}) => [...rows].filter(([, row]) => row[property] === value).map(([key]) => key),
        getMany: async subjects => subjects.map(resource),
        newResource: async ({parent, isA, propVals}) => {
            rows.set(table + '/' + ++next, {...propVals, [core + 'parent']: parent, [core + 'isA']: isA});
        },
    };

    window.addEventListener('message', async ({data}) => {
        if (data === 'snapshot') {
            window.parent.postMessage([...rows], '*');
        } else if (Array.isArray(data)) {
            for (const [key, value] of data) rows.set(key, value);
            next = rows.size;
            const url = URL.createObjectURL(new Blob([source], {type: 'text/javascript'}));
            const {view} = await import(url);
            URL.revokeObjectURL(url);
            await view({root: document.getElementById('root'), store});
        }
    });
}

test('Todonna works in Atomic’s sandbox and reloads separate tasks', async ({ page, request }) => {
    const asset = 'atomic/todonna-0.1.0.js';
    const source = readFileSync('public/' + asset, 'utf8');
    const response = await request.get(asset, {headers: {Origin: 'https://atomic.place'}});
    expect(response.ok()).toBe(true);
    expect(await response.text()).toBe(source);
    if (process.env.TODONNA_URL) expect(response.headers()['access-control-allow-origin']).toBe('*');

    const payload = JSON.stringify(source).replace(/</g, '\\u003c');
    const document = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-demo' blob:; style-src 'unsafe-inline'; font-src data:; img-src data:; connect-src 'none'">
<div id="root"></div><script type="module" nonce="demo">(${run})(${payload})</script>`;
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setContent('<iframe id="app" width="1000" height="640" sandbox="allow-scripts allow-modals"></iframe>');
    const iframe = page.locator('#app');
    const frame = page.frameLocator('#app');

    async function open(rows) {
        await iframe.evaluate((element, {document, rows}) => new Promise(resolve => {
            element.addEventListener('load', () => {
                element.contentWindow.postMessage(rows, '*');
                resolve();
            }, {once: true});
            element.srcdoc = document;
        }), {document, rows});
        await expect(frame.getByPlaceholder('New item')).toBeVisible();
    }

    await open([]);
    for (const task of ['Buy milk', 'Buy apples']) {
        await frame.getByPlaceholder('New item').fill(task);
        await frame.getByRole('button', {name: 'Add', exact: true}).click();
        await expect(frame.locator('#todo-list').getByText(task)).toBeVisible();
    }
    const milk = frame.locator('#todo-list tr').filter({hasText: 'Buy milk'});
    await milk.getByTitle('Change todo item state').click();
    await frame.locator('#week-tab').click();
    await expect(frame.locator('#done-list').getByText('Buy milk')).toBeVisible();
    const rows = await iframe.evaluate(element => new Promise(resolve => {
        window.addEventListener('message', event => resolve(event.data), {once: true});
        element.contentWindow.postMessage('snapshot', '*');
    }));
    expect(rows).toHaveLength(2);
    await open(rows);
    await expect(frame.locator('#todo-list').getByText('Buy apples')).toBeVisible();
    await frame.locator('#week-tab').click();
    await expect(frame.locator('#done-list').getByText('Buy milk')).toBeVisible();
    expect(errors).toEqual([]);
});
