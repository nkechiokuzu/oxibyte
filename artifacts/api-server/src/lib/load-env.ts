import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// This must be the very first import in index.ts. `@workspace/db` throws at
// import time if DATABASE_URL isn't already set, and ES module imports are
// evaluated before the importing module's own top-level code runs — so
// env-loading has to live in its own side-effect module, imported first,
// rather than as a plain statement above the `import app from "./app"` line
// (that wouldn't actually run first; import evaluation always does).
//
// esbuild bundles this file into dist/index.mjs, so import.meta.url below
// resolves to that single output file's location, not this file's original
// path — hence three levels up to reach the workspace root.
//
// Parsed by hand rather than via process.loadEnvFile(): that API only
// landed in fairly recent Node versions, and silently doing nothing on an
// older Node would just leave DATABASE_URL unset with no clear signal why.
function loadRootEnvFile() {
  const rootEnvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env");
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
