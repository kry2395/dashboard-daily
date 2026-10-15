/**
 * Handler zarządzający żądaniami do API z obsługą CORS
 * i cacheowaniem wyników
 */

class APIHandler {
  constructor() {
    this.cache = new Map();
    this.cacheDuration = 5 * 60 * 1000; // 5 minut
  }

  /**
   * Pobiera dane z API z automatycznym fallbackiem
   * @param {string} url - URL do pobrania
   * @param {object} options - Opcje fetch
   * @param {number} cacheTtl - Czas cache w ms
   */
  async fetch(url, options = {}, cacheTtl = this.cacheDuration) {
    const cacheKey = `${url}:${JSON.stringify(options)}`;

    // Sprawdź cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheTtl) {
        console.log('📦 Wynik z cache:', url);
        return cached.data;
      }
    }

    try {
      console.log('🔄 Pobieranie z sieci:', url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Zapisz do cache
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('❌ Błąd API:', error);
      
      // Zwróć dane z cache nawet jeśli wygasły
      if (this.cache.has(cacheKey)) {
        console.log('⚠️ Używanie starego cache z powodu błędu');
        return this.cache.get(cacheKey).data;
      }

      throw error;
    }
  }

  /**
   * Proxy przez CORS proxy (dla API bez CORS headers)
   */
  async fetchWithCORS(url, options = {}) {
    // Użyj publicznego CORS proxy
    const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
    return this.fetch(proxyUrl, options);
  }

  /**
   * Pobiera dane z Google Sheets
   */
  async getGoogleSheetData(sheetId, apiKey, range = 'A1:Z100') {
    const url = 
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
    return this.fetch(url);
  }

  /**
   * Czyści cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache wyczyszczony');
  }

  /**
   * Zwraca rozmiar cache w MB
   */
  getCacheSize() {
    let size = 0;
    for (let [key, value] of this.cache) {
      size += JSON.stringify(value).length;
    }
    return (size / 1024 / 1024).toFixed(2);
  }
}

// Globalny handler
const apiHandler = new APIHandler();
