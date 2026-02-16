#!/usr/bin/env node

/**
 * 初期タスク生成: 1億円達成 Week 1
 * 3人に振り分け、3日サイクルで管理
 */

const db = require('./db');

const TEAM = {
  strategy: 'takemasa',     // 戦略・マーケ
  sales: 'りゅうさん',       // 営業・集客
  content: 'マッチョ'        // コンテンツ制作
};

const INITIAL_TASKS = [
  // === アフィリエイト（最優先） ===
  {
    title: 'アフィリエイト: 高額案件リサーチ（金融・不動産・SaaS）',
    category: 'アフィリエイト',
    priority: '高',
    assignee: TEAM.strategy,
    deadline: '2026-02-18',
    status: '未着手'
  },
  {
    title: 'アフィリエイト: ASP登録（A8/アクセストレード/felmat）',
    category: 'アフィリエイト',
    priority: '高',
    assignee: TEAM.sales,
    deadline: '2026-02-17',
    status: '未着手'
  },
  {
    title: 'アフィリエイト: 比較記事テンプレート作成',
    category: 'アフィリエイト',
    priority: '高',
    assignee: TEAM.content,
    deadline: '2026-02-19',
    status: '未着手'
  },
  {
    title: 'アフィリエイト: SEOキーワード選定（10件）',
    category: 'アフィリエイト',
    priority: '高',
    assignee: TEAM.strategy,
    deadline: '2026-02-19',
    status: '未着手'
  },
  {
    title: 'アフィリエイト: ランディングページ作成（1本目）',
    category: 'アフィリエイト',
    priority: '高',
    assignee: TEAM.content,
    deadline: '2026-02-20',
    status: '未着手'
  },
  
  // === TikTok広告運用代行 ===
  {
    title: 'TikTok広告: ターゲット業界リスト作成（50社）',
    category: 'TikTok広告運用代行',
    priority: '高',
    assignee: TEAM.sales,
    deadline: '2026-02-18',
    status: '未着手'
  },
  {
    title: 'TikTok広告: 提案資料作成（成功事例付き）',
    category: 'TikTok広告運用代行',
    priority: '中',
    assignee: TEAM.strategy,
    deadline: '2026-02-20',
    status: '未着手'
  },
  {
    title: 'TikTok広告: サンプル動画制作（3本）',
    category: 'TikTok広告運用代行',
    priority: '中',
    assignee: TEAM.content,
    deadline: '2026-02-21',
    status: '未着手'
  },
  {
    title: 'TikTok広告: 初回アプローチメール作成・送信（10社）',
    category: 'TikTok広告運用代行',
    priority: '高',
    assignee: TEAM.sales,
    deadline: '2026-02-19',
    status: '未着手'
  },
  
  // === インフラ・システム ===
  {
    title: 'システム: タスク管理UI動作確認・チームオンボーディング',
    category: 'システム',
    priority: '高',
    assignee: TEAM.strategy,
    deadline: '2026-02-17',
    status: '未着手'
  },
  {
    title: 'システム: Slack自動通知テスト',
    category: 'システム',
    priority: '中',
    assignee: TEAM.strategy,
    deadline: '2026-02-18',
    status: '未着手'
  },
  {
    title: 'システム: 営業メール自動送信設定',
    category: 'システム',
    priority: '中',
    assignee: TEAM.sales,
    deadline: '2026-02-19',
    status: '未着手'
  },
  
  // === デジタルコンテンツ販売（準備）===
  {
    title: 'コンテンツ: 販売プラットフォーム選定（Brain/note/Gumroad）',
    category: 'デジタルコンテンツ販売',
    priority: '低',
    assignee: TEAM.strategy,
    deadline: '2026-02-21',
    status: '未着手'
  },
  {
    title: 'コンテンツ: 第1弾コンテンツテーマ決定',
    category: 'デジタルコンテンツ販売',
    priority: '低',
    assignee: TEAM.content,
    deadline: '2026-02-22',
    status: '未着手'
  },
  
  // === 営業基盤 ===
  {
    title: '営業: 企業リスト収集ツール選定（LinkedIn Sales Navigator検討）',
    category: '営業基盤',
    priority: '中',
    assignee: TEAM.sales,
    deadline: '2026-02-20',
    status: '未着手'
  },
  {
    title: '営業: CRM選定（Notion/スプレッドシート/HubSpot）',
    category: '営業基盤',
    priority: '中',
    assignee: TEAM.sales,
    deadline: '2026-02-21',
    status: '未着手'
  }
];

async function initializeTasks() {
  await db.initDB();
  
  console.log('🚀 初期タスク生成開始...\n');
  
  let count = 0;
  for (const task of INITIAL_TASKS) {
    const result = db.run(
      'INSERT INTO tasks (title, category, priority, status, deadline, assignee, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [task.title, task.category, task.priority, task.status, task.deadline, task.assignee, 'init-script']
    );
    count++;
    console.log(`✅ [${result.lastInsertRowid}] ${task.title}`);
  }
  
  console.log(`\n✅ ${count}件のタスクを生成しました`);
  
  // 統計表示
  console.log('\n📊 担当者別タスク数:');
  Object.entries(TEAM).forEach(([role, member]) => {
    const tasks = INITIAL_TASKS.filter(t => t.assignee === member);
    console.log(`  ${member} (${role}): ${tasks.length}件`);
  });
  
  console.log('\n📊 カテゴリ別タスク数:');
  const categories = {};
  INITIAL_TASKS.forEach(t => {
    categories[t.category] = (categories[t.category] || 0) + 1;
  });
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}件`);
  });
  
  console.log('\n🌐 Web UIでタスクを確認: http://localhost:3030');
}

initializeTasks().catch(console.error);
