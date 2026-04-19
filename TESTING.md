# テスト方針と実行方法

## テストの分類（Small / Medium / Big）

要件にあった[テストサイズの考え方](https://www.issoh.co.jp/column/details/2360/)に沿って、
3種類のテストを実装しています。

| 種別 | 内容 | このプロジェクトでの対応 |
|---|---|---|
| **Small** | 外部依存なし。単体で完結するロジックのテスト | Railsモデルテスト、Laravelサービスクラスのユニットテスト、JestコンポーネントテストのMSWモック |
| **Medium** | DBやAPIなど外部リソースを使うが、ブラウザは使わない | Railsコントローラーテスト、LaravelのFeatureテスト（テスト用DBを使用）|
| **Big** | ブラウザを使ったE2Eテスト | CypressによるE2Eテスト |

---

## 各テストの詳細

### Rails（ユーザー向けAPI） — minitest

```bash
# 全部実行
docker compose exec rails-api bundle exec rails test

# ファイルを指定して実行
docker compose exec rails-api bundle exec rails test test/models/product_test.rb
```

#### Small（モデル・サービス）

外部依存なし。モデルのバリデーション・スコープ・ビジネスロジックを検証します。

- `test/models/user_test.rb` — バリデーション・パスワードハッシュ化
- `test/models/product_test.rb` — スコープ（active/visible）・ソフトデリート
- `test/models/category_test.rb` — バリデーション・一意制約
- `test/models/order_test.rb` — ステータス管理・金額計算
- `test/models/cart_item_test.rb` — 数量バリデーション・一意制約
- `test/services/authentication_service_test.rb` — JWTトークン生成・検証

#### Medium（コントローラー）

テスト用DBを使い、APIの入出力・認証・エラーレスポンスを検証します。

- `test/controllers/api/v1/auth_controller_test.rb` — ログイン・ログアウト・認証エラー
- `test/controllers/api/v1/products_controller_test.rb` — 商品一覧・詳細・検索・カテゴリ絞り込み
- `test/controllers/api/v1/carts_controller_test.rb` — カート追加・変更・削除
- `test/controllers/api/v1/orders_controller_test.rb` — 注文作成・在庫デクリメント・悲観的ロック

---

### Laravel（管理者向けAPI） — PHPUnit

```bash
# 全部実行
docker compose exec laravel-api php artisan test

# フィルタして実行
docker compose exec laravel-api php artisan test --filter=ProductControllerTest
```

#### Small（サービスクラス）

テスト用DBを使いますが、HTTPリクエストなし。ビジネスロジックを直接検証します。

- `tests/Unit/ProductManagementServiceTest.php` — 商品CRUD・在庫ログ記録・ソフトデリート
- `tests/Unit/ReportGenerationServiceTest.php` — CSV生成・管理者ごとの出力・古いファイルの削除
- `tests/Unit/InventoryServiceTest.php` — 在庫調整・在庫統計の集計

#### Medium（コントローラー / Featureテスト）

HTTPリクエストを通したAPIの統合テストです。テスト用DBを使います。

- `tests/Feature/AuthControllerTest.php` — ログイン・HttpOnly Cookie発行・ログアウト・管理者情報取得
- `tests/Feature/ProductControllerTest.php` — 商品CRUD・画像アップロード・販売停止
- `tests/Feature/InventoryLogControllerTest.php` — 在庫調整・履歴取得
- `tests/Feature/AdminControllerTest.php` — 管理者アカウント一覧・作成

---

### フロントエンド（React） — Jest + React Testing Library

```bash
# 全部実行
docker compose exec frontend npm test -- --watchAll=false

# 特定のファイルを実行
docker compose exec frontend npm test -- --watchAll=false --testPathPattern=LoginPage
```

#### Small（コンポーネント・コンテキスト）

APIはMSW（Mock Service Worker）でモックします。
コンポーネントの表示・操作・バリデーションを検証します。

- `src/components/__tests__/Header.test.tsx` — ログイン状態によるヘッダー表示切り替え
- `src/components/__tests__/ProductCard.test.tsx` — 在庫切れ・販売停止の表示
- `src/contexts/__tests__/CartContext.test.tsx` — カート追加・削除・合計金額計算
- `src/pages/__tests__/LoginPage.test.tsx` — フォーム入力・バリデーション・送信
- `src/pages/__tests__/RegisterPage.test.tsx` — 会員登録フォーム・バリデーション
- `src/pages/__tests__/ProductsPage.test.tsx` — 商品一覧表示・フィルター操作
- `src/pages/__tests__/ForgotPasswordPage.test.tsx` — パスワードリセット申請フォーム
- `src/pages/__tests__/ResetPasswordPage.test.tsx` — パスワード再設定フォーム
- `src/pages/admin/__tests__/AdminAccountsPage.test.tsx` — 管理者アカウント一覧・作成

---

### E2E（Big） — Cypress

ブラウザを起動して、実際のユーザー操作を自動化するテストです。
APIはCypressのインターセプトでモックしているため、バックエンドなしで実行できます。

```bash
# フロントエンドを起動した状態で実行
cd frontend
npm run test:e2e

# ヘッドレス（CIなどで画面なし）
npm run test:e2e:headless
```

テストファイル：

- `cypress/e2e/home.cy.ts` — トップページの表示・商品カードの確認
- `cypress/e2e/login.cy.ts` — ログイン成功・失敗・バリデーション
- `cypress/e2e/register.cy.ts` — 会員登録フロー全体
- `cypress/e2e/products.cy.ts` — 商品一覧・カテゴリ絞り込み・検索
- `cypress/e2e/cart.cy.ts` — カートへの追加・数量変更・削除

---

## まとめて実行

```bash
# Rails + Laravel + Frontend（Jest）を順番に実行
make test

# E2Eテストは別コマンド（フロントエンドの起動が必要）
make test-e2e

# カバレッジレポートを生成
make coverage
```

---

## テストカバレッジの考え方

「データを設定するだけの処理など明らかに自明なもの以外はカバレッジを確保する」
という要件に沿って、以下の方針でテストを書いています。

- **ビジネスロジック**（在庫計算・注文処理・認証）は必ずテストを書く
- **バリデーション**（必須チェック・文字数制限・型）はSmallテストでカバー
- **エラーケース**（認証エラー・在庫切れ・存在しないリソース）はMediumテストでカバー
- **シーダーやマイグレーション**などデータを流し込むだけの処理はテスト対象外

---

## テストがうまくいかないとき

**Railsのテストが失敗する場合**：
```bash
docker compose exec rails-api bundle exec rails db:test:prepare
```

**Laravelのテストが失敗する場合**：
```bash
docker compose exec laravel-api php artisan config:clear
docker compose exec laravel-api php artisan cache:clear
```

**フロントエンドのテストが失敗する場合**：
```bash
docker compose exec frontend npm test -- --clearCache
```
