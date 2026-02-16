const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'tasks.db');
let db = null;
let SQL = null;

async function initDB() {
  if (db) return db;
  
  SQL = await initSqlJs();
  
  // 既存DBを読み込むか、新規作成
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  // テーブル作成
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT,
      priority TEXT DEFAULT '中',
      status TEXT DEFAULT '未着手',
      deadline TEXT,
      assignee TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  saveDB();
  return db;
}

function saveDB() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return db;
}

// ヘルパー関数
function query(sql, params = []) {
  const db = getDB();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

function run(sql, params = []) {
  const db = getDB();
  db.run(sql, params);
  saveDB();
  
  // 最後に挿入されたIDを取得
  const result = query('SELECT last_insert_rowid() as id');
  return { lastInsertRowid: result[0].id, changes: 1 };
}

function get(sql, params = []) {
  const results = query(sql, params);
  return results.length > 0 ? results[0] : null;
}

function all(sql, params = []) {
  return query(sql, params);
}

module.exports = {
  initDB,
  saveDB,
  getDB,
  query,
  run,
  get,
  all
};
