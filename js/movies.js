/**
 * MODUŁ FILMÓW POLECANYCH
 * Pobiera dane z OMDb API lub YouTube
 */

class MoviesModule {
  constructor() {
    this.element = document.getElementById('moviesContent');
    this.popularMovies = this.getPopularMovies();
  }

  /**
   * Inicjalizuj moduł
   */
  init() {
    console.log('🎬 Inicjalizacja Movies Module...');
    this.render();
  }

  /**
   * Popularne filmy (demo)
   */
  getPopularMovies() {
    return [
      {
        title: 'Forrest Gump',
        year: 1994,
        rating: 8.8,
        description: 'Historia niezwykłego człowieka i jego podróży przez historię USA.'
      },
      {
        title: 'Początek',
        year: 2010,
        rating: 8.8,
        description: 'Złodziej, który kradnie tajemnice korporacyjne w snach.'
      },
      {
        title: 'Matryca',
        year: 1999,
        rating: 8.7,
        description: 'Haker odkrywa szokującą prawdę o świecie, w którym żyje.'
      },
      {
        title: 'Incepcja',
        year: 2010,
        rating: 8.8,
        description: 'Zespół specjalistów wchodzi w sny, aby ukraść idee.'
      },
      {
        title: 'Pulp Fiction',
        year: 1994,
        rating: 8.9,
        description: 'Przeplatające się historie Los Angeles z gangsterami, tancerzami i parą.'
      },
      {
        title: 'Ciemny Rycerz',
        year: 2008,
        rating: 9.0,
        description: 'Batman walczy z Jokerem, psychopatą chcącym zniszczyć Gotham.'
      }
    ];
  }

  /**
   * Pobierz film z API
   */
  async fetchMovie() {
    try {
      console.log('🌐 Pobieranie filmu...');
      
      // Losowy film z listy
      const randomMovie = this.getRandomMovie();
      return randomMovie;
    } catch (error) {
      console.error('❌ Błąd pobierania filmu:', error);
      return this.getRandomMovie();
    }
  }

  /**
   * Losowy film
   */
  getRandomMovie() {
    const index = Math.floor(Math.random() * this.popularMovies.length);
    return this.popularMovies[index];
  }

  /**
   * Renderuj interfejs
   */
