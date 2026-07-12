/**
 * Online backup of the SQLite database (safe while the server is running,
 * thanks to WAL). Keeps the newest 14 backups.
 *
 *   node scripts/backupdb.mjs [output-dir]   (default: <project>/backups)
 */
import Database from "better-sqlite3";
import { mkdirSync, readdirSync, statSync, unlinkSync, existsSync } from "fs";
import path from "path";

const root = process.cwd();
const dbFile = path.join(root, "data", "beka.db");
if (!existsSync(dbFile)) {
  console.error("no database at", dbFile);
  process.exit(1);
}

const outDir = process.argv[2] ?? path.join(root, "backups");
mkdirSync(outDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
const target = path.join(outDir, `beka-${stamp}.db`);

const db = new Database(dbFile, { readonly: true });
await db.backup(target);
db.close();
console.log("backup written:", target);

// retention: newest 14
const KEEP = 14;
const backups = readdirSync(outDir)
  .filter((f) => /^beka-.*\.db$/.test(f))
  .map((f) => ({ f, t: statSync(path.join(outDir, f)).mtimeMs }))
  .sort((a, b) => b.t - a.t);
for (const old of backups.slice(KEEP)) {
  unlinkSync(path.join(outDir, old.f));
  console.log("pruned:", old.f);
}
