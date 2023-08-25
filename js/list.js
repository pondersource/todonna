const rsConvenienceButtons = document.querySelectorAll('.rs-convenience-button');
const rsConsoleList = document.querySelector('ul#rs-console-list');

const todoListContainer = document.getElementById('todo-list');
const doneListContainer = document.getElementById('done-list');

const notificationUndo = document.getElementById('notification-undo-delete');

const newItemInput = document.getElementById('new-item-input');
newItemInput.addEventListener('click', () => {
    newItemInput.classList.add('is-success');
    newItemInput.classList.remove('is-danger');
});

function handleKeyPress(event) {
    if (event.keyCode === 13 || event.which === 13) {
        addTodo(event);
    }
}

function consoleEvent(event) {
    var li = document.createElement('li');
    li.textContent = event;
    rsConsoleList.appendChild(li);
}

async function addTodo(evt) {
    var id = "id" + Math.random().toString(16).slice(2);
    if (newItemInput.value.length) {
        try {
            addTodoItem({...todoItem,
                         todo_item_text: newItemInput.value,
                         todo_item_status: 'todo',
                         todo_item_id: id});
        } catch (error) {
            console.error('Error adding todo item:', error);
        }
    } else {
        newItemInput.classList.add('is-danger');
    }
}

function createItemRow (item, isNew) {

    // console.log('item: ', item);

    const tableRow = document.createElement('tr');

    const textCell = document.createElement('td');
    textCell.className = 'item-text-td'; // Adding the class for full width
    textCell.textContent = item.todo_item_text;

    const buttonCell = document.createElement('td');
    buttonCell.className = 'item-buttons is-flex'; // Adding the class for right alignment
    const changeStatusButton = document.createElement('button');
    changeStatusButton.className = 'button is-medium item-button';
    // changeStatusButton.textContent = 'X';
    const removeButton = document.createElement('button');
    removeButton.className = 'button is-medium icon-trash item-button';

    const changeStatusButtonIconClass = item.todo_item_status == 'todo' ? ['icon-check-false', 'item-todo'] : ['icon-check-true', 'item-done'];

    changeStatusButton.classList.add(...changeStatusButtonIconClass);

    buttonCell.appendChild(removeButton);
    buttonCell.appendChild(changeStatusButton);
    tableRow.appendChild(textCell);
    tableRow.appendChild(buttonCell);

    tableRow.setAttribute('title', item.todo_item_status + ' : ' + item.todo_item_text);
    tableRow.setAttribute('data-state', item.todo_item_status);
    changeStatusButton.setAttribute('title', 'Change ' + item.todo_item_status + ' item state');
    removeButton.setAttribute('title', 'Remove ' + item.todo_item_status + ' item');

    tableRow.className = 'tr item-row';

    removeButton.addEventListener('click', (event) => removeItem(event, item.todo_item_id));

    changeStatusButton.addEventListener('click', (event) => changeItemState(event, item.todo_item_id));

    if (item.todo_item_status == 'todo') {

        if (isNew) {
            todoListContainer.insertBefore(tableRow, todoListContainer.firstChild);
        } else {
            todoListContainer.appendChild(tableRow);
        }

    } else {
        doneListContainer.appendChild(tableRow);
    }

}

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
    required: ['todo_item_text', 'todo_item_status']
};


// Our note object
var todoItem = {
    todo_item_text: null,
    todo_item_status: null
};

// Construct and dependency inject
const remoteStorage = new RemoteStorage({logging: false, changeEvents: { local: true, window: true, remote: true, conflicts: true }});
remoteStorage.access.claim('todonna', 'rw');
const client = remoteStorage.scope('/todonna/');

// Initialize
var widget = new Widget(remoteStorage, {skipInitial: true, logging: true, leaveOpen: true});

widget.attach('remotestorage-widget-anchor');
client.cache('');

