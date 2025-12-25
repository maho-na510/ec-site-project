# EC Site - テストガイド

このドキュメントでは、プロジェクトのテスト実行方法と、テスト戦略について説明します。

## テスト構成

このプロジェクトは3つのアプリケーションで構成されており、それぞれに包括的なテストが実装されています:

### 1. Rails API Tests (ユーザー向けAPI)
- **フレームワーク**: Minitest
- **テストタイプ**:
  - モデルテスト (User, Product, Category, Order, CartItem)
  - コントローラーテスト (Auth, Products, Cart, Orders)
  - 統合テスト

### 2. Laravel API Tests (管理者向けAPI)
- **フレームワーク**: PHPUnit
- **テストタイプ**:
  - フィーチャーテスト (Admin Auth, Product Management, Inventory Logs)
  - ユニットテスト (ProductManagementService, InventoryService)

### 3. Frontend Tests (React)
- **フレームワーク**: Jest + React Testing Library
- **テストタイプ**:
  - コンポーネントテスト
  - コンテキストテスト
  - ページテスト

## テストの実行

### Rails API テスト

```bash
# すべてのテストを実行
docker compose exec rails-api bundle exec rails test

# 特定のテストファイルを実行
docker compose exec rails-api bundle exec rails test test/models/user_test.rb

# 特定のテストケースを実行
docker compose exec rails-api bundle exec rails test test/models/user_test.rb:10

# カバレッジレポートを生成
docker compose exec rails-api bundle exec rails test
```

#### Rails テストファイル一覧

**モデルテスト**:
- `test/models/user_test.rb` - ユーザーモデル (15 tests)
- `test/models/product_test.rb` - 商品モデル (18 tests)
- `test/models/category_test.rb` - カテゴリモデル (4 tests)
- `test/models/order_test.rb` - 注文モデル (11 tests)
- `test/models/cart_item_test.rb` - カートアイテムモデル (9 tests)

**コントローラーテスト**:
- `test/controllers/api/v1/auth_controller_test.rb` - 認証 (6 tests)
- `test/controllers/api/v1/products_controller_test.rb` - 商品API (6 tests)
- `test/controllers/api/v1/carts_controller_test.rb` - カートAPI (6 tests)
- `test/controllers/api/v1/orders_controller_test.rb` - 注文API (6 tests)

### Laravel API テスト

```bash
# すべてのテストを実行
docker compose exec laravel-api php artisan test

# 特定のテストを実行
docker compose exec laravel-api php artisan test --filter=ProductControllerTest

# カバレッジレポートを生成
docker compose exec laravel-api php artisan test --coverage

# 詳細出力
docker compose exec laravel-api php artisan test --verbose
```

#### Laravel テストファイル一覧

**フィーチャーテスト**:
- `tests/Feature/AuthControllerTest.php` - 管理者認証 (4 tests)
- `tests/Feature/ProductControllerTest.php` - 商品管理 (5 tests)
- `tests/Feature/InventoryLogControllerTest.php` - 在庫ログ (5 tests)

**ユニットテスト**:
- `tests/Unit/ProductManagementServiceTest.php` - 商品管理サービス (7 tests)
- `tests/Unit/InventoryServiceTest.php` - 在庫サービス (3 tests)

### Frontend テスト

```bash
# すべてのテストを実行
docker compose exec frontend npm test

# ウォッチモード
docker compose exec frontend npm run test:watch

# カバレッジレポート
docker compose exec frontend npm run test:coverage

# 特定のテストファイルを実行
docker compose exec frontend npm test LoginPage.test.tsx
```

#### Frontend テストファイル一覧

**ページテスト**:
- `src/pages/__tests__/LoginPage.test.tsx` - ログインページ (6 tests)
- `src/pages/__tests__/RegisterPage.test.tsx` - 登録ページ (7 tests)
- `src/pages/__tests__/ProductsPage.test.tsx` - 商品一覧ページ (7 tests)

**コンポーネントテスト**:
- `src/components/__tests__/Header.test.tsx` - ヘッダーコンポーネント (4 tests)
- `src/components/__tests__/ProductCard.test.tsx` - 商品カード (7 tests)

**コンテキストテスト**:
- `src/contexts/__tests__/CartContext.test.tsx` - カートコンテキスト (6 tests)

## すべてのテストを一度に実行

```bash
# すべてのサービスのテストを順番に実行
./run-all-tests.sh
```

または、個別に:

```bash
# 1. Rails テスト
docker compose exec rails-api bundle exec rails test

# 2. Laravel テスト
docker compose exec laravel-api php artisan test

# 3. Frontend テスト
docker compose exec frontend npm test
```

