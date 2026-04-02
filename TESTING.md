# テストの実行方法

## テストの種類

### Railsのテスト（ユーザー向けAPI）

Minitestで書いています。モデルとコントローラーのテストがあります。

```bash
# 全部実行
docker compose exec rails-api bundle exec rails test

# ファイルを指定して実行
docker compose exec rails-api bundle exec rails test test/models/product_test.rb
```

テストファイル：
- `test/models/user_test.rb`
- `test/models/product_test.rb`
- `test/models/category_test.rb`
- `test/models/order_test.rb`
- `test/models/cart_item_test.rb`
- `test/controllers/api/v1/auth_controller_test.rb`
- `test/controllers/api/v1/products_controller_test.rb`
- `test/controllers/api/v1/carts_controller_test.rb`
- `test/controllers/api/v1/orders_controller_test.rb`

### Laravelのテスト（管理者向けAPI）

PHPUnitで書いています。

```bash
# 全部実行
docker compose exec laravel-api php artisan test

# フィルタして実行
docker compose exec laravel-api php artisan test --filter=ProductControllerTest
```

テストファイル：
- `tests/Feature/AuthControllerTest.php`
- `tests/Feature/ProductControllerTest.php`
- `tests/Feature/InventoryLogControllerTest.php`
- `tests/Unit/ProductManagementServiceTest.php`
- `tests/Unit/ReportGenerationServiceTest.php`

### フロントエンドのテスト（React）

Jest + React Testing Libraryで書いています。

```bash
# 全部実行
docker compose exec frontend npm test

# 特定のファイルを実行
docker compose exec frontend npm test LoginPage.test.tsx
```

テストファイル：
- `src/pages/__tests__/LoginPage.test.tsx`
- `src/pages/__tests__/RegisterPage.test.tsx`
- `src/pages/__tests__/ProductsPage.test.tsx`
- `src/components/__tests__/Header.test.tsx`
- `src/contexts/__tests__/CartContext.test.tsx`

### E2Eテスト（Cypress）

ブラウザ操作を自動化するテストです。APIはモックしているのでバックエンドなしで動きます。

```bash
# フロントエンドを起動してから（別ターミナルで）
cd frontend
npm run dev

# Cypressを起動
npm run test:e2e

# ヘッドレス（画面なしで実行）
npm run test:e2e:headless
```

テストファイル：
- `cypress/e2e/home.cy.ts` - トップページ
- `cypress/e2e/login.cy.ts` - ログイン
- `cypress/e2e/register.cy.ts` - 新規登録
- `cypress/e2e/products.cy.ts` - 商品一覧・検索
- `cypress/e2e/cart.cy.ts` - カート操作

## まとめて実行

```bash
make test
```

これで Rails → Laravel → フロントエンドの順に全部実行します。

## テストがうまくいかないとき

Railsのテストが失敗する場合：

```bash
docker compose exec rails-api bundle exec rails db:test:prepare
```

Laravelのテストが失敗する場合：

```bash
docker compose exec laravel-api php artisan config:clear
docker compose exec laravel-api php artisan cache:clear
```

フロントエンドのテストが失敗する場合：

```bash
docker compose exec frontend npm test -- --clearCache
```
