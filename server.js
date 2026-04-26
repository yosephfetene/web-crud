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

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
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

const server = http.createServer((req, res) => {
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

  if (method === "GET") {
    serveStatic(req, res);
    return;
  }

  sendJSON(res, 404, { error: "Route not found." });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
