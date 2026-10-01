import "./lib/load-env";
import app from "./app";
import { logger } from "./lib/logger";

// Replit injects PORT automatically; default to 5000 locally (VS Code, CI).
const rawPort = process.env["PORT"] ?? "5000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const host = process.env["HOST"] ?? "0.0.0.0";

app.listen(port, host, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port, host }, `Server listening on http://${host}:${port}`);
});
