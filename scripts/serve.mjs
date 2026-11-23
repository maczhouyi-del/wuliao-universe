import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../public", import.meta.url)).replace(
  /\/$/,
  "",
);
const portOption = process.argv.indexOf("--port");
const port = Number(
  portOption < 0 ? process.env.PORT || 3000 : process.argv[portOption + 1],
);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    const relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    const extension = extname(relativePath);
    const file = resolve(root, extension ? relativePath : "index.html");
    if (!file.startsWith(root + sep)) {
      response.writeHead(404).end();
      return;
    }
    const body = await readFile(file);
    response.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404).end();
  }
}).listen(port, "0.0.0.0", () =>
  console.log("无聊宇宙 http://localhost:" + port),
);
