import { registerRoute } from "../router.js";

registerRoute("GET", "/", async ({ res }) => {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
  });
  res.end("<!doctype html><html><body>Hello world</body></html>");
});
