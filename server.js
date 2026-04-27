const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const DATA_FILE = path.join(__dirname, "data", "movies.json");
const PUBLIC_DIR = path.join(__dirname, "public");

function readMovies() {
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

function writeMovies(movies) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(movies, null, 2));
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function serveStatic(req, res) {
  let filePath = req.url === "/" ? "/index.html" : req.url;
  const fullPath = path.join(PUBLIC_DIR, filePath);

  const extToType = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
  };
  const ext = path.extname(fullPath);
  const contentType = extToType[ext] || "text/plain";

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const { method, url } = req;

  if (method === "GET" && url === "/movies") {
    try {
      const movies = readMovies();
      sendJSON(res, 200, movies);
    } catch (err) {
      sendJSON(res, 500, { error: "Could not read movies file." });
    }
    return;
  }

  const movieIdMatch = url.match(/^\/movies\/(\d+)$/);
  if (method === "GET" && movieIdMatch) {
    const id = parseInt(movieIdMatch[1], 10);
    try {
      const movies = readMovies();
      const movie = movies.find((m) => m.id === id);
      if (!movie) {
        sendJSON(res, 404, { error: "Movie not found." });
        return;
      }
      sendJSON(res, 200, movie);
    } catch (err) {
      sendJSON(res, 500, { error: "Could not read movies file." });
    }
    return;
  }

  if (method === "POST" && url === "/movies") {
    try {
      const body = await parseBody(req);
      const { title, director, year, rating, review } = body;

      if (!title || !director) {
        sendJSON(res, 400, { error: "Title and director are required." });
        return;
      }

      const movies = readMovies();
      const newId = movies.length > 0 ? Math.max(...movies.map((m) => m.id)) + 1 : 1;
      const newMovie = {
        id: newId,
        title,
        director,
        year: year || null,
        rating: rating || null,
        review: review || "",
      };

      movies.push(newMovie);
      writeMovies(movies);
      sendJSON(res, 201, newMovie);
    } catch (err) {
      sendJSON(res, 400, { error: "Invalid request body." });
    }
    return;
  }

  if (method === "PUT" && movieIdMatch) {
    const id = parseInt(movieIdMatch[1], 10);
    try {
      const body = await parseBody(req);
      const movies = readMovies();
      const index = movies.findIndex((m) => m.id === id);

      if (index === -1) {
        sendJSON(res, 404, { error: "Movie not found." });
        return;
      }

      const current = movies[index];
      const updated = {
        id: current.id,
        title: body.title !== undefined ? body.title : current.title,
        director: body.director !== undefined ? body.director : current.director,
        year: body.year !== undefined ? body.year : current.year,
        rating: body.rating !== undefined ? body.rating : current.rating,
        review: body.review !== undefined ? body.review : current.review,
      };

      if (!updated.title || !updated.director) {
        sendJSON(res, 400, { error: "Title and director are required." });
        return;
      }

      movies[index] = updated;
      writeMovies(movies);
      sendJSON(res, 200, updated);
    } catch (err) {
      sendJSON(res, 400, { error: "Invalid request body." });
    }
    return;
  }

  if (method === "DELETE" && movieIdMatch) {
    const id = parseInt(movieIdMatch[1], 10);
    try {
      const movies = readMovies();
      const index = movies.findIndex((m) => m.id === id);

      if (index === -1) {
        sendJSON(res, 404, { error: "Movie not found." });
        return;
      }

      const [deleted] = movies.splice(index, 1);
      writeMovies(movies);
      sendJSON(res, 200, { message: "Movie deleted.", movie: deleted });
    } catch (err) {
      sendJSON(res, 500, { error: "Could not delete movie." });
    }
    return;
  }

  if (method === "GET") {
    serveStatic(req, res);
    return;
  }

  sendJSON(res, 404, { error: "Route not found." });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
