async function loadMovies() {
  const container = document.getElementById("movies");
  try {
    const res = await fetch("/movies");
    const movies = await res.json();

    if (movies.length === 0) {
      container.innerHTML = "<p>No movies yet.</p>";
      return;
    }

    container.innerHTML = movies
      .map(
        (m) => `
        <div class="movie-card">
          <h3>${m.title}</h3>
          <div class="meta">${m.director} • ${m.year}</div>
          <div class="rating">⭐ ${m.rating}</div>
          <p>${m.review}</p>
        </div>
      `
      )
      .join("");
  } catch (err) {
    container.innerHTML = "<p>Failed to load movies.</p>";
  }
}

loadMovies();
