# 起動手順

## 必要なもの

- Docker Desktop（起動しておく）
- Git

## セットアップ手順

### 1. リポジトリをクローン

```bash
git clone https://github.com/maho-na510/ec-site-project.git
cd ec-site-project
```

### 2. 環境変数ファイルを作成

```bash
cp .env.example .env
cp rails-api/.env.example rails-api/.env
cp laravel-api/.env.example laravel-api/.env
cp frontend/.env.example frontend/.env
```

### 3. セットアップを実行（初回のみ）

```bash
make setup
```

ビルド・DB作成・マイグレーション・シードデータ投入まで全部やってくれます。
5〜10分くらいかかります。

### 4. 起動

```bash
make start
```

### 5. ブラウザで確認

- ユーザー画面: http://localhost:5173
- 管理者画面: http://localhost:5173/admin

## テストアカウント

**ユーザー**
| email | password |
|-------|----------|
| test@example.com | password123 |
| user@example.com | password123 |

**管理者**
| email | password |
|-------|----------|
| admin@example.com | admin123 |

## よく使うコマンド

```bash
make start        # 起動
make stop         # 停止
make logs         # ログ確認
make db-reset     # DBをリセット（データも入れ直す）
make test         # テスト全部実行
make help         # コマンド一覧
```

## うまく起動しない場合

商品が表示されない → `make db-reset` でDBをリセット

ポートが使われているエラー → `make stop` してから `make start`

それでもダメなら `docker compose down -v` で完全にリセットしてから `make setup` をやり直す
