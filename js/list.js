function mountTodoList(client) {
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

    async function addTodo(evt) {
        var id = "id" + Math.random().toString(16).slice(2);
        if (newItemInput.value.length) {
            try {
                await addTodoItem({
                             todo_item_text: newItemInput.value,
                             todo_item_status: 'todo',
                             todo_item_id: id});
                newItemInput.value = '';
                newItemInput.focus();
            } catch (error) {
                console.error('Error adding todo item:', error);
            }
        } else {
            newItemInput.classList.add('is-danger');
        }
    }

    function createItemRow (item, isNew) {

        if (!item.todo_item_id) {
            return;
        }

        removeItemRow(item.todo_item_id);

        const tableRow = document.createElement('tr');
        tableRow.dataset.itemId = item.todo_item_id;

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

    function removeItemRow(id) {
        document.querySelectorAll('.item-row').forEach(row => {
            if (row.dataset.itemId === id) row.remove();
        });
    }

    // React to application state changes from RS
    //
    // Documentation: https://remotestoragejs.readthedocs.io/en/latest/js-api/base-client.html#change-events
    client.on?.('change', (event) => {
        const id = event.newValue?.todo_item_id || event.oldValue?.todo_item_id;
        if (!id) return;
        removeItemRow(id);
        if (event.newValue) createItemRow(event.newValue);
    });

    async function changeItemState(event, id) {
        const target = event.currentTarget;
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
            const original = await client.getObject(id);
            if (original) createItemRow(original);
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
        const target = event.currentTarget;
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

    async function addTodoItem(newTodoItem) {
        await client.storeObject('aTodoItem', newTodoItem.todo_item_id, newTodoItem);
        createItemRow(newTodoItem, true);

    }


    newItemInput.addEventListener('keypress', handleKeyPress);
    document.getElementById('add-item').addEventListener('click', addTodo);
    document.querySelector('.undo-delete .delete').addEventListener('click', () => {
        stopCountdown();
        notificationUndo.style.display = 'none';
    });
    return client.getAll('', false).then(objects => {
        todoListContainer.innerHTML = ''; // Clear previous content
        doneListContainer.innerHTML = '';

        for (var path in objects) {
            let object = objects[path];
            // console.log('object: ', object.todo_item_id);
            if (object.todo_item_id) {
                createItemRow(object);
            }
        }
    });
}
