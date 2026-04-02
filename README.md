# ECサイト課題

ReactとRails、LaravelとMySQLを使って作ったECサイトです。
ユーザー向けのショッピング機能と、管理者向けの商品・在庫管理機能を実装しました。

## 使った技術

| 役割 | 技術 |
|------|------|
| フロントエンド | React 18 + TypeScript + Vite |
| ユーザーAPI | Ruby on Rails 7.1 |
| 管理者API | Laravel 11 |
| DB | MySQL 8.0 |
| キャッシュ | Redis 7 |
| 環境構築 | Docker / docker-compose |

## 構成

フロントエンドからのリクエストはViteのプロキシ経由でそれぞれのAPIに飛びます。
RailsとLaravelはDBを共有しています。

```
React (:5173)
  │
  ├─→ Rails API (:3001)    ← ユーザー側（商品閲覧、カート、注文）
  │
  └─→ Laravel API (:8000)  ← 管理者側（商品管理、在庫管理）
         ↓
      MySQL + Redis（共有）
```

## 起動方法

Dockerが必要です。初回は `make setup` で全部セットアップできます。

```bash
# 初回セットアップ（ビルド＋DB作成＋データ投入）
make setup

# 2回目以降の起動
make start

# 止めるとき
make stop
```

他のコマンドは `make help` で確認できます。

## アクセス先

| 画面 | URL |
|------|-----|
| ユーザー画面 | http://localhost:5173 |
| 管理者画面 | http://localhost:5173/admin |

## テストアカウント

**ユーザー**
- Email: `test@example.com`
- Password: `password123`

**管理者**
- Email: `admin@example.com`
- Password: `admin123`

## 実装した機能

**ユーザー側**
- 商品一覧・検索・カテゴリ絞り込み
- カートに追加・数量変更・削除
- 注文・注文履歴確認
- ユーザー登録・ログイン

**管理者側**
- 商品の追加・編集・削除・販売停止
- 在庫調整・在庫ログ確認
- ダッシュボード（在庫統計）
- 管理者ごとの在庫CSVを毎朝9時に自動生成

## ドキュメント

- [docs/ER_Diagram.md](docs/ER_Diagram.md) - ER図
- [docs/Requirements_Definition.md](docs/Requirements_Definition.md) - 要件定義書
- [docs/System_Design.md](docs/System_Design.md) - 設計書
- [docs/Component_Diagram.md](docs/Component_Diagram.md) - コンポーネント図
- [TESTING.md](TESTING.md) - テストの実行方法
