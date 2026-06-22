const fs = require("fs");
const https = require("https");
const http = require("http");
const path = require("path");

const root = path.join(__dirname, "..", "dist");
const port = 8081;
const mime = {
  ".css": "text/css",
  ".gif": "image/gif",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".js": "text/javascript",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

if (!fs.existsSync(root)) {
  throw new Error(`Missing exported web build at ${root}`);
}

const server = http.createServer((request, response) => {
  const urlPath = decodeURIComponent((request.url || "/").split("?")[0]);

  if (urlPath.startsWith("/api/exercisedb/")) {
    const upstreamPath = request.url.replace(/^\/api\/exercisedb/, "/api/v1");

    https
      .get(
        {
          hostname: "oss.exercisedb.dev",
          path: upstreamPath,
          headers: { Accept: "application/json" },
        },
        (upstream) => {
          response.writeHead(upstream.statusCode || 502, {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store",
            "Content-Type": upstream.headers["content-type"] || "application/json",
          });
          upstream.pipe(response);
        },
      )
      .on("error", (error) => {
        response.writeHead(502, {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
          "Content-Type": "application/json",
        });
        response.end(JSON.stringify({ error: error.message }));
      });
    return;
  }

  const requested = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  let filePath = path.resolve(root, requested);

  if (!filePath.startsWith(root) || !fs.existsSync(filePath)) {
    filePath = path.join(root, "index.html");
  }

  if (!fs.existsSync(filePath)) {
    response.writeHead(404, {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain",
    });
    response.end(`Missing file: ${filePath}`);
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": mime[extension] || "application/octet-stream",
  });
  fs.createReadStream(filePath)
    .on("error", (error) => {
      if (!response.headersSent) {
        response.writeHead(error.code === "ENOENT" ? 404 : 500, {
          "Cache-Control": "no-store",
          "Content-Type": "text/plain",
        });
      }
      response.end(error.message);
    })
    .pipe(response);
});

server.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

server.listen(port, "::", () => {
  console.log(`Listening on http://localhost:${port}`);
});
