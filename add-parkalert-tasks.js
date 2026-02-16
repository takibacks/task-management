#!/usr/bin/env node

const db = require('./db');

const PARKALERT_TASKS = [
  // === Week 1: セットアップ・基盤構築 ===
  {
    title: 'ParkAlert: LINE公式アカウント作成・Messaging API設定',
    category: 'ParkAlert',
    sub_category: 'システム',
    priority: '高',
    assignee: 'takemasa',
    deadline: '2026-02-18',
    status: '未着手'
  },
  {
    title: 'ParkAlert: Supabase プロジェクト作成 + PostGIS有効化',
    category: 'ParkAlert',
    sub_category: 'システム',
    priority: '高',
    assignee: 'takemasa',
    deadline: '2026-02-18',
    status: '未着手'
  },
  {
    title: 'ParkAlert: Google Maps API キー取得',
    category: 'ParkAlert',
    sub_category: 'システム',
    priority: '高',
    assignee: 'takemasa',
    deadline: '2026-02-18',
    status: '未着手'
  },
  {
    title: 'ParkAlert: GitHubリポジトリ作成・初期構造',
    category: 'ParkAlert',
    sub_category: 'システム',
    priority: '高',
    assignee: 'takemasa',
    deadline: '2026-02-17',
    status: '未着手'
  },
  {
    title: 'ParkAlert: データベーステーブル設計・作成（5テーブル）',
    category: 'ParkAlert',
    sub_category: 'システム',
    priority: '高',
    assignee: 'takemasa',
    deadline: '2026-02-19',
    status: '未着手'
  },
  {
    title: 'ParkAlert: LINE Webhook エンドポイント実装',
    category: 'ParkAlert',
    sub_category: 'システム',
    priority: '高',
    assignee: 'りゅうさん',
    deadline: '2026-02-20',
    status: '未着手'
  },
  {
    title: 'ParkAlert: LIFF アプリ作成（住所登録UI）',
    category: 'ParkAlert',
    sub_category: 'コンテンツ制作',
    priority: '中',
    assignee: 'マッチョ',
    deadline: '2026-02-22',
    status: '未着手'
  },
  {
    title: 'ParkAlert: リッチメニューデザイン',
    category: 'ParkAlert',
    sub_category: 'コンテンツ制作',
    priority: '中',
    assignee: 'マッチョ',
    deadline: '2026-02-21',
    status: '未着手'
  },
  
  // === Week 2: コア機能実装 ===
  {
    title: 'ParkAlert: akippa スクレイパー実装（一覧ページ）',
    category: 'ParkAlert',
    sub_category: 'システム',
    priority: '高',
    assignee: 'りゅうさん',
    deadline: '2026-02-25',
    status: '未着手'
  },
  {
    title: 'ParkAlert: akippa 詳細ページから車サイズ情報取得',
    category: 'ParkAlert',
    sub_category: 'システム',
    priority: '高',
    assignee: 'りゅうさん',
    deadline: '2026-02-26',
    status: '未着手'
  },
  {
    title: 'ParkAlert: エラーハンドリング・リトライ機構',
    category: 'ParkAlert',
    sub_category: 'システム',
    priority: '中',
    assignee: 'りゅうさん',
    deadline: '2026-02-27',
    status: '未着手'
  },
  {
    title: 'ParkAlert: 距離計算実装（Haversine公式）',
    category: 'ParkAlert',
    sub_category: 'システム',
    priority: '高',
    assignee: 'りゅうさん',
    deadline: '2026-02-26',
    status: '未着手'
  },
  {
    title: 'ParkAlert: 車両サイズマッチング実装',
    category: 'ParkAlert',
    sub_category: 'システム',
    priority: '高',
    assignee: 'りゅうさん',
    deadline: '2026-02-27',
    status: '未着手'
  },
  {
    title: 'ParkAlert: 差分検知（前回スキャン結果比較）',
    category: 'ParkAlert',
    sub_category: 'システム',
    priority: '高',
    assignee: 'りゅうさん',
    deadline: '2026-02-28',
    status: '未着手'
  },
  {
    title: 'ParkAlert: LINE テキスト通知実装',
    category: 'ParkAlert',
    sub_category: 'システム',
    priority: '高',
    assignee: 'takemasa',
    deadline: '2026-02-28',
    status: '未着手'
  },
  {
    title: 'ParkAlert: LIFF 車両サイズ登録画面実装',
    category: 'ParkAlert',
    sub_category: 'コンテンツ制作',
    priority: '中',
    assignee: 'マッチョ',
    deadline: '2026-03-01',
    status: '未着手'
  },
  
  // === Week 3: MVP完成・テスト ===
  {
    title: 'ParkAlert: スケジューラ設定（9時・15時実行）',
    category: 'ParkAlert',
    sub_category: 'システム',
    priority: '高',
    assignee: 'りゅうさん',
    deadline: '2026-03-04',
    status: '未着手'
  },
  {
    title: 'ParkAlert: 全ユーザースキャンバッチ処理',
    category: 'ParkAlert',
    sub_category: 'システム',
    priority: '高',
    assignee: 'りゅうさん',
    deadline: '2026-03-05',
    status: '未着手'
  },
  {
    title: 'ParkAlert: LINEリッチメニュー実装',
    category: 'ParkAlert',
    sub_category: 'コンテンツ制作',
    priority: '中',
    assignee: 'マッチョ',
    deadline: '2026-03-05',
    status: '未着手'
  },
  {
    title: 'ParkAlert: 通知ON/OFF切り替え機能',
    category: 'ParkAlert',
    sub_category: 'システム',
    priority: '中',
    assignee: 'takemasa',
    deadline: '2026-03-06',
    status: '未着手'
  },
  {
    title: 'ParkAlert: ローカルテスト（モックデータ）',
    category: 'ParkAlert',
    sub_category: 'システム',
    priority: '高',
    assignee: 'takemasa',
    deadline: '2026-03-06',
    status: '未着手'
  },
  {
    title: 'ParkAlert: 実環境テスト（akippa実データ）',
    category: 'ParkAlert',
    sub_category: 'システム',
    priority: '高',
    assignee: 'takemasa',
    deadline: '2026-03-07',
    status: '未着手'
  },
  {
    title: 'ParkAlert: 本番デプロイ（Railway/Render）',
    category: 'ParkAlert',
    sub_category: 'システム',
    priority: '高',
    assignee: 'takemasa',
    deadline: '2026-03-08',
    status: '未着手'
  },
  {
    title: 'ParkAlert: モニタリング・ログ設定',
    category: 'ParkAlert',
    sub_category: 'システム',
    priority: '低',
    assignee: 'takemasa',
    deadline: '2026-03-09',
    status: '未着手'
  }
];

