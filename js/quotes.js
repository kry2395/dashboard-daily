/**
 * MODUŁ CYTATÓW MOTYWACYJNYCH
 * Pobiera cytaty z publicznego API
 */

class QuotesModule {
  constructor() {
    this.element = document.getElementById('quoteContent');
    this.quotes = this.getLocalQuotes();
  }

  /**
   * Inicjalizuj moduł
   */
  init() {
    console.log('✨ Inicjalizacja Quotes Module...');
    this.render();
  }

  /**
   * Pobierz cytat z API
   */
  async fetchQuote() {
    try {
      console.log('🌐 Pobieranie cytatu...');
      
      // Spróbuj z publicznego API (quotable.io)
      const data = await apiHandler.fetch(
        'https://api.quotable.io/random?minLength=100&maxLength=300',
        {},
        60 * 60 * 1000 // 1 godzina cache
      );
      
      return {
        text: data.content,
        author: data.author.split(',')[0] // Tylko imię
      };
    } catch (error) {
      console.warn('⚠️ API cytatu niedostępne, używam lokalne');
      return this.getRandomLocalQuote();
    }
  }

  /**
   * Lokalne cytaty (fallback)
   */
  getLocalQuotes() {
    return [
      {
        text: "Jedynym sposobem na wspaniałą pracę jest kochać to, co robisz.",
        author: "Steve Jobs"
      },
      {
        text: "Przyszłość należy do tych, którzy wierzą w piękno swoich marzeń.",
        author: "Eleanor Roosevelt"
      },
      {
        text: "Największą chwałę życia stanowi nie upadek, lecz umiejętność podniesienia się po każdym upadku.",
        author: "Nelson Mandela"
      },
      {
        text: "Nie czekaj na idealne warunki. Zacznij teraz, gdzie jesteś, z czym masz.",
        author: "Unknown"
      },
      {
        text: "Sukces to nie cel, to ciągłą drogę.",
        author: "Tony Robbins"
      },
      {
        text: "Stwórz zmianę, którą chcesz widzieć na świecie.",
        author: "Mahatma Gandhi"
      },
      {
        text: "Jedynym barierem dla czegokolwiek jest to, w co wierzysz.",
        author: "Unknown"
      },
      {
        text: "Gdy myślisz, że możliwe, jesteś w połowie drogi do tego.",
        author: "Theodore Roosevelt"
      }
    ];
  }

  /**
   * Losowy cytat z lokalnej bazy
   */
  getRandomLocalQuote() {
    const index = Math.floor(Math.random() * this.quotes.length);
    return this.quotes[index];
  }

  /**
   * Renderuj interfejs
   */
  async render() {
    try {
      // Pokaż loader
      this.element.innerHTML = '<div class="skeleton-loader"></div>';

      // Pobierz cytat
      const quote = await this.fetchQuote();

      // HTML cytatu
      const html = `
        <div class="quote-text">"${quote.text}"</div>
        <div class="quote-author">— ${quote.author}</div>
      `;

      this.element.innerHTML = html;
      console.log('✅ Cytat załadowany');
    } catch (error) {
      console.error('❌ Błąd renderowania cytatu:', error);
      this.element.innerHTML = `
        <div style="color: #f44336; text-align: center; padding: 20px;">
          ❌ Nie można załadować cytatu
        </div>
      `;
    }
  }

  /**
   * Odśwież cytat
   */
  async refresh() {
    console.log('🔄 Odświeżanie cytatu...');
    await this.render();
  }
}

// Instancja globalna
const quotesModule = new QuotesModule();
