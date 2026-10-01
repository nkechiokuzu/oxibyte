import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "drizzle-kit";

// `pnpm --filter @workspace/db run push` runs with this directory as cwd,
// so drizzle-kit's own automatic .env lookup (which only checks cwd) never
// finds the workspace root's .env. Load it explicitly instead, without
// clobbering a DATABASE_URL that's already set by the real environment
// (e.g. a production deploy where it's injected directly, no .env file).
//
// Parsed by hand rather than via process.loadEnvFile(): that API only
// landed in fairly recent Node versions, and silently doing nothing on an
// older Node would just reproduce the exact error this is meant to fix.
function loadRootEnvFile() {
  const rootEnvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env");
  if (!fs.existsSync(rootEnvPath)) return;

  const contents = fs.readFileSync(rootEnvPath, "utf-8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

if (!process.env.DATABASE_URL) {
  loadRootEnvFile();
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});