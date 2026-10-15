const TASKS_STORAGE_KEY = 'dashboardTasks';
const TASKS_PENDING_SYNC_KEY = 'dashboardTasksPendingSync';
const TASKS_SYNC_INTERVAL = 30 * 1000;

class TasksModule {
  constructor() {
    this.listElement = document.getElementById('tasksList');
    this.inputElement = document.getElementById('newTaskInput');
    this.statusElement = document.getElementById('syncStatus');
    this.tasks = this.loadTasks();
    this.endpoint = '';
    this.accessToken = '';
    this.syncQueue = Promise.resolve();
    this.syncTimer = null;
    this.localRevision = 0;
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
    window.addEventListener('online', () => {
      if (this.endpoint && this.accessToken && this.hasPendingSync()) {
        this.syncToRemote();
      }
    });
    this.render();
  }

  async configure(settings) {
    this.endpoint = settings.tasksEndpoint || '';
    this.accessToken = settings.tasksAccessToken || '';

    if (this.syncTimer) {
      window.clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    if (!this.endpoint && !this.accessToken) {
      this.statusElement.textContent = 'Tylko lokalnie — skonfiguruj synchronizację online w ustawieniach.';
      return;
    }

    if (!this.endpoint || !this.accessToken) {
      this.statusElement.textContent = 'Do synchronizacji podaj adres Apps Script i token dostępu.';
      return;
    }

    let endpoint;
    try {
      endpoint = new URL(this.endpoint);
      if (endpoint.protocol !== 'https:' ||
          endpoint.hostname !== 'script.google.com' ||
          !endpoint.pathname.startsWith('/macros/s/') ||
          !endpoint.pathname.endsWith('/exec')) {
        throw new Error('Wklej adres wdrożenia Google Apps Script kończący się na /exec.');
      }
    } catch (error) {
      this.statusElement.textContent = error.message;
      showNotification(error.message, 'error');
      return;
    }

    this.endpoint = endpoint.href;

    try {
      const revision = this.localRevision;
      const remoteTasks = await this.enqueueSync(() => this.readRemoteTasks());
      if (this.hasPendingSync() || revision !== this.localRevision) {
        await this.enqueueSync(() => this.writeRemoteTasks(this.tasks));
        this.clearPendingSync();
        this.statusElement.textContent = 'Oczekujące zmiany zostały zsynchronizowane online.';
      } else if (remoteTasks.length === 0 && this.tasks.length > 0) {
        await this.enqueueSync(() => this.writeRemoteTasks(this.tasks));
        this.statusElement.textContent = 'Przeniesiono lokalne zadania do arkusza online.';
      } else {
        this.tasks = remoteTasks;
        this.saveLocalTasks();
        this.render();
        this.statusElement.textContent = 'Lista zadań zsynchronizowana z arkuszem online.';
      }

      this.syncTimer = window.setInterval(() => {
        if (navigator.onLine) {
          this.refresh().catch(error => {
            console.error('Automatyczna synchronizacja zadań nie powiodła się:', error);
            this.statusElement.textContent = 'Brak synchronizacji — sprawdź połączenie i konfigurację.';
          });
        }
      }, TASKS_SYNC_INTERVAL);
    } catch (error) {
      console.error('Nie udało się połączyć z listą zadań online:', error);
      this.statusElement.textContent = 'Nie udało się połączyć z listą online. Zadania pozostają zapisane lokalnie.';
      showNotification('Synchronizacja zadań nie powiodła się. Sprawdź adres Apps Script i token.', 'error');
    }
  }

  enqueueSync(operation) {
    const result = this.syncQueue.then(operation);
    this.syncQueue = result.catch(() => {});
    return result;
  }

  saveLocalTasks() {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(this.tasks));
      return true;
    } catch (error) {
      console.error('Nie udało się zapisać listy zadań:', error);
      this.statusElement.textContent = 'Nie udało się zapisać zadań na tym urządzeniu.';
      showNotification('Nie udało się zapisać zadań w tej przeglądarce.', 'error');
      return false;
    }
  }

  hasPendingSync() {
    return localStorage.getItem(TASKS_PENDING_SYNC_KEY) === 'true';
  }

  clearPendingSync() {
    localStorage.removeItem(TASKS_PENDING_SYNC_KEY);
  }

  async readRemoteTasks() {
    return new Promise((resolve, reject) => {
      const callbackName = `dashboardTasksCallback${Date.now()}${Math.random().toString(36).slice(2)}`;
      const script = document.createElement('script');
      const timeout = window.setTimeout(() => finish(new Error('Przekroczono czas oczekiwania na arkusz.')), 15000);

      const finish = (error, result) => {
        window.clearTimeout(timeout);
        delete window[callbackName];
        script.remove();
        if (error) reject(error);
        else resolve(result);
      };

      window[callbackName] = response => {
        if (!response || response.error) {
          finish(new Error(response?.error || 'Nieprawidłowa odpowiedź serwera.'));
          return;
        }
        if (!Array.isArray(response.tasks)) {
          finish(new Error('Serwer zwrócił nieprawidłową listę zadań.'));
          return;
        }

        finish(null, response.tasks
          .filter(task => task && typeof task.id === 'string' && typeof task.title === 'string')
          .map(task => ({
            id: task.id,
            title: task.title,
            completed: Boolean(task.completed)
          })));
      };

      script.onerror = () => finish(new Error('Nie można połączyć się z Google Apps Script.'));
      const url = new URL(this.endpoint);
      url.searchParams.set('action', 'read');
      url.searchParams.set('token', this.accessToken);
      url.searchParams.set('callback', callbackName);
      script.src = url.href;
      document.head.appendChild(script);
    });
  }

  async writeRemoteTasks(tasks) {
    const payload = {
      token: this.accessToken,
      tasks
    };

    await fetch(this.endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(payload)
    });

    let lastError;
    for (let attempt = 0; attempt < 6; attempt++) {
      await new Promise(resolve => window.setTimeout(resolve, 500));
      try {
        const savedTasks = await this.readRemoteTasks();
        if (JSON.stringify(savedTasks) === JSON.stringify(tasks)) return;
        lastError = new Error('Serwer nie potwierdził zapisu listy zadań.');
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error('Nie udało się potwierdzić zapisu na serwerze.');
  }

  async syncToRemote() {
    if (!this.endpoint || !this.accessToken) {
      this.statusElement.textContent = 'Zapisano lokalnie na tym urządzeniu.';
      return;
    }

    const snapshot = this.tasks.map(task => ({ ...task }));
    this.statusElement.textContent = 'Synchronizuję z arkuszem online…';
    try {
      localStorage.setItem(TASKS_PENDING_SYNC_KEY, 'true');
      await this.enqueueSync(() => this.writeRemoteTasks(snapshot));
      this.clearPendingSync();
      this.statusElement.textContent = 'Zapisano i zsynchronizowano online.';
      return true;
    } catch (error) {
      console.error('Nie udało się zsynchronizować zadań:', error);
      this.statusElement.textContent = 'Zapisano lokalnie, ale synchronizacja online się nie powiodła.';
      showNotification('Nie udało się zsynchronizować zadań. Zmiany są zachowane na tym urządzeniu.', 'error');
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
    this.localRevision++;
    this.inputElement.value = '';
    if (this.saveLocalTasks()) {
      this.render();
      this.syncToRemote();
    }
  }

  toggleTask(taskId) {
    const task = this.tasks.find(item => item.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    this.localRevision++;
    if (this.saveLocalTasks()) {
      this.render();
      this.syncToRemote();
    }
  }

  deleteTask(taskId) {
    this.tasks = this.tasks.filter(item => item.id !== taskId);
    this.localRevision++;
    if (this.saveLocalTasks()) {
      this.render();
      this.syncToRemote();
    }
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

  async refresh() {
    if (!this.endpoint || !this.accessToken) {
      this.tasks = this.loadTasks();
      this.render();
      this.statusElement.textContent = 'Lista zadań została odświeżona lokalnie.';
      return;
    }

    if (this.hasPendingSync()) {
      const synced = await this.syncToRemote();
      if (!synced) throw new Error('Nie udało się wysłać oczekujących zmian do arkusza.');
      return;
    }

    this.statusElement.textContent = 'Pobieram zadania z arkusza online…';
    const revision = this.localRevision;
    const remoteTasks = await this.enqueueSync(() => this.readRemoteTasks());
    if (this.hasPendingSync() || revision !== this.localRevision) {
      const synced = await this.syncToRemote();
      if (!synced) throw new Error('Nie udało się wysłać oczekujących zmian do arkusza.');
      return;
    }
    this.tasks = remoteTasks;
    this.saveLocalTasks();
    this.render();
    this.statusElement.textContent = 'Lista zadań została zsynchronizowana.';
  }
}

const tasksModule = new TasksModule();
