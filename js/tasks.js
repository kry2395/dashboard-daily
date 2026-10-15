const TASKS_STORAGE_KEY = 'dashboardTasks';

class TasksModule {
  constructor() {
    this.listElement = document.getElementById('tasksList');
    this.inputElement = document.getElementById('newTaskInput');
    this.statusElement = document.getElementById('syncStatus');
    this.tasks = this.loadTasks();
  }

  loadTasks() {
    try {
      const savedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
      const tasks = savedTasks ? JSON.parse(savedTasks) : [];
      return Array.isArray(tasks) ? tasks : [];
    } catch (error) {
      console.error('Nie udało się odczytać listy zadań:', error);
      return [];
    }
  }

  init() {
    document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());
    this.inputElement.addEventListener('keydown', event => {
      if (event.key === 'Enter') this.addTask();
    });
    this.render();
  }

  saveTasks() {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(this.tasks));
      this.statusElement.textContent = 'Zapisano lokalnie na tym urządzeniu.';
      return true;
    } catch (error) {
      console.error('Nie udało się zapisać listy zadań:', error);
      this.statusElement.textContent = 'Nie udało się zapisać zadań.';
      showNotification('Nie udało się zapisać zadań w tej przeglądarce.', 'error');
      return false;
    }
  }

  addTask() {
    const title = this.inputElement.value.trim();
    if (!title) {
      this.inputElement.focus();
      return;
    }

    this.tasks.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      completed: false
    });
    this.inputElement.value = '';
    if (this.saveTasks()) this.render();
  }

  toggleTask(taskId) {
    const task = this.tasks.find(item => item.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    if (this.saveTasks()) this.render();
  }

  deleteTask(taskId) {
    this.tasks = this.tasks.filter(item => item.id !== taskId);
    if (this.saveTasks()) this.render();
  }

  render() {
    this.listElement.replaceChildren();

    if (this.tasks.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'empty-tasks';
      emptyMessage.textContent = 'Nie masz jeszcze żadnych zadań.';
      this.listElement.appendChild(emptyMessage);
      return;
    }

    const list = document.createElement('ul');
    list.className = 'task-list';

    this.tasks.forEach(task => {
      const item = document.createElement('li');
      item.className = 'task-item';
      if (task.completed) item.classList.add('completed');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = Boolean(task.completed);
      checkbox.setAttribute('aria-label', `Oznacz jako wykonane: ${task.title}`);
      checkbox.addEventListener('change', () => this.toggleTask(task.id));

      const title = document.createElement('span');
      title.className = 'task-title';
      title.textContent = task.title;

      const deleteButton = document.createElement('button');
      deleteButton.className = 'task-delete';
      deleteButton.type = 'button';
      deleteButton.setAttribute('aria-label', `Usuń zadanie: ${task.title}`);
      deleteButton.textContent = 'Usuń';
      deleteButton.addEventListener('click', () => this.deleteTask(task.id));

      item.append(checkbox, title, deleteButton);
      list.appendChild(item);
    });

    this.listElement.appendChild(list);
  }

  refresh() {
    this.tasks = this.loadTasks();
    this.render();
    this.statusElement.textContent = 'Lista zadań została odświeżona.';
  }
}

const tasksModule = new TasksModule();
