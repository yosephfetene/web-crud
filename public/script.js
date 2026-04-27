let editingId = null;

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
        <div class="movie-card" data-id="${m.id}">
          <h3>${m.title}</h3>
          <div class="meta">${m.director} • ${m.year || "N/A"}</div>
          <div class="rating">⭐ ${m.rating ?? "N/A"}</div>
          <p>${m.review || ""}</p>
          <small>ID: ${m.id}</small>
          <div class="actions">
            <button class="edit-btn" data-id="${m.id}">Edit</button>
            <button class="delete-btn" data-id="${m.id}">Delete</button>
          </div>
        </div>
      `
      )
      .join("");

    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => startEdit(parseInt(btn.dataset.id, 10)));
    });
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteMovie(parseInt(btn.dataset.id, 10)));
    });
  } catch (err) {
    container.innerHTML = "<p>Failed to load movies.</p>";
  }
}

async function startEdit(id) {
  try {
    const res = await fetch(`/movies/${id}`);
    if (!res.ok) return;
    const movie = await res.json();

    document.getElementById("title").value = movie.title || "";
    document.getElementById("director").value = movie.director || "";
    document.getElementById("year").value = movie.year || "";
    document.getElementById("rating").value = movie.rating || "";
    document.getElementById("review").value = movie.review || "";

    editingId = id;
    document.getElementById("form-title").textContent = `Edit Movie #${id}`;
    document.getElementById("submit-btn").textContent = "Update Movie";
    document.getElementById("cancel-btn").classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error(err);
  }
}

function cancelEdit() {
  editingId = null;
  document.getElementById("movie-form").reset();
  document.getElementById("form-title").textContent = "Add a Movie";
  document.getElementById("submit-btn").textContent = "Add Movie";
  document.getElementById("cancel-btn").classList.add("hidden");
  document.getElementById("form-message").textContent = "";
}

async function deleteMovie(id) {
  if (!confirm("Delete this movie?")) return;
  try {
    const res = await fetch(`/movies/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete movie.");
      return;
    }
    if (editingId === id) cancelEdit();
    loadMovies();
  } catch (err) {
    alert("Network error.");
  }
}

async function submitForm(event) {
  event.preventDefault();
  const message = document.getElementById("form-message");
  message.textContent = "";

  const payload = {
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

  const isEdit = editingId !== null;
  const url = isEdit ? `/movies/${editingId}` : "/movies";
  const method = isEdit ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      message.textContent = data.error || "Request failed.";
      message.style.color = "red";
      return;
    }

    message.textContent = isEdit ? "Movie updated!" : "Movie added!";
    message.style.color = "green";
    cancelEdit();
    loadMovies();
  } catch (err) {
    message.textContent = "Network error.";
    message.style.color = "red";
  }
}

document.getElementById("movie-form").addEventListener("submit", submitForm);
document.getElementById("cancel-btn").addEventListener("click", cancelEdit);
loadMovies();