async function addParkAlertTasks() {
  await db.initDB();
  
  console.log('🚗 ParkAlert タスク追加開始...\n');
  
  let count = 0;
  for (const task of PARKALERT_TASKS) {
    const result = db.run(
      'INSERT INTO tasks (title, category, sub_category, priority, status, deadline, assignee, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [task.title, task.category, task.sub_category, task.priority, task.status, task.deadline, task.assignee, 'parkalert-init']
    );
    count++;
    console.log(`✅ [${result.lastInsertRowid}] ${task.title}`);
  }
  
  console.log(`\n✅ ${count}件のParkAlertタスクを追加しました`);
  
  // 統計表示
  console.log('\n📊 担当者別タスク数:');
  const byAssignee = {};
  PARKALERT_TASKS.forEach(t => {
    byAssignee[t.assignee] = (byAssignee[t.assignee] || 0) + 1;
  });
  Object.entries(byAssignee).forEach(([assignee, count]) => {
    console.log(`  ${assignee}: ${count}件`);
  });
  
  console.log('\n📊 Week別タスク数:');
  const week1 = PARKALERT_TASKS.filter(t => t.deadline <= '2026-02-23').length;
  const week2 = PARKALERT_TASKS.filter(t => t.deadline > '2026-02-23' && t.deadline <= '2026-03-02').length;
  const week3 = PARKALERT_TASKS.filter(t => t.deadline > '2026-03-02').length;
  console.log(`  Week 1 (2/17-2/23): ${week1}件`);
  console.log(`  Week 2 (2/24-3/2): ${week2}件`);
  console.log(`  Week 3 (3/3-3/9): ${week3}件`);
  
  console.log('\n🌐 タスク管理UIで確認: https://task-management-production-c5b5.up.railway.app');
}

addParkAlertTasks().catch(console.error);
