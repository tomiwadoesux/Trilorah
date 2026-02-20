const Database = require("better-sqlite3");
const db = new Database("bible.db", { verbose: console.log });

// 1. List all tables
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table'")
  .all();
console.log("TABLES:", tables);

// 2. Get one row from the first table to see column names
if (tables.length > 0) {
  const firstTable = tables[0].name;
  const row = db.prepare(`SELECT * FROM ${firstTable} LIMIT 1`).get();
  console.log("COLUMNS:", row);
}
