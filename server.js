const http = require("http");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT || 3000;
const dataFile = path.join(__dirname, "resources.json");
const uploadDir = path.join(__dirname, "uploads");
const contentTypes = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };

function readResources() {
  try { return JSON.parse(fs.readFileSync(dataFile, "utf8")); } catch { return []; }
}

const server = http.createServer((request, response) => {
  if (request.url === "/api/resources" && request.method === "GET") {
    response.writeHead(200, { "Content-Type": "application/json" }); response.end(JSON.stringify(readResources())); return;
  }
  if (request.url === "/api/resources" && request.method === "POST") {
    let body = ""; request.on("data", (chunk) => { body += chunk; }); request.on("end", () => {
      try {
        const resource = JSON.parse(body);
        if (!resource.title || !resource.description || !resource.author) throw new Error("Missing required fields");
        if (resource.fileData && resource.fileName) { fs.mkdirSync(uploadDir, { recursive: true }); const safeName = path.basename(resource.fileName).replace(/[^a-zA-Z0-9._-]/g, "_"); fs.writeFileSync(path.join(uploadDir, `${resource.id}-${safeName}`), Buffer.from(resource.fileData, "base64")); resource.fileUrl = `/uploads/${resource.id}-${safeName}`; delete resource.fileData; }
        const resources = readResources(); resources.unshift(resource); fs.writeFileSync(dataFile, JSON.stringify(resources, null, 2));
        response.writeHead(201, { "Content-Type": "application/json" }); response.end(JSON.stringify(resource));
      } catch (error) { response.writeHead(400, { "Content-Type": "application/json" }); response.end(JSON.stringify({ error: error.message })); }
    }); return;
  }
  const requested = request.url === "/" ? "/index.html" : request.url;
  const filePath = path.join(__dirname, requested);
  if (!filePath.startsWith(__dirname)) { response.writeHead(403); response.end("Forbidden"); return; }
  fs.readFile(filePath, (error, content) => { if (error) { response.writeHead(404); response.end("Not found"); return; } response.writeHead(200, { "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream" }); response.end(content); });
});

server.listen(port, () => console.log(`Bright Archive running at http://localhost:${port}`));