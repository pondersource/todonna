const rsConvenienceButtons = document.querySelectorAll('.rs-convenience-button');

const versionNumberSpan = document.getElementById('version-number');

versionNumberSpan.textContent = todonnaVersion;
document.title = 'Todonna ' + todonnaVersion;

// RS


const aTodoItem = {
    type: 'object',
    properties: {
        todo_item_text: {
            type: 'string'
        },
        todo_item_status: {
            type: 'string'
        },
        todo_item_id: {
            type: 'string'
        }

    },
    required: ['todo_item_text', 'todo_item_status', 'todo_item_id']
};

// Construct and dependency inject
const remoteStorage = new RemoteStorage({modules: [PonderSourceStorage.scopedModule('todonna', ['getAll', 'getObject', 'storeObject', 'remove', 'on', 'cache'], { aTodoItem, AppState: { type: 'object' } })], logging: false, changeEvents: { local: true, window: true, remote: true, conflicts: true }});
remoteStorage.setApiKeys(storageApiKeys);
remoteStorage.access.claim('todonna', 'rw');
const client = remoteStorage.todonna;


// Initialize
var widget = new Widget(remoteStorage, {
  solidProviders: { allowAnyProvider: true },
  skipInitial: true, logging: true, leaveOpen: true
});

widget.attach('remotestorage-widget-anchor');
client.cache('');

// remoteStorage.caching.enable('/todonna/');

remoteStorage.on('connected', function() {

    rsConvenienceButtons.forEach(function(button) {
        // button.classList.add('is-loading');
        button.removeAttribute('disabled');
        button.setAttribute('title', 'Remote is Connected');

        const userAddress = remoteStorage.remote.userAddress;
        console.debug('${userAddress} connected their remote storage.');

    });

    console.log('connected!');
});

remoteStorage.on('disconnected', function() {

    rsConvenienceButtons.forEach(function(button) {
        button.setAttribute('disabled', '');
        button.setAttribute('title', 'Remote is Disconnected');
    });

    console.log('disconnected!');
});

mountTodoList(client).catch(console.error);
TDN.prefs.loadTheme();
