#!/usr/bin/env node

const db = require('./db');

const command = process.argv[2];
const args = process.argv.slice(3);

if (!command) {
  console.log('使い方: node cli.js <command> [args]');
  console.log('');
  console.log('コマンド:');
  console.log('  list [status]          - タスク一覧（デフォルト: 未着手）');
  console.log('  add <title> [priority] [deadline] - タスク追加');
  console.log('  done <id>              - タスク完了');
  console.log('  assign <id> <user>     - 担当者割り当て');
  console.log('  today                  - 今日のタスク');
  console.log('  stats                  - 統計情報');
  process.exit(0);
}

(async () => {
  await db.initDB();
  
  switch (command) {
    case 'list': {
      const status = args[0] || '未着手';
      const tasks = db.all('SELECT * FROM tasks WHERE status = ? ORDER BY priority DESC, deadline ASC', [status]);
      
      if (tasks.length === 0) {
        console.log(`📋 「${status}」のタスクはありません`);
        break;
      }
      
      console.log(`📋 ${status}タスク一覧 (${tasks.length}件)\n`);
      tasks.forEach(task => {
        const icon = { '高': '🔴', '中': '🟡', '低': '🟢' }[task.priority] || '⚪';
        console.log(`${icon} [${task.id}] ${task.title}`);
        console.log(`   優先度: ${task.priority} ${task.deadline ? `| 締切: ${task.deadline}` : ''} ${task.assignee ? `| 担当: ${task.assignee}` : ''}`);
        console.log('');
      });
      break;
    }
    
    case 'add': {
      const title = args[0];
      if (!title) {
        console.error('❌ タスク名を指定してください');
        process.exit(1);
      }
      
      const priority = args[1] || '中';
      const deadline = args[2] || null;
      
      const result = db.run('INSERT INTO tasks (title, priority, deadline, created_by) VALUES (?, ?, ?, ?)', 
                            [title, priority, deadline, 'cli']);
      
      console.log(`✅ タスク追加 (ID: ${result.lastInsertRowid})`);
      console.log(`   タイトル: ${title}`);
      console.log(`   優先度: ${priority}`);
      if (deadline) console.log(`   締切: ${deadline}`);
      break;
    }
    
    case 'done': {
      const taskId = parseInt(args[0]);
      if (isNaN(taskId)) {
        console.error('❌ タスクIDを指定してください');
        process.exit(1);
      }
      
      db.run('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['完了', taskId]);
      
      const task = db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
      if (!task) {
        console.error(`❌ タスクID ${taskId} が見つかりません`);
        process.exit(1);
      }
      
      console.log(`🎉 タスク完了！`);
      console.log(`   [${taskId}] ${task.title}`);
      break;
    }
    
    case 'assign': {
      const taskId = parseInt(args[0]);
      const assignee = args[1];
      
      if (isNaN(taskId) || !assignee) {
        console.error('❌ タスクIDと担当者を指定してください');
        console.error('   例: node cli.js assign 5 takemasa');
        process.exit(1);
      }
      
      db.run('UPDATE tasks SET assignee = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [assignee, taskId]);
      
      console.log(`✅ タスク [${taskId}] を ${assignee} に割り当てました`);
      break;
    }
    
    case 'today': {
      const today = new Date().toISOString().split('T')[0];
      const tasks = db.all('SELECT * FROM tasks WHERE deadline <= ? AND status != ? ORDER BY priority DESC', 
                           [today, '完了']);
      
      if (tasks.length === 0) {
        console.log('🎉 今日のタスクはすべて完了しています！');
        break;
      }
      
      console.log(`📅 今日のタスク (${tasks.length}件)\n`);
      tasks.forEach(task => {
        const icon = { '高': '🔴', '中': '🟡', '低': '🟢' }[task.priority] || '⚪';
        console.log(`${icon} [${task.id}] ${task.title}`);
        console.log(`   締切: ${task.deadline} ${task.assignee ? `| 担当: ${task.assignee}` : ''}`);
        console.log('');
      });
      break;
    }
    
    case 'stats': {
      const total = db.get('SELECT COUNT(*) as count FROM tasks');
      const byStatus = db.all('SELECT status, COUNT(*) as count FROM tasks GROUP BY status');
      const byPriority = db.all('SELECT priority, COUNT(*) as count FROM tasks WHERE status != ? GROUP BY priority', ['完了']);
      
      console.log('📊 タスク統計\n');
      console.log(`総タスク数: ${total.count}件\n`);
      
      console.log('ステータス別:');
      byStatus.forEach(row => {
        console.log(`  ${row.status}: ${row.count}件`);
      });
      console.log('');
      
      console.log('優先度別（未完了のみ）:');
      byPriority.forEach(row => {
        const icon = { '高': '🔴', '中': '🟡', '低': '🟢' }[row.priority] || '⚪';
        console.log(`  ${icon} ${row.priority}: ${row.count}件`);
      });
      break;
    }
    
    default:
      console.error(`❌ 不明なコマンド: ${command}`);
      process.exit(1);
  }
})();
