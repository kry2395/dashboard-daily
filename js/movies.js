class MoviesModule {
  constructor() {
    this.element = document.getElementById('moviesContent');
    this.popularMovies = [
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

  init() {
    this.render();
  }

  getRandomMovie() {
    return this.popularMovies[Math.floor(Math.random() * this.popularMovies.length)];
  }

  render() {
    const movie = this.getRandomMovie();
    this.element.innerHTML = `
      <div class="movie-title">${movie.title}</div>
      <div class="movie-year">${movie.year}</div>
      <div class="movie-rating">★ ${movie.rating}/10</div>
      <p class="movie-description">${movie.description}</p>
    `;
  }

  refresh() {
    this.render();
  }
}

const moviesModule = new MoviesModule();
