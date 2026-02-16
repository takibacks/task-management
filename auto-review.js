#!/usr/bin/env node

/**
 * 3日サイクル自動レビュー
 * - 進捗分析
 * - 次の3日間タスク生成
 * - Slack報告
 */

const db = require('./db');
const { execSync } = require('child_process');

// 設定
const REVIEW_CYCLE_DAYS = 3;
const TEAM_MEMBERS = ['takemasa', 'りゅうさん', 'マッチョ'];
const BUSINESSES = [
  { id: 1, name: 'アフィリエイト', priority: 1, revenue_target: 1000000 },
  { id: 2, name: 'TikTok広告運用代行', priority: 2, revenue_target: 1500000 },
  { id: 3, name: 'デジタルコンテンツ販売', priority: 3, revenue_target: 800000 },
  { id: 4, name: 'ノウハウレター', priority: 4, revenue_target: 500000 },
  { id: 5, name: '日本の情報・生活暮らし', priority: 5, revenue_target: 300000 },
  { id: 6, name: '経営日記', priority: 6, revenue_target: 200000 },
  { id: 7, name: 'スキル獲得コンテンツ', priority: 7, revenue_target: 600000 },
  { id: 8, name: '物販', priority: 8, revenue_target: 1000000 },
  { id: 9, name: '不動産情報', priority: 9, revenue_target: 400000 },
  { id: 10, name: 'AIツール販売', priority: 10, revenue_target: 2000000 }
];

async function analyzeProgress() {
  await db.initDB();
  
  const today = new Date();
  const threeDaysAgo = new Date(today.getTime() - REVIEW_CYCLE_DAYS * 24 * 60 * 60 * 1000);
  const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];
  
  // 全タスク取得
  const allTasks = db.all('SELECT * FROM tasks');
  const recentCompleted = db.all(
    'SELECT * FROM tasks WHERE status = ? AND updated_at >= ?',
    ['完了', threeDaysAgoStr]
  );
  const openTasks = db.all('SELECT * FROM tasks WHERE status != ?', ['完了']);
  const overdueHigh = db.all(
    'SELECT * FROM tasks WHERE status != ? AND priority = ? AND deadline < ?',
    ['完了', '高', today.toISOString().split('T')[0]]
  );
  
  // 担当者別集計
  const byAssignee = {};
  TEAM_MEMBERS.forEach(member => {
    const completed = recentCompleted.filter(t => t.assignee === member).length;
    const open = openTasks.filter(t => t.assignee === member).length;
    byAssignee[member] = { completed, open };
  });
  
  // カテゴリ別集計
  const byCategory = {};
  BUSINESSES.forEach(biz => {
    const completed = recentCompleted.filter(t => t.category === biz.name).length;
    const open = openTasks.filter(t => t.category === biz.name).length;
    byCategory[biz.name] = { completed, open, priority: biz.priority };
  });
  
  return {
    total: allTasks.length,
    completed: recentCompleted.length,
    open: openTasks.length,
    overdue: overdueHigh.length,
    byAssignee,
    byCategory
  };
}

function generateNextTasks(analysis) {
  // 優先度の高い事業から次の3日間タスクを提案
  const suggestions = [];
  
  BUSINESSES.slice(0, 3).forEach(biz => {
    const stats = analysis.byCategory[biz.name] || { completed: 0, open: 0 };
    
    if (stats.open === 0) {
      suggestions.push({
        business: biz.name,
        tasks: [
          `${biz.name}: 市場調査・競合分析`,
          `${biz.name}: 初期セットアップ`,
          `${biz.name}: 最初のアクション実行`
        ]
      });
    } else if (stats.open < 3) {
      suggestions.push({
        business: biz.name,
        tasks: [`${biz.name}: 進捗に応じた追加タスク必要`]
      });
    }
  });
  
  return suggestions;
}

async function postToSlack(message) {
  // Slack投稿（実装は環境に応じて調整）
  console.log('=== Slack投稿内容 ===');
  console.log(message);
  console.log('=====================');
  
  // TODO: 実際のSlack投稿実装
  // execSync(`openclaw message send --channel slack --target general --message "${message.replace(/"/g, '\\"')}"`);
}

async function runReview() {
  console.log('🔍 3日サイクルレビュー開始...\n');
  
  const analysis = await analyzeProgress();
  const nextTasks = generateNextTasks(analysis);
  
  // レポート生成
  let report = `📊 *3日間進捗レポート*\n\n`;
  report += `✅ 完了タスク: ${analysis.completed}件\n`;
  report += `📋 未完了タスク: ${analysis.open}件\n`;
  report += `⚠️ 期限切れ（高優先度）: ${analysis.overdue}件\n\n`;
  
  report += `*担当者別*\n`;
  Object.entries(analysis.byAssignee).forEach(([member, stats]) => {
    report += `  ${member}: 完了${stats.completed} / 残${stats.open}\n`;
  });
  
  report += `\n*事業別トップ3*\n`;
  BUSINESSES.slice(0, 3).forEach(biz => {
    const stats = analysis.byCategory[biz.name] || { completed: 0, open: 0 };
    report += `  ${biz.name}: 完了${stats.completed} / 残${stats.open}\n`;
  });
  
  if (analysis.overdue > 0) {
    report += `\n⚠️ *アクション必要*\n`;
    report += `期限切れの高優先度タスクがあります。レビューしてください。\n`;
  }
  
  report += `\n🎯 *次の3日間の推奨タスク*\n`;
  nextTasks.forEach(sug => {
    report += `\n*${sug.business}*\n`;
    sug.tasks.forEach(task => report += `  • ${task}\n`);
  });
  
  report += `\n---\n次回レビュー: ${new Date(Date.now() + REVIEW_CYCLE_DAYS * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`;
  
  await postToSlack(report);
  
  // ローカルログ保存
  const logPath = `/Users/bixel.inc/.openclaw/workspace/output/reviews/${new Date().toISOString().split('T')[0]}-review.md`;
  require('fs').mkdirSync(require('path').dirname(logPath), { recursive: true });
  require('fs').writeFileSync(logPath, report);
  
  console.log(`\n✅ レビュー完了。ログ: ${logPath}`);
}

// 実行
runReview().catch(console.error);
