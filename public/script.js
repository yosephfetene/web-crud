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
          <div class="meta">${m.director} • ${m.year || "N/A"}</div>
          <div class="rating">⭐ ${m.rating ?? "N/A"}</div>
          <p>${m.review || ""}</p>
          <small>ID: ${m.id}</small>
        </div>
      `
      )
      .join("");
  } catch (err) {
    container.innerHTML = "<p>Failed to load movies.</p>";
  }
}

async function addMovie(event) {
  event.preventDefault();
  const message = document.getElementById("form-message");
  message.textContent = "";

  const newMovie = {
    title: document.getElementById("title").value.trim(),
    director: document.getElementById("director").value.trim(),
    year: document.getElementById("year").value
      ? parseInt(document.getElementById("year").value, 10)
      : null,
    rating: document.getElementById("rating").value
      ? parseFloat(document.getElementById("rating").value)
      : null,
    review: document.getElementById("review").value.trim(),
  };

  try {
    const res = await fetch("/movies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMovie),
    });

    const data = await res.json();

    if (!res.ok) {
      message.textContent = data.error || "Failed to add movie.";
      message.style.color = "red";
      return;
    }

    message.textContent = "Movie added!";
    message.style.color = "green";
    document.getElementById("movie-form").reset();
    loadMovies();
  } catch (err) {
    message.textContent = "Network error.";
    message.style.color = "red";
  }
}

document.getElementById("movie-form").addEventListener("submit", addMovie);
loadMovies();
