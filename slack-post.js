#!/usr/bin/env node

// Slackに直接投稿するスクリプト（openclaw message経由）
const { execSync } = require('child_process');
const db = require('./db');

async function postToSlack(message) {
  try {
    // openclaw message コマンドでSlackに投稿
    execSync(`openclaw message send --channel slack --target general --message "${message.replace(/"/g, '\\"')}"`, {
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('Slack投稿エラー:', error.message);
  }
}

async function postTaskList() {
  await db.initDB();
  
  const tasks = db.all('SELECT * FROM tasks WHERE status = ? ORDER BY priority DESC, deadline ASC', ['未着手']);
  
  if (tasks.length === 0) {
    await postToSlack('📋 現在のタスクはすべて完了しています！🎉');
    return;
  }
  
  let message = `📋 *タスク一覧* (${tasks.length}件)\n\n`;
  
  tasks.forEach(task => {
    const icon = { '高': '🔴', '中': '🟡', '低': '🟢' }[task.priority] || '⚪';
    message += `${icon} [${task.id}] ${task.title}`;
    if (task.deadline) message += ` (締切: ${task.deadline})`;
    if (task.assignee) message += ` @${task.assignee}`;
    message += '\n';
  });
  
  await postToSlack(message);
}

async function postTodayTasks() {
  await db.initDB();
  
  const today = new Date().toISOString().split('T')[0];
  const tasks = db.all('SELECT * FROM tasks WHERE deadline <= ? AND status != ? ORDER BY priority DESC', [today, '完了']);
  
  if (tasks.length === 0) {
    await postToSlack('🌅 おはようございます！今日のタスクはすべて完了しています！🎉');
    return;
  }
  
  let message = `🌅 *おはようございます！今日のタスク* (${tasks.length}件)\n\n`;
  
  tasks.forEach(task => {
    const icon = { '高': '🔴', '中': '🟡', '低': '🟢' }[task.priority] || '⚪';
    message += `${icon} [${task.id}] ${task.title}`;
    if (task.assignee) message += ` @${task.assignee}`;
    message += '\n';
  });
  
  await postToSlack(message);
}

// コマンドライン引数で動作を変える
const action = process.argv[2] || 'list';

(async () => {
  switch (action) {
    case 'today':
      await postTodayTasks();
      break;
    case 'list':
    default:
      await postTaskList();
      break;
  }
})();
