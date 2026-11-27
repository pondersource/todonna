async function atomicTodoClient(store) {
    const {table, rowClass} = await store.getData();
    if (!table || !rowClass) throw new Error('Todonna needs an Atomic Tasks table.');

    const core = 'https://atomicdata.dev/properties/';
    const parent = core + 'parent';
    const isA = core + 'isA';
    const name = core + 'name';
    const shortname = core + 'shortname';
    const description = core + 'description';
    const prefix = 'todonna-task/v1:';
    let pending = Promise.resolve();

    async function find(property, value) {
        const subjects = await store.query({property, value});
        if (subjects.length >= 500) throw new Error('Too many rows to load safely.');
        const rows = [];
        for (let offset = 0; offset < subjects.length; offset += 100) {
            const batch = await store.getMany(subjects.slice(offset, offset + 100));
            if (batch.some(row => row.error)) throw new Error('Atomic could not read a task.');
            rows.push(...batch.filter(row =>
                row.get(parent) === table && row.get(isA)?.includes(rowClass)
            ));
        }
        return rows;
    }

    function itemFrom(row) {
        const state = row.get(description);
        const status = state === prefix + 'done' ? 'done' : state === prefix + 'todo' ? 'todo' : undefined;
        if (!status) return;
        return {
            todo_item_id: row.get(shortname),
            todo_item_text: row.get(name),
            todo_item_status: status,
        };
    }

    async function byId(id) {
        const rows = await find(shortname, id);
        if (rows.length > 1 || (rows.length === 1 && !itemFrom(rows[0]))) {
            throw new Error('The task ID is already in use.');
        }
        return rows[0];
    }

    function write(operation) {
        const result = pending.then(operation);
        pending = result.catch(() => {});
        return result;
    }

    return {
        async getAll() {
            await pending;
            return (await find(parent, table)).map(itemFrom).filter(Boolean);
        },
        async getObject(id) {
            await pending;
            const row = await byId(id);
            return row && itemFrom(row);
        },
        storeObject(type, id, item) {
            return write(async () => {
                const row = await byId(id);
                const propVals = {
                    [name]: item.todo_item_text,
                    [shortname]: id,
                    [description]: prefix + item.todo_item_status,
                };
                if (!row) {
                    await store.newResource({parent: table, isA: [rowClass], propVals});
                    return;
                }
                for (const [property, value] of Object.entries(propVals)) row.set(property, value);
                await row.save();
            });
        },
        remove(id) {
            return write(async () => {
                const row = await byId(id);
                if (row) await row.destroy();
            });
        },
    };
}