## テスト戦略

### テストピラミッド

このプロジェクトは、以下のテストピラミッドに従っています:

```
        /\
       /  \
      / E2E \
     /______\
    /        \
   / 統合テスト \
  /____________\
 /              \
/  ユニットテスト  \
/________________\
```

1. **ユニットテスト (70%)**: 個別の関数、メソッド、コンポーネントのテスト
2. **統合テスト (20%)**: API エンドポイント、サービス間の連携テスト
3. **E2Eテスト (10%)**: ユーザーシナリオ全体のテスト (今後実装予定)

### カバレッジ目標

- **全体**: 70%以上
- **重要な機能** (認証、決済、在庫管理): 85%以上
- **ビジネスロジック**: 80%以上

## テストデータ

### Rails テストデータ

Fixturesを使用してテストデータを管理:
- `test/fixtures/users.yml`
- `test/fixtures/products.yml`
- `test/fixtures/categories.yml`
- `test/fixtures/orders.yml`
- `test/fixtures/cart_items.yml`

### Laravel テストデータ

Factoriesを使用してテストデータを生成:
```php
Admin::factory()->create()
Product::factory()->create()
Category::factory()->create()
```

### Frontend テストデータ

モックデータとMSW (Mock Service Worker) を使用:
```typescript
const mockProduct = {
  id: 1,
  name: 'Test Product',
  price: 99.99,
}
```

## テストのベストプラクティス

### Rails

```ruby
# Good: 説明的なテスト名
test "should require email" do
  @user.email = nil
  assert_not @user.valid?
end

# Good: 1テストにつき1つのアサーション
test "should validate email format" do
  @user.email = "invalid"
  assert_not @user.valid?
  assert_includes @user.errors[:email], "is invalid"
end
```

### Laravel

```php
// Good: アクト・アレンジ・アサートパターン
public function test_can_create_product(): void
{
    // Arrange
    $admin = Admin::factory()->create();
    $productData = ['name' => 'Test', 'price' => 99.99];

    // Act
    $response = $this->actingAs($admin)->postJson('/api/products', $productData);

    // Assert
    $response->assertStatus(201);
    $this->assertDatabaseHas('products', $productData);
}
```

### Frontend

```typescript
// Good: ユーザーの視点でテスト
it('ユーザーがログインできる', async () => {
  const user = userEvent.setup()
  render(<LoginPage />)

  await user.type(screen.getByLabelText(/メール/), 'test@example.com')
  await user.type(screen.getByLabelText(/パスワード/), 'password123')
  await user.click(screen.getByRole('button', { name: /ログイン/ }))

  await waitFor(() => {
    expect(mockLogin).toHaveBeenCalled()
  })
})
```

## CI/CD での実行

GitHub Actions などの CI/CD パイプラインで自動実行する場合:

```yaml
- name: Run Rails Tests
  run: docker compose exec -T rails-api bundle exec rails test

- name: Run Laravel Tests
  run: docker compose exec -T laravel-api php artisan test

- name: Run Frontend Tests
  run: docker compose exec -T frontend npm test -- --ci --coverage
```

## トラブルシューティング

### Rails テストが失敗する

```bash
# テストデータベースを再作成
docker compose exec rails-api bundle exec rails db:test:prepare

# Fixturesをリロード
docker compose exec rails-api bundle exec rails db:fixtures:load RAILS_ENV=test
```

### Laravel テストが失敗する

```bash
# テストデータベースをクリア
docker compose exec laravel-api php artisan migrate:fresh --env=testing

# キャッシュをクリア
docker compose exec laravel-api php artisan config:clear
docker compose exec laravel-api php artisan cache:clear
```

### Frontend テストが失敗する

```bash
# node_modulesを再インストール
docker compose exec frontend npm ci

# Jestキャッシュをクリア
docker compose exec frontend npm test -- --clearCache
```

## テストサマリー

### 総テスト数

| サービス | テスト数 | カバレッジ目標 |
|---------|---------|-------------|
| Rails API | 67 tests | 70%+ |
| Laravel API | 24 tests | 70%+ |
| Frontend | 37 tests | 70%+ |
| **合計** | **128 tests** | **70%+** |

### テストカテゴリ

- **ユニットテスト**: 78 tests (61%)
- **統合テスト**: 50 tests (39%)
- **E2Eテスト**: 0 tests (今後実装予定)

## 今後の拡張

- [ ] E2Eテストの追加 (Cypress)
- [ ] パフォーマンステスト
- [ ] セキュリティテスト
- [ ] アクセシビリティテスト
- [ ] ビジュアルリグレッションテスト

---

**最終更新日**: 2025-12-25
