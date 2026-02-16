const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const port = process.env.PORT || 3030;

app.use(express.json());
app.use(express.static('public'));

// DB初期化
(async () => {
  await db.initDB();
  console.log('✅ データベース初期化完了');
})();

// === API: タスク一覧 ===
app.get('/api/tasks', (req, res) => {
  const status = req.query.status || null;
  
  let tasks;
  if (status) {
    tasks = db.all('SELECT * FROM tasks WHERE status = ? ORDER BY priority DESC, deadline ASC, id DESC', [status]);
  } else {
    tasks = db.all('SELECT * FROM tasks ORDER BY priority DESC, deadline ASC, id DESC');
  }
  
  res.json(tasks);
});

// === API: タスク追加 ===
app.post('/api/tasks', (req, res) => {
  const { title, priority, deadline, category, sub_category, assignee } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'タスク名が必要です' });
  }
  
  const result = db.run(
    'INSERT INTO tasks (title, priority, deadline, category, sub_category, assignee, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [title, priority || '中', deadline || null, category || null, sub_category || null, assignee || null, 'web']
  );
  
  const task = db.get('SELECT * FROM tasks WHERE id = ?', [result.lastInsertRowid]);
  res.json(task);
});

// === API: タスク更新 ===
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, priority, status, deadline, category, sub_category, assignee } = req.body;
  
  const task = db.get('SELECT * FROM tasks WHERE id = ?', [id]);
  if (!task) {
    return res.status(404).json({ error: 'タスクが見つかりません' });
  }
  
  db.run(
    'UPDATE tasks SET title = ?, priority = ?, status = ?, deadline = ?, category = ?, sub_category = ?, assignee = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [
      title !== undefined ? title : task.title,
      priority !== undefined ? priority : task.priority,
      status !== undefined ? status : task.status,
      deadline !== undefined ? deadline : task.deadline,
      category !== undefined ? category : task.category,
      sub_category !== undefined ? sub_category : task.sub_category,
      assignee !== undefined ? assignee : task.assignee,
      id
    ]
  );
  
  const updatedTask = db.get('SELECT * FROM tasks WHERE id = ?', [id]);
  res.json(updatedTask);
});

// === API: タスク削除 ===
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM tasks WHERE id = ?', [id]);
  res.json({ success: true });
});

// === API: 統計 ===
app.get('/api/stats', (req, res) => {
  const total = db.get('SELECT COUNT(*) as count FROM tasks');
  const byStatus = db.all('SELECT status, COUNT(*) as count FROM tasks GROUP BY status');
  const byPriority = db.all('SELECT priority, COUNT(*) as count FROM tasks WHERE status != ? GROUP BY priority', ['完了']);
  
  res.json({
    total: total.count,
    byStatus,
    byPriority
  });
});

// === API: 初期化（ParkAlertタスク追加） ===
app.post('/api/init-parkalert', (req, res) => {
  const authToken = req.headers['x-admin-token'];
  if (authToken !== process.env.ADMIN_TOKEN && authToken !== 'init-2026') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  const PARKALERT_TASKS = require('./add-parkalert-tasks-data.json');
  
  let count = 0;
  const added = [];
  
  PARKALERT_TASKS.forEach(task => {
    const result = db.run(
      'INSERT INTO tasks (title, category, sub_category, priority, status, deadline, assignee, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [task.title, task.category, task.sub_category, task.priority, task.status, task.deadline, task.assignee, 'parkalert-init']
    );
    count++;
    added.push({ id: result.lastInsertRowid, title: task.title });
  });
  
  res.json({
    success: true,
    count,
    tasks: added
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 タスク管理Web UI起動: http://localhost:${port}`);
  console.log(`📱 チームメンバーは http://あなたのIP:${port} でアクセス`);
});
