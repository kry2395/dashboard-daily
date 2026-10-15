/**
 * MODUŁ POGODY
 * Pobiera dane z OpenWeatherMap
 * Wymaga: API key z https://openweathermap.org/api
 */

class WeatherModule {
  constructor() {
    this.apiKey = 0f7e7a90f758b9d38e0a9205ad1c23c6;
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
      this.apiKey = settings.apiKeyWeather;
      this.city = settings.cityName || 'Warszawa';
    }
  }

  /**
   * Pobierz pogodę z API
   */
  async fetchWeather() {
    if (!this.apiKey) {
      console.warn('⚠️ Brak API key dla pogody');
      return this.getDefaultWeather();
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${this.city}&appid=${this.apiKey}&units=${this.units}&lang=pl`;
      console.log('🌐 Pobieranie pogody dla:', this.city);
      
      const data = await apiHandler.fetch(url, {}, 30 * 60 * 1000); // 30 min cache
      return data;
    } catch (error) {
      console.error('❌ Błąd pobierania pogody:', error);
      return this.getDefaultWeather();
    }
  }

  /**
   * Pogoda domyślna (demo)
   */
  getDefaultWeather() {
    return {
      name: this.city,
      main: {
        temp: 15,
        feels_like: 13,
        humidity: 65,
        pressure: 1013
      },
      weather: [
        {
          main: 'Chmurno',
          description: 'Przeważnie chmurnie',
          icon: '04d'
        }
      ],
      wind: {
        speed: 12
      },
      sys: {
        country: 'PL'
      }
    };
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
      this.element.innerHTML = `
        <div style="color: #f44336; text-align: center; padding: 20px;">
          <p>❌ Nie można załadować pogody</p>
          <p style="font-size: 12px; margin-top: 8px;">Sprawdź API key w ustawieniach</p>
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
