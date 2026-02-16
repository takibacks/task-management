#!/usr/bin/env node

const db = require('./db');

async function migrate() {
  await db.initDB();
  
  console.log('🔧 データベース構造を更新中...\n');
  
  // sub_category 列を追加
  try {
    db.run('ALTER TABLE tasks ADD COLUMN sub_category TEXT');
    console.log('✅ sub_category 列を追加しました');
  } catch (err) {
    console.log('⚠️  sub_category 列は既に存在します');
  }
  
  // 既存タスクに sub_category を自動設定
  const tasks = db.all('SELECT * FROM tasks');
  
  tasks.forEach(task => {
    let subCategory = null;
    
    // タイトルから中項目を推測
    if (task.title.includes('リスト') || task.title.includes('アプローチ') || task.title.includes('営業') || task.title.includes('ASP')) {
      subCategory = '営業';
    } else if (task.title.includes('リサーチ') || task.title.includes('キーワード') || task.title.includes('提案資料') || task.title.includes('市場')) {
      subCategory = 'マーケティング';
    } else if (task.title.includes('記事') || task.title.includes('ページ') || task.title.includes('動画') || task.title.includes('LP') || task.title.includes('コンテンツ')) {
      subCategory = 'コンテンツ制作';
    } else if (task.title.includes('システム') || task.title.includes('UI') || task.title.includes('Slack') || task.title.includes('CRM')) {
      subCategory = 'システム';
    } else {
      subCategory = 'その他';
    }
    
    db.run('UPDATE tasks SET sub_category = ? WHERE id = ?', [subCategory, task.id]);
    console.log(`✅ [${task.id}] ${task.title} → ${subCategory}`);
  });
  
  console.log('\n✅ マイグレーション完了！');
}

migrate().catch(console.error);
