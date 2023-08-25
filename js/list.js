const newItem = document.getElementById('new-item-input');
newItem.addEventListener('click', () => {
    newItem.classList.add('is-success');
    newItem.classList.remove('is-danger');
});

async function addTodo(evt) {
    var id = "id" + Math.random().toString(16).slice(2);
    if (newItem.value.length) {
        try {
            addTodoItem({...todoItem,
                         todo_item_text: newItem.value,
                         todo_item_status: 'todo',
                         todo_item_id: id});
        } catch (error) {
            console.error('Error adding todo item:', error);
        }
    } else {
        newItem.classList.add('is-danger');
    }
}

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
var widget = new Widget(remoteStorage, { logging: true, leaveOpen:true });
widget.attach('remotestorage-widget-anchor');
client.cache('');

const todoListContainer = document.getElementById('todo-list');
const doneListContainer = document.getElementById('done-list');

function createItemRow (item, isNew) {

    const tableRow = document.createElement('tr');

    const textCell = document.createElement('td');
    textCell.className = 'item-text-td'; // Adding the class for full width
    textCell.textContent = item.todo_item_text;

    const buttonCell = document.createElement('td');
    buttonCell.className = 'item-buttons is-flex'; // Adding the class for right alignment
    const changeStatusButton = document.createElement('button');
    changeStatusButton.className = 'button is-small';
    // changeStatusButton.textContent = 'X';
    const removeButton = document.createElement('button');
    removeButton.className = 'button is-small icon-trash';

    const changeStatusButtonIconClass = item.todo_item_status == 'todo' ? 'icon-check-false' : 'icon-check-true';

    changeStatusButton.classList.add(changeStatusButtonIconClass);

    buttonCell.appendChild(removeButton);
    buttonCell.appendChild(changeStatusButton);
    tableRow.appendChild(textCell);
    tableRow.appendChild(buttonCell);

    tableRow.setAttribute('title', item.todo_item_status);

    // changeStatusButton.addEventListener('click', () => changeItemState(event, item.todo_item_id));

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


client.getAll('').then(objects => {
    todoListContainer.innerHTML = ''; // Clear previous content
    document.getElementById('progress').setAttribute('value', '100');

    console.log('yoo: ', objects);

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
    let oldStatus = row.getAttribute('title'); // Get the old status from the row title
    let newStatus = oldStatus === 'done' ? 'todo' : 'done'; // Determine the new status

    // Remove the row right away
    row.remove();

    try {
        let todoItem = await client.getObject('/' + id);
        todoItem.todo_item_status = newStatus; // Update the status

        // Store the updated item and create a new row only after the storeObject operation succeeds
        await client.storeObject('aTodoItem', todoItem.todo_item_id, todoItem);
        createItemRow(todoItem);
    } catch (error) {
        console.error('Error moving item to done list:', error);

        // If there's an error, re-create the original row with the old status
        createItemRow({...todoItem, todo_item_status: oldStatus});
    }
}

function addTodoItem(newTodoItem) {
    console.log('newTodoItem: ', newTodoItem);

    createItemRow(newTodoItem, true);

    client.storeObject('aTodoItem', newTodoItem.todo_item_id, newTodoItem)
        .then(() => {
            console.log('New Todo Item, id:', newTodoItem.todo_item_id);
        })
        .catch((err) => console.error('Error saving todo_item id %s :', newTodoItem.todo_item_id, err));

}
