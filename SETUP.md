# EC Site - セットアップガイド

このドキュメントでは、EC Siteプロジェクトのセットアップ方法を説明します。

## 前提条件

以下のソフトウェアがインストールされている必要があります:

- **Docker Desktop** 24.0以降
- **Docker Compose** 2.20以降
- **Git**

## クイックスタート

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd ec-site-project
```

### 2. 環境変数の設定

プロジェクトには3つのサービスがあり、それぞれに環境変数が必要です:

```bash
# ルートディレクトリの環境変数をコピー
cp .env.example .env

# Rails API の環境変数をコピー
cp rails-api/.env.example rails-api/.env

# Laravel API の環境変数をコピー
cp laravel-api/.env.example laravel-api/.env

# Frontend の環境変数をコピー
cp frontend/.env.example frontend/.env
```

### 3. Dockerコンテナの起動

```bash
# すべてのサービスを起動
docker compose up -d

# ログを確認
docker compose logs -f
```

### 4. データベースのセットアップ

```bash
# Rails のデータベースを作成・マイグレーション・シード
docker compose exec rails-api bundle exec rails db:create
docker compose exec rails-api bundle exec rails db:migrate
docker compose exec rails-api bundle exec rails db:seed

# Laravel のシードを実行（テーブルはRailsで作成済み）
docker compose exec laravel-api php artisan db:seed
```

### 5. アプリケーションへのアクセス

ブラウザで以下のURLにアクセス:

- **フロントエンド**: http://localhost:5173
- **Rails API**: http://localhost:3001/api/v1
- **Laravel Admin API**: http://localhost:8000/api/v1/admin

## テストアカウント

### ユーザーアカウント（一般ユーザー）

- **Email**: test@example.com
- **Password**: password123

### 管理者アカウント

**メイン管理者**:
- **Email**: admin@example.com
- **Password**: admin123

**マネージャー**:
- **Email**: manager@example.com
- **Password**: manager123

## よくある問題と解決方法

### ポートが既に使用されている

```bash
# 使用中のポートを確認
lsof -i :3001  # Rails
lsof -i :8000  # Laravel
lsof -i :5173  # Frontend
```

### データベース接続エラー

```bash
# MySQLコンテナの状態を確認
docker compose ps

# MySQLを再起動
docker compose restart mysql
```

### TypeScriptがReactの型を見つけられない

```bash
# コンテナからnode_modulesをローカルにコピー
docker compose cp frontend:/app/node_modules ./frontend/
```

## 開発用コマンド

```bash
# すべてのサービスを起動
docker compose up -d

# すべてのサービスを停止
docker compose down

# ログを表示
docker compose logs -f

# Railsコンソールを開く
docker compose exec rails-api bundle exec rails console

# Laravel artisanを実行
docker compose exec laravel-api php artisan
```

詳細なAPI仕様は [README.md](README.md) を参照してください。

---

**最終更新日**: 2025-12-25
