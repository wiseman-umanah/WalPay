import { parse } from "node:url";
import { readJsonBody, sendJson, HttpError } from "./utils/http.js";
import { logger } from "./utils/logger.js";

const routes = [];

export function registerRoute(method, path, handler, options = {}) {
  const { requireAuth = false } = options;
  const { regex, keys } = compilePath(path);
  routes.push({ method: method.toUpperCase(), path, handler, regex, keys, requireAuth });
  try {
    logger.info && logger.info("registerRoute", { method: method.toUpperCase(), path, requireAuth });
  } catch (e) {
    /* ignore */
  }
}

export async function handleRequest(req, res, context) {
  const { pathname, query } = parse(req.url, true);
  try {
    logger.debug && logger.debug("handleRequest: incoming", { method: req.method, pathname });
  } catch (e) {
    /* ignore */
  }
  const route = routes.find((r) => r.method === req.method && r.regex.test(pathname));

  if (!route) {
    try {
      logger.info && logger.info("handleRequest: no matching route", { method: req.method, pathname });
    } catch (e) {
      /* ignore */
    }
    sendJson(res, 404, { error: "Not Found" });
    return;
  }

  try {
    logger.debug && logger.debug("handleRequest: matched route", { route: route.path, method: route.method });
  } catch (e) {
    /* ignore */
  }

  const matches = route.regex.exec(pathname);
  const params = {};
  if (matches) {
    route.keys.forEach((key, index) => {
      params[key] = matches[index + 1];
    });
  }

  let body = {};
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    body = await readJsonBody(req);
  }

  if (route.requireAuth && !context.currentSeller) {
    sendJson(res, 401, { error: "Unauthorized" });
    return;
  }

  try {
    await route.handler({
      req,
      res,
      body,
      params,
      query,
      seller: context.currentSeller,
      session: context.session,
      authToken: context.token,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      sendJson(res, err.statusCode, { error: err.message });
      return;
    }
    logger.error("Unhandled error", err);
    sendJson(res, 500, { error: "Internal Server Error" });
  }
}

function compilePath(path) {
  const keys = [];
  const pattern = path
    .split("/")
    .map((segment) => {
      if (segment.startsWith(":")) {
        keys.push(segment.slice(1));
        return "([^/]+)";
      }
      return segment;
    })
    .join("/");
  return { regex: new RegExp(`^${pattern}$`), keys };
}
