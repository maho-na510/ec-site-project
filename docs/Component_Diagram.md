# コンポーネント図

## システム全体の構成

```
┌──────────────────────────────────────────────────┐
│                   ブラウザ                          │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │         React アプリ (:5173)                │  │
│  │  ┌──────────────┐  ┌──────────────────┐   │  │
│  │  │  ユーザー画面  │  │   管理者画面      │   │  │
│  │  └──────┬───────┘  └────────┬─────────┘   │  │
│  │         │ /api/v1/*          │ /api/admin/* │  │
│  └─────────┼────────────────────┼─────────────┘  │
└────────────┼────────────────────┼────────────────┘
             │ Viteプロキシ経由     │
             ↓                    ↓
   ┌──────────────────┐  ┌──────────────────┐
   │   Rails API      │  │  Laravel API     │
   │    (:3001)       │  │    (:8000)       │
   │  ユーザー向け     │  │  管理者向け      │
   └────────┬─────────┘  └────────┬─────────┘
            │                     │
            └──────────┬──────────┘
                       ↓
            ┌──────────────────────┐
            │   MySQL (:3306)      │
            │   共有データベース    │
            └──────────────────────┘

            ┌──────────────────────┐
            │   Redis (:6379)      │
            │   セッション管理      │
            └──────────────────────┘
```

---

## Reactのコンポーネント構成

### ユーザー側のページ

```
App.tsx
  └─ MainLayout（ヘッダー・フッターを持つ）
       ├─ HomePage（トップページ）
       ├─ ProductsPage（商品一覧・カテゴリ絞り込み・検索）
       │    └─ ProductCard × n（商品カード）
       ├─ ProductDetailPage（商品詳細・カートに追加）
       ├─ LoginPage（ログイン）
       ├─ RegisterPage（会員登録）
       ├─ ForgotPasswordPage（パスワードリセット申請）
       ├─ ResetPasswordPage（パスワード再設定）
       ├─ CartPage（カート一覧・数量変更・削除）
       ├─ CheckoutPage（注文確認・決済）
       ├─ ProfilePage（マイページ・注文履歴）
       ├─ WishlistPage（お気に入り一覧）
       └─ 404ページ
```

### 管理者側のページ

```
App.tsx
  └─ AdminLayout（サイドバーナビゲーション）
       ├─ AdminLoginPage（管理者ログイン）※LayoutなしのPublicページ
       ├─ AdminDashboard（ダッシュボード・在庫統計サマリー）
       ├─ AdminProductsPage（商品一覧・販売停止・削除）
       ├─ AdminProductFormPage（商品登録・編集・画像アップロード）
       ├─ AdminInventoryPage（在庫調整・履歴確認）
       ├─ AdminAccountsPage（管理者アカウント一覧・作成）
       └─ AdminReportsPage（CSVレポート一覧・ダウンロード）
```

### 共通コンポーネント（src/components/shared/）

| コンポーネント | 役割 |
|---|---|
| Button | ボタン。variantでスタイルを変えられる |
| Input | テキスト入力欄。ラベル・エラー表示つき |
| Modal | モーダルダイアログ |
| LoadingSpinner | 読み込み中の挙動 |
| Pagination | ページネーション |
| Table | テーブル表示 |
| Alert | アラートメッセージ |

---

## Rails APIのコンポーネント構成

```
config/routes.rb
  └─ namespace :api → namespace :v1
       ├─ AuthController
       │    └─ POST /login, POST /logout, POST /register
       ├─ ProductsController
       │    └─ GET /products, GET /products/:id
       ├─ CartsController
       │    └─ GET /cart, POST /cart/items, PATCH /cart/items/:id, DELETE
       ├─ OrdersController
       │    └─ GET /orders, POST /orders, POST /orders/:id/cancel
       └─ UsersController
            └─ GET /users/me, PATCH /users/me

app/services/
  ├─ OrderProcessingService  （注文処理・在庫デクリメント・ロック）
  ├─ CartService             （カートの追加・変更・バリデーション）
  ├─ AuthenticationService   （JWTトークン生成・検証）
  └─ PaymentService          （決済処理・今回はモック）
```

---

## Laravel APIのコンポーネント構成

```
routes/api.php
  └─ prefix: api/v1/admin → middleware: auth:api
       ├─ AuthController
       │    └─ POST /auth/login, POST /auth/logout, GET /auth/me
       ├─ ProductController
       │    └─ CRUD + PATCH /products/:id/toggle-suspension
       ├─ InventoryController
       │    └─ POST /inventory/:id/adjust, GET /inventory/logs
       └─ ReportController
            └─ POST /reports/inventory, GET /reports/download

app/Services/
  ├─ ProductManagementService  （商品CRUD・画像アップロード）
  ├─ InventoryService          （在庫調整・ログ記録）
  ├─ ReportGenerationService   （CSV生成・管理者ごとの出力）
  ├─ AdminAuthService          （JWT認証）
  └─ ImageUploadService        （画像ファイルの保存）

app/Console/
  └─ Commands/
       ├─ GenerateInventoryReport  （毎日9時に実行）
       ├─ GenerateWeeklySummary
       └─ CleanupReports
```

---

## 状態管理（フロントエンド）

```
AuthContext
  └─ ログイン状態・ユーザー情報・isAdmin フラグを管理
       → ログイン・ログアウトの処理もここ

CartContext
  └─ カートの中身・合計金額を管理
       → 商品追加・削除もここ

TanStack Query（サーバーのデータ）
  └─ 商品一覧・注文履歴など、APIから取得するデータのキャッシュ
       → 5分間キャッシュされる
```

---

## データの流れ（注文処理の例）

```
1. ユーザーが「注文する」ボタンを押す
          ↓
2. React: POST /api/v1/orders にリクエスト
          ↓
3. Viteプロキシ: Rails API に転送
          ↓
4. Rails: OrdersController#create が受け取る
          ↓
5. Rails: OrderProcessingService を呼ぶ
    ├─ DBトランザクション開始
    ├─ 商品をSELECT FOR UPDATEでロック
    ├─ 在庫確認
    ├─ Order・OrderItemを作成
    ├─ 在庫をデクリメント（SQL UPDATE）
    ├─ Paymentレコードを作成
    └─ カートをチェックアウト済みにする
          ↓
6. Rails: 注文情報をJSONで返す
          ↓
7. React: 注文完了ページを表示
```