remoteStorage.on('connected', function() {

    rsConvenienceButtons.forEach(function(button) {
        button.classList.add('is-loading');
        button.setAttribute('title', 'Remote is Connecting');
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

client.getAll('').then(objects => {
    todoListContainer.innerHTML = ''; // Clear previous content

    for (var path in objects) {
        let object = objects[path];
        createItemRow(object);
    }
});

// Register our application state JSON schema
//
// Documentation: https://remotestoragejs.readthedocs.io/en/latest/js-api/base-client.html#declareType
// client.declareType('AppState', AppState);
client.declareType('aTodoItem', aTodoItem);

// React to application state changes from RS
//
// Documentation: https://remotestoragejs.readthedocs.io/en/latest/js-api/base-client.html#change-events
client.on('change', (event) => {
    if (event.relativePath === 'appstate') {
        // appstate = event.newValue;
        // document.getElementById('choice').innerHTML = appstate.cake_choice;
    }
    // console.log('data was added, updated, or removed:', event);
});

// Documentation: https://remotestoragejs.readthedocs.io/en/latest/js-api/base-client.html#storeObject
function setState(newState) {
    client.storeObject('AppState', 'appstate', newState);
}

async function changeItemState(event, id) {
    const target = event.target;
    let row = target.parentNode.parentNode;
    let oldStatus = row.dataset.state;
    let newStatus = oldStatus === 'done' ? 'todo' : 'done'; // Determine the new status

    // console.log('target: ', row.dataset.state);

    // Remove the row right away
    row.remove();

    try {
        let todoItem = await client.getObject(id);
        todoItem.todo_item_status = newStatus; // Update the status

        // console.log('newStatus: ', newStatus);
        // console.log('oldStatus: ', oldStatus);

        // Store the updated item and create a new row only after the storeObject operation succeeds
        await client.storeObject('aTodoItem', todoItem.todo_item_id, todoItem);
        createItemRow(todoItem);
    } catch (error) {
        console.error('Error moving item to done list:', error);

        // If there's an error, re-create the original row with the old status
        createItemRow({...todoItem, todo_item_status: oldStatus});
    }
}


let lastRemovedItem = null;
let countdownInterval;
let countdownTimeout;

function startCountdown() {
  let countdown = 10;
  const countdownElement = document.querySelector('.countdown');
  countdownElement.textContent = countdown;

  countdownInterval = setInterval(() => {
    countdown--;
    countdownElement.textContent = countdown;
    if (countdown <= 0) {
      stopCountdown();
      notificationUndo.style.display = 'none';
    }
  }, 1000);
}

function stopCountdown() {
  clearInterval(countdownInterval);
  clearTimeout(countdownTimeout);
}

notificationUndo.addEventListener('mouseover', stopCountdown);
notificationUndo.addEventListener('mouseout', startCountdown);

async function removeItem(event, id) {
    const target = event.target;
    let row = target.parentNode.parentNode;

    // Remove the row right away
    row.remove();

    notificationUndo.style.display = 'block';
    startCountdown();

    try {
        let todoItem = await client.getObject(id);
        // todoItem.todo_item_status = newStatus; // Update the status

        // Store the removed item temporarily
        lastRemovedItem = todoItem;

        await client.remove(todoItem.todo_item_id);
    } catch (error) {
        console.error('Error removing item:', error);
    }
}

// Add an event listener to the undo link
document.querySelector('.undo-delete .undo').addEventListener('click', function(event) {
    event.preventDefault();

    if (lastRemovedItem) {
        // Restore the removed item
        client.storeObject('aTodoItem', lastRemovedItem.todo_item_id, lastRemovedItem)
            .then(() => {
                console.log('Item restored, id:', lastRemovedItem.todo_item_id);
                // Recreate the row for the restored item
                createItemRow(lastRemovedItem);
                // Hide the undo notification
                notificationUndo.style.display = 'none';
                // Clear the temporary storage
                lastRemovedItem = null;
            })
            .catch((err) => console.error('Error restoring item id %s :', lastRemovedItem.todo_item_id, err));
    }
});

function addTodoItem(newTodoItem) {
    console.log('newTodoItem: ', newTodoItem);

    createItemRow(newTodoItem, true);

    client.storeObject('aTodoItem', newTodoItem.todo_item_id, newTodoItem)
        .then(() => {
            console.log('New Todo Item, id:', newTodoItem.todo_item_id);
        })
        .catch((err) => console.error('Error saving todo_item id %s :', newTodoItem.todo_item_id, err));

}

document.addEventListener("DOMContentLoaded", function() {
  var deleteButton = document.querySelector('.undo-delete .delete');
  if (deleteButton) {
    deleteButton.addEventListener('click', function() {
      this.parentElement.style.display = 'none';
    });
  }
});

TDN.prefs.loadTheme();
