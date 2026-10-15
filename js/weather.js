/**
 * MODUŁ POGODY
 * Pobiera dane z OpenWeatherMap
 * Wymaga: API key z https://openweathermap.org/api
 */

class WeatherModule {
  constructor() {
    this.apiKey = '';
    this.city = 'Warszawa';
    this.units = 'metric'; // Celsjusz
    this.element = document.getElementById('weatherContent');
  }

  /**
   * Inicjalizuj moduł
   */
  init() {
    console.log('🌤️ Inicjalizacja Weather Module...');
    this.loadSettings();
    this.render();
  }

  /**
   * Załaduj ustawienia z localStorage
   */
  loadSettings() {
    const saved = localStorage.getItem('dashboardSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      this.apiKey = settings.apiKeyWeather || '';
      this.city = settings.cityName || 'Warszawa';
    }
  }

  /**
   * Pobierz pogodę z API
   */
  async fetchWeather() {
    if (!this.apiKey) {
      throw new Error('Dodaj klucz API OpenWeatherMap w ustawieniach.');
    }

    const params = new URLSearchParams({
      q: this.city,
      appid: this.apiKey,
      units: this.units,
      lang: 'pl'
    });
    const url = `https://api.openweathermap.org/data/2.5/weather?${params}`;
    console.log('🌐 Pobieranie pogody dla:', this.city);
    return apiHandler.fetch(url, {}, 30 * 60 * 1000);
  }

  /**
   * Renderuj interfejs
   */
  async render() {
    try {
      // Pokaż loader
      this.element.innerHTML = '<div class="skeleton-loader"></div>';

      // Pobierz dane
      const weather = await this.fetchWeather();

      // HTML pogody
      const html = `
        <div class="weather-info">
          <div style="font-size: 24px; margin-bottom: 8px;">
            📍 ${weather.name}${weather.sys?.country ? ', ' + weather.sys.country : ''}
          </div>
          <div class="weather-temp">${Math.round(weather.main.temp)}°C</div>
          <div class="weather-description">${weather.weather[0].description}</div>
          
          <div class="weather-details">
            <div class="weather-detail">
              <div class="weather-detail-label">Feels like</div>
              <div class="weather-detail-value">${Math.round(weather.main.feels_like)}°C</div>
            </div>
            <div class="weather-detail">
              <div class="weather-detail-label">Wilgotność</div>
              <div class="weather-detail-value">${weather.main.humidity}%</div>
            </div>
            <div class="weather-detail">
              <div class="weather-detail-label">Wiatr</div>
              <div class="weather-detail-value">${weather.wind.speed} m/s</div>
            </div>
            <div class="weather-detail">
              <div class="weather-detail-label">Ciśnienie</div>
              <div class="weather-detail-value">${weather.main.pressure} hPa</div>
            </div>
          </div>
        </div>
      `;

      this.element.innerHTML = html;
      console.log('✅ Pogoda załadowana');
    } catch (error) {
      console.error('❌ Błąd renderowania pogody:', error);
      const message = this.apiKey
        ? 'Nie udało się pobrać pogody. Sprawdź miasto, klucz API i połączenie z internetem.'
        : 'Dodaj klucz API OpenWeatherMap w ustawieniach, aby pobrać pogodę.';
      this.element.innerHTML = `
        <div style="color: #f44336; text-align: center; padding: 20px;">
          <p>❌ Nie można załadować pogody</p>
          <p style="font-size: 12px; margin-top: 8px;">${message}</p>
        </div>
      `;
    }
  }

  /**
   * Odśwież pogodę
   */
  async refresh() {
    console.log('🔄 Odświeżanie pogody...');
    await this.render();
  }
}

// Instancja globalna
const weatherModule = new WeatherModule();
