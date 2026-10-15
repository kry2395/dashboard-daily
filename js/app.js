const SETTINGS_KEY = 'dashboardSettings';

function showNotification(message, type = 'info') {
  const container = document.getElementById('notifications');
  if (!container) return;

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.setAttribute('role', 'status');

  const text = document.createElement('span');
  text.textContent = message;
  notification.appendChild(text);

  const closeButton = document.createElement('button');
  closeButton.className = 'notification-close';
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Zamknij powiadomienie');
  closeButton.textContent = '×';
  closeButton.addEventListener('click', () => notification.remove());
  notification.appendChild(closeButton);

  container.appendChild(notification);
  window.setTimeout(() => notification.remove(), 5000);
}

function readSettings() {
  const saved = localStorage.getItem(SETTINGS_KEY);
  return saved ? JSON.parse(saved) : {};
}

function populateSettingsForm() {
  const settings = readSettings();
  document.getElementById('cityName').value = settings.cityName || 'Warszawa';
  document.getElementById('apiKeyWeather').value = settings.apiKeyWeather || '';
  document.getElementById('googleSheetId').value = settings.googleSheetId || '';
  document.getElementById('googleSheetKey').value = settings.googleSheetKey || '';
  document.getElementById('offlineMode').checked = Boolean(settings.offlineMode);
  document.getElementById('autoRefresh').checked = Boolean(settings.autoRefresh);
}

function setSettingsModal(isOpen) {
  const modal = document.getElementById('settingsModal');
  modal.classList.toggle('open', isOpen);
  modal.setAttribute('aria-hidden', String(!isOpen));
}

async function clearApplicationCache() {
  if (!('caches' in window)) {
    showNotification('Ta przeglądarka nie obsługuje czyszczenia cache.', 'warning');
    return;
  }

  const cacheNames = await caches.keys();
  const dashboardCaches = cacheNames.filter(cacheName => cacheName.startsWith('dashboard-'));
  await Promise.all(dashboardCaches.map(cacheName => caches.delete(cacheName)));
  apiHandler.clearCache();
  showNotification('Cache został wyczyszczony.', 'success');
}

function bindSettings() {
  const modal = document.getElementById('settingsModal');

  document.getElementById('settingsBtn').addEventListener('click', () => {
    populateSettingsForm();
    setSettingsModal(true);
  });
  document.getElementById('closeSettingsBtn').addEventListener('click', () => {
    setSettingsModal(false);
  });
  modal.addEventListener('click', event => {
    if (event.target === modal) setSettingsModal(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setSettingsModal(false);
  });

  document.getElementById('settingsForm').addEventListener('submit', async event => {
    event.preventDefault();

    const cityName = document.getElementById('cityName').value.trim();
    if (!cityName) {
      showNotification('Podaj nazwę miasta.', 'warning');
      return;
    }

    const settings = {
      ...readSettings(),
      cityName,
      apiKeyWeather: document.getElementById('apiKeyWeather').value.trim(),
      googleSheetId: document.getElementById('googleSheetId').value.trim(),
      googleSheetKey: document.getElementById('googleSheetKey').value.trim(),
      offlineMode: document.getElementById('offlineMode').checked,
      autoRefresh: document.getElementById('autoRefresh').checked
    };

    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      weatherModule.loadSettings();
      await weatherModule.refresh();
      setSettingsModal(false);
      updateAutoRefresh(settings.autoRefresh);
      showNotification('Ustawienia zostały zapisane.', 'success');
    } catch (error) {
      console.error('Nie udało się zapisać ustawień:', error);
      showNotification('Nie udało się zapisać ustawień w tej przeglądarce.', 'error');
    }
  });

  document.getElementById('clearCacheBtn').addEventListener('click', () => {
    clearApplicationCache().catch(error => {
      console.error('Nie udało się wyczyścić cache:', error);
      showNotification('Nie udało się wyczyścić cache.', 'error');
    });
  });
}

function updateAutoRefresh(enabled) {
  if (window.dashboardRefreshTimer) {
    window.clearInterval(window.dashboardRefreshTimer);
    window.dashboardRefreshTimer = null;
  }

  if (enabled) {
    window.dashboardRefreshTimer = window.setInterval(() => {
      weatherModule.refresh();
    }, 10 * 60 * 1000);
  }
}

function bindRefreshButtons() {
  const refreshActions = {
    weather: () => weatherModule.refresh(),
    quote: () => quotesModule.refresh(),
    movies: () => moviesModule.refresh(),
    tasks: () => tasksModule.refresh()
  };

  document.querySelectorAll('.refresh-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const action = refreshActions[button.dataset.widget];
      if (!action) return;

      button.classList.add('loading');
      button.disabled = true;
      try {
        await action();
      } catch (error) {
        console.error(`Nie udało się odświeżyć widgetu ${button.dataset.widget}:`, error);
        showNotification('Nie udało się odświeżyć widgetu.', 'error');
      } finally {
        button.classList.remove('loading');
        button.disabled = false;
      }
    });
  });
}

function updateConnectionStatus() {
  const status = document.getElementById('connectionStatus');
  const update = () => {
    status.textContent = navigator.onLine ? '🟢 Online' : '🔴 Offline';
  };

  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
}

function initDashboard() {
  bindSettings();
  bindRefreshButtons();
  updateConnectionStatus();

  try {
    const settings = readSettings();
    weatherModule.init();
    quotesModule.init();
    moviesModule.init();
    tasksModule.init();
    updateAutoRefresh(Boolean(settings.autoRefresh));
  } catch (error) {
    console.error('Nie udało się uruchomić dashboardu:', error);
    showNotification('Nie udało się wczytać ustawień. Sprawdź dane zapisane w przeglądarce.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', initDashboard, { once: true });
