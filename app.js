const { App } = require('@slack/bolt');
const cron = require('node-cron');
const db = require('./db');

// 環境変数チェック
if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_SIGNING_SECRET) {
  console.error('エラー: SLACK_BOT_TOKEN と SLACK_SIGNING_SECRET を設定してください');
  console.error('例: export SLACK_BOT_TOKEN=xoxb-your-token');
  console.error('    export SLACK_SIGNING_SECRET=your-secret');
  process.exit(1);
}

// Slackアプリ初期化
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false,
});

// === コマンド: タスク追加 ===
app.command('/task-add', async ({ command, ack, say }) => {
  await ack();
  
  const text = command.text.trim();
  if (!text) {
    await say('使い方: `/task-add タスク名 [@優先度] [YYYY-MM-DD]`\n例: `/task-add 市場調査 @高 2026-02-20`');
    return;
  }
  
  // パース
  let title = text;
  let priority = '中';
  let deadline = null;
  
  // 優先度抽出
  const priorityMatch = text.match(/@(高|中|低)/);
  if (priorityMatch) {
    priority = priorityMatch[1];
    title = title.replace(priorityMatch[0], '').trim();
  }
  
  // 締切抽出
  const deadlineMatch = text.match(/\d{4}-\d{2}-\d{2}/);
  if (deadlineMatch) {
    deadline = deadlineMatch[0];
    title = title.replace(deadlineMatch[0], '').trim();
  }
  
  // DB挿入
  const result = db.run(
    'INSERT INTO tasks (title, priority, deadline, created_by) VALUES (?, ?, ?, ?)',
    [title, priority, deadline, command.user_name]
  );
  
  await say({
    text: `✅ タスク追加しました (ID: ${result.lastInsertRowid})`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `✅ *タスク追加* (ID: ${result.lastInsertRowid})\n*タイトル:* ${title}\n*優先度:* ${priority}${deadline ? `\n*締切:* ${deadline}` : ''}`
        }
      }
    ]
  });
});

// === コマンド: タスクリスト ===
app.command('/task-list', async ({ command, ack, say }) => {
  await ack();
  
  const filter = command.text.trim() || '未着手';
  const tasks = db.all('SELECT * FROM tasks WHERE status = ? ORDER BY priority DESC, deadline ASC', [filter]);
  
  if (tasks.length === 0) {
    await say(`📋 「${filter}」のタスクはありません`);
    return;
  }
  
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `📋 *${filter}タスク一覧* (${tasks.length}件)`
      }
    },
    { type: 'divider' }
  ];
  
  tasks.forEach(task => {
    const priorityIcon = { '高': '🔴', '中': '🟡', '低': '🟢' }[task.priority] || '⚪';
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${priorityIcon} *[${task.id}]* ${task.title}\n優先度: ${task.priority} ${task.deadline ? `| 締切: ${task.deadline}` : ''} ${task.assignee ? `| 担当: ${task.assignee}` : ''}`
      }
    });
  });
  
  await say({ blocks });
});

// === コマンド: タスク完了 ===
app.command('/task-done', async ({ command, ack, say }) => {
  await ack();
  
  const taskId = parseInt(command.text.trim());
  if (isNaN(taskId)) {
    await say('使い方: `/task-done タスクID`\n例: `/task-done 3`');
    return;
  }
  
  db.run('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['完了', taskId]);
  
  const task = db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
  if (!task) {
    await say(`❌ タスクID ${taskId} が見つかりません`);
    return;
  }
  
  await say(`🎉 タスク完了！\n*[${taskId}]* ${task.title}`);
});

// === コマンド: 担当者割り当て ===
app.command('/task-assign', async ({ command, ack, say }) => {
  await ack();
  
  const parts = command.text.trim().split(/\s+/);
  if (parts.length < 2) {
    await say('使い方: `/task-assign タスクID @担当者`\n例: `/task-assign 5 @takemasa`');
    return;
  }
  
  const taskId = parseInt(parts[0]);
  const assignee = parts[1].replace('@', '');
  
  db.run('UPDATE tasks SET assignee = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [assignee, taskId]);
  
  await say(`✅ タスク [${taskId}] を @${assignee} に割り当てました`);
});

// === コマンド: 今日のタスク ===
app.command('/task-today', async ({ command, ack, say }) => {
  await ack();
  
  const today = new Date().toISOString().split('T')[0];
  const tasks = db.all('SELECT * FROM tasks WHERE deadline <= ? AND status != ? ORDER BY priority DESC', [today, '完了']);
  
  if (tasks.length === 0) {
    await say('🎉 今日のタスクはすべて完了しています！');
    return;
  }
  
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `📅 *今日のタスク* (${tasks.length}件)`
      }
    },
    { type: 'divider' }
  ];
  
  tasks.forEach(task => {
    const priorityIcon = { '高': '🔴', '中': '🟡', '低': '🟢' }[task.priority] || '⚪';
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${priorityIcon} *[${task.id}]* ${task.title}\n締切: ${task.deadline} ${task.assignee ? `| 担当: ${task.assignee}` : ''}`
      }
    });
  });
  
  await say({ blocks });
});

// === 定期実行: 毎朝8時に今日のタスク通知 ===
cron.schedule('0 8 * * *', async () => {
  console.log('⏰ 定期通知: 今日のタスク');
  
  const today = new Date().toISOString().split('T')[0];
  const tasks = db.all('SELECT * FROM tasks WHERE deadline <= ? AND status != ? ORDER BY priority DESC', [today, '完了']);
  
  if (tasks.length === 0) return;
  
  const channel = process.env.SLACK_CHANNEL || '#general';
  
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `🌅 *おはようございます！今日のタスク* (${tasks.length}件)`
      }
    },
    { type: 'divider' }
  ];
  
  tasks.forEach(task => {
    const priorityIcon = { '高': '🔴', '中': '🟡', '低': '🟢' }[task.priority] || '⚪';
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${priorityIcon} *[${task.id}]* ${task.title}${task.assignee ? ` (@${task.assignee})` : ''}`
      }
    });
  });
  
  try {
    await app.client.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      channel,
      blocks
    });
  } catch (error) {
    console.error('通知送信エラー:', error);
  }
}, {
  timezone: 'Asia/Tokyo'
});

// アプリ起動
(async () => {
  await db.initDB();
  console.log('✅ データベース初期化完了');
  
  const port = process.env.PORT || 3000;
  await app.start(port);
  console.log(`⚡ Slack Task Bot 起動中 (ポート: ${port})`);
  console.log('📋 利用可能コマンド:');
  console.log('  /task-add    - タスク追加');
  console.log('  /task-list   - タスク一覧');
  console.log('  /task-done   - タスク完了');
  console.log('  /task-assign - 担当者割り当て');
  console.log('  /task-today  - 今日のタスク');
})();
