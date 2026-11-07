// Task Manager – talks directly to the Supabase auto-generated REST API (PostgREST).
// Configuration (URL, publishable key, table name) is loaded from config.json.

let config = null;
let editingId = null; // id of the task currently being edited, or null when adding

const form = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const descriptionInput = document.getElementById('task-description');
const submitButton = document.getElementById('task-submit');
const cancelButton = document.getElementById('task-cancel');
const formHeading = document.getElementById('form-heading');
const taskList = document.getElementById('task-list');
const statusMessage = document.getElementById('status-message');

// ---------- helpers ----------

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.className = isError ? 'error' : 'success';
}

function apiUrl(query = '') {
  return `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/${config.tableName}${query}`;
}

function headers(extra = {}) {
  const h = {
    apikey: config.supabasePublishableKey,
    'Content-Type': 'application/json',
    ...extra,
  };
  // Legacy anon keys are JWTs and are also sent as a Bearer token.
  // New sb_publishable_ keys only need the apikey header.
  if (config.supabasePublishableKey.startsWith('eyJ')) {
    h.Authorization = `Bearer ${config.supabasePublishableKey}`;
  }
  return h;
}

async function request(method, query, body, extraHeaders = {}) {
  const response = await fetch(apiUrl(query), {
    method,
    headers: headers(extraHeaders),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    let details = '';
    try {
      const err = await response.json();
      details = err.message || JSON.stringify(err);
    } catch {
      details = response.statusText;
    }
    throw new Error(`${method} failed (${response.status}): ${details}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// ---------- REST operations ----------

// GET /tasks?select=*
const getAllTasks = () => request('GET', '?select=*&order=id.asc');

// GET /tasks?id=eq.1&select=*
async function getTaskById(id) {
  const rows = await request('GET', `?id=eq.${id}&select=*`);
  if (!rows || rows.length === 0) throw new Error(`Task ${id} not found`);
  return rows[0];
}

// POST /tasks
const createTask = (task) =>
  request('POST', '', task, { Prefer: 'return=representation' });

// PUT /tasks?id=eq.1  (complete record)
const saveTask = (task) =>
  request('PUT', `?id=eq.${task.id}`, task, { Prefer: 'return=representation' });

// PATCH /tasks?id=eq.1  (partial update)
const patchTask = (id, fields) =>
  request('PATCH', `?id=eq.${id}`, fields, { Prefer: 'return=representation' });

// DELETE /tasks?id=eq.1
const deleteTask = (id) => request('DELETE', `?id=eq.${id}`);

// ---------- rendering ----------

function renderTasks(tasks) {
  taskList.innerHTML = '';
  if (tasks.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No tasks yet. Add one above!';
    taskList.appendChild(empty);
    return;
  }

  for (const task of tasks) {
    const item = document.createElement('div');
    item.className = 'task-item' + (task.completed ? ' completed' : '');
    item.dataset.id = task.id;

    const title = document.createElement('h3');
    title.className = 'task-title';
    title.textContent = task.title;

    const description = document.createElement('p');
    description.className = 'task-description';
    description.textContent = task.description || '';

    const status = document.createElement('span');
    status.className = 'task-status';
    status.textContent = task.completed ? 'Completed' : 'Not completed';

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'toggle-task';
    toggleBtn.textContent = task.completed ? 'Mark incomplete' : 'Mark complete';
    toggleBtn.addEventListener('click', () => onToggle(task));

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'edit-task';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => onEdit(task.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-task';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => onDelete(task.id));

    actions.append(toggleBtn, editBtn, deleteBtn);
    item.append(title, description, status, actions);
    taskList.appendChild(item);
  }
}

async function loadTasks() {
  try {
    const tasks = await getAllTasks();
    renderTasks(tasks);
  } catch (error) {
    showStatus(`Could not load tasks. ${error.message}`, true);
  }
}

// ---------- form / event handlers ----------

function resetForm() {
  editingId = null;
  form.reset();
  submitButton.textContent = 'Add task';
  formHeading.textContent = 'Add a task';
  cancelButton.hidden = true;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  if (!title) {
    showStatus('Title is required.', true);
    return;
  }

  submitButton.disabled = true;
  try {
    if (editingId === null) {
      await createTask({ title, description, completed: false });
      showStatus('Task added.');
    } else {
      const current = await getTaskById(editingId);
      await saveTask({ id: current.id, title, description, completed: current.completed });
      showStatus('Task updated.');
    }
    resetForm();
    await loadTasks();
  } catch (error) {
    showStatus(`Could not save task. ${error.message}`, true);
  } finally {
    submitButton.disabled = false;
  }
});

cancelButton.addEventListener('click', () => {
  resetForm();
  showStatus('Edit cancelled.');
});

async function onEdit(id) {
  try {
    const task = await getTaskById(id);
    editingId = task.id;
    titleInput.value = task.title;
    descriptionInput.value = task.description || '';
    submitButton.textContent = 'Save changes';
    formHeading.textContent = `Edit task #${task.id}`;
    cancelButton.hidden = false;
    titleInput.focus();
  } catch (error) {
    showStatus(`Could not load task for editing. ${error.message}`, true);
  }
}

async function onToggle(task) {
  try {
    await patchTask(task.id, { completed: !task.completed });
    showStatus(task.completed ? 'Task marked as incomplete.' : 'Task marked as completed.');
    await loadTasks();
  } catch (error) {
    showStatus(`Could not change task status. ${error.message}`, true);
  }
}

async function onDelete(id) {
  try {
    await deleteTask(id);
    if (editingId === id) resetForm();
    showStatus('Task deleted.');
    await loadTasks();
  } catch (error) {
    showStatus(`Could not delete task. ${error.message}`, true);
  }
}

// ---------- start ----------

async function init() {
  try {
    const response = await fetch('config.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`config.json returned ${response.status}`);
    config = await response.json();
    if (!config.supabaseUrl || !config.supabasePublishableKey || !config.tableName) {
      throw new Error('config.json is missing required fields');
    }
  } catch (error) {
    showStatus(`Could not load configuration. ${error.message}`, true);
    return;
  }
  await loadTasks();
}

init();
