const fs = require('fs');
const path = require('path');
const {
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder
} = require('discord.js');

const TODO_FILE = path.join(__dirname, '../todos.json');

function loadTodos() {
    if (!fs.existsSync(TODO_FILE)) return {};
    try {
        const data = fs.readFileSync(TODO_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.error("Error loading todos:", e);
        return {};
    }
}

function saveTodos(todos) {
    try {
        fs.writeFileSync(TODO_FILE, JSON.stringify(todos, null, 4));
    } catch (e) {
        console.error("Error saving todos:", e);
    }
}

function addTodoTask(categoryId, name, description) {
    const todos = loadTodos();
    if (!todos[categoryId]) todos[categoryId] = [];

    const newTask = {
        id: Date.now().toString(),
        name,
        description: description || "",
        completed: false
    };

    todos[categoryId].push(newTask);
    saveTodos(todos);
    return newTask;
}

function getTodoList(categoryId) {
    const todos = loadTodos();
    return todos[categoryId] || [];
}

function buildTodoListContainer(categoryId, wikiConfig) {
    const tasks = getTodoList(categoryId).filter(t => !t.completed);

    if (tasks.length === 0) return null;

    const container = new ContainerBuilder();
    const section = new SectionBuilder();

    let content = `## Todo List for ${wikiConfig.name}\n`;
    tasks.forEach((task, index) => {
        content += `${index + 1}. **${task.name}**${task.description ? ` - ${task.description}` : ""}\n`;
    });

    section.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

    // SectionBuilder requires an accessory. Use a fallback transparent image.
    const fallbackImage = "https://upload.wikimedia.org/wikipedia/commons/8/89/HD_transparent_picture.png";
    section.setThumbnailAccessory(thumbnail => thumbnail.setURL(fallbackImage));

    container.addSectionComponents(section);
    return container;
}

function updateTasks(categoryId, completedTaskIds) {
    const todos = loadTodos();
    if (!todos[categoryId]) return [];

    todos[categoryId] = todos[categoryId].map(task => {
        if (completedTaskIds.includes(task.id)) {
            return { ...task, completed: true };
        }
        return task;
    });

    // Optional: Filter out completed tasks from the storage to keep it clean?
    // The prompt says "cross off anything they've done" and "remaining tasks".
    // I'll keep them as completed: true for now, but maybe remove them if they want only remaining.
    // Let's just keep them for history but filter them out in displays.

    saveTodos(todos);
    return todos[categoryId].filter(t => !t.completed);
}

function buildTickModal(categoryId) {
    const tasks = getTodoList(categoryId).filter(t => !t.completed);
    if (tasks.length === 0) return null;

    // We use a raw object for the modal to ensure compatibility with CheckboxGroup (type 11)
    return {
        title: "Tick off completed tasks",
        custom_id: `todo_tick_modal_${categoryId}`,
        components: [
            {
                type: 1, // ActionRow
                components: [
                    {
                        type: 11, // CheckboxGroup
                        custom_id: "completed_tasks",
                        options: tasks.slice(0, 10).map(task => ({
                            label: task.name.slice(0, 100),
                            value: task.id,
                            description: task.description ? task.description.slice(0, 100) : undefined
                        }))
                    }
                ]
            }
        ]
    };
}

module.exports = {
    addTodoTask,
    getTodoList,
    buildTodoListContainer,
    updateTasks,
    buildTickModal,
    loadTodos
};
