# Slack Task Bot - シンプルタスク管理

チーム向けSlackタスク管理Bot（SQLite使用）

## 機能

- ✅ タスク追加・完了・一覧表示
- 👥 担当者割り当て
- 🔴🟡🟢 優先度管理（高/中/低）
- 📅 締切管理
- ⏰ 毎朝8時に今日のタスク自動通知

## セットアップ（10分）

### 1. Slackアプリ作成

1. **Slack API サイト** にアクセス:
   https://api.slack.com/apps

2. **Create New App** → **From scratch**
   - App Name: `Task Bot`
   - Workspace: 使用するワークスペースを選択

3. **OAuth & Permissions** に移動（左メニュー）
   - Scopes → **Bot Token Scopes** に以下を追加:
     - `chat:write`
     - `commands`
     - `users:read`

4. **Install App** (左メニュー)
   - 「Install to Workspace」をクリック
   - 許可画面で「許可する」
   - **Bot User OAuth Token** をコピー (`xoxb-`で始まる)

5. **Basic Information** に移動（左メニュー）
   - **Signing Secret** をコピー

### 2. Slash Commands 作成

**Slash Commands** (左メニュー) → **Create New Command** で以下を5つ作成:

| Command | Request URL | Short Description |
|---------|-------------|-------------------|
| `/task-add` | `http://your-server:3000/slack/events` | タスク追加 |
| `/task-list` | `http://your-server:3000/slack/events` | タスク一覧 |
| `/task-done` | `http://your-server:3000/slack/events` | タスク完了 |
| `/task-assign` | `http://your-server:3000/slack/events` | 担当者割り当て |
| `/task-today` | `http://your-server:3000/slack/events` | 今日のタスク |

**注意**: `your-server` は実際のサーバーIP/ドメインに変更
（ローカル開発の場合は ngrok などのトンネリングツールが必要）

### 3. 環境変数設定

```bash
cd /Users/bixel.inc/.openclaw/workspace/slack-task-bot
cp .env.example .env
nano .env
```

`.env` ファイルに以下を記入:
```
SLACK_BOT_TOKEN=xoxb-your-actual-token
SLACK_SIGNING_SECRET=your-actual-secret
SLACK_CHANNEL=#task-management
```

### 4. 依存関係インストール

```bash
npm install
```

### 5. 起動

```bash
npm start
```

## 使い方

### タスク追加
```
/task-add 市場調査レポート作成 @高 2026-02-20
/task-add 営業リスト50社収集
```

### タスク一覧
```
/task-list 未着手
/task-list 完了
```

### タスク完了
```
/task-done 3
```

### 担当者割り当て
```
/task-assign 5 @takemasa
```

### 今日のタスク
```
/task-today
```

## 自動通知

毎朝8:00（Asia/Tokyo）に自動で今日のタスクを通知します。
通知先は `.env` の `SLACK_CHANNEL` で設定。

## データベース

- **場所**: `slack-task-bot/tasks.db`
- **形式**: SQLite
- **スキーマ**: id, title, category, priority, status, deadline, assignee, created_by, created_at, updated_at

## トラブルシューティング

### コマンドが反応しない
- Request URL が正しく設定されているか確認
- Bot が起動しているか確認 (`npm start`)
- サーバーが外部からアクセス可能か確認

### 権限エラー
- Bot Token Scopes に `chat:write` と `commands` が追加されているか確認
- ワークスペースに再インストール

## ポリとの連携

以下のコマンドでポリがタスクを読み取れます:

```bash
sqlite3 /Users/bixel.inc/.openclaw/workspace/slack-task-bot/tasks.db "SELECT * FROM tasks WHERE status='未着手'"
```

HEARTBEAT.md から自動実行する場合:
```javascript
const Database = require('better-sqlite3');
const db = new Database('/Users/bixel.inc/.openclaw/workspace/slack-task-bot/tasks.db');
const tasks = db.prepare('SELECT * FROM tasks WHERE status=?').all('未着手');
```
