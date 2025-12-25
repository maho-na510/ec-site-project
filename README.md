# EC Site - E-Commerce Platform

日本語のフルスタックECサイト - React、Rails、Laravel、MySQL、Redisで構築された、ユーザーと管理者用の別々のインターフェースを持つEコマースプラットフォーム

## Project Overview

This project is a modern e-commerce platform with the following key features:

**ユーザー機能** (User Features):
- ユーザー登録と認証
- 商品の閲覧、フィルタリング、検索
- カート管理
- チェックアウトと注文
- 注文履歴の確認

**管理者機能** (Admin Features):
- 管理者認証
- 商品管理（CRUD操作）
- 在庫管理と監査ログ
- 在庫調整履歴の確認
- 在庫の少ない商品の表示

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript + Vite | Single-page application with Japanese UI |
| **User Backend** | Ruby on Rails 7.1 | RESTful API for user-facing features |
| **Admin Backend** | Laravel 11 | RESTful API for administrative features |
| **Database** | MySQL 8.0 | Shared persistent data storage |
| **Cache/Session** | Redis 7 | Session management and caching |
| **Containerization** | Docker & docker-compose | Development and deployment environment |
| **Styling** | Tailwind CSS + Lucide Icons | Utility-first CSS framework |
| **State Management** | React Context + TanStack Query | Client state and server cache management |

## Architecture

This application follows a **microservices-oriented architecture** with clear separation between user and admin services:

```
React SPA (Frontend :5173)
    ↓ Vite Proxy
    ↓ /api/v1/*                    ↓ /api/v1/admin/*
Rails API (:3001)              Laravel API (:8000)
    ↓                              ↓
    MySQL Database (shared)   +   Redis Cache
```

**Key architectural decisions**:
- Separate backends for security isolation and independent scaling
- **Shared MySQL database** between Rails and Laravel for data consistency
- Redis for session storage and caching
- Service layer pattern for maintainable business logic
- JWT token-based authentication
- Direct Japanese text in UI components (no i18n library)

## Project Structure

```
ec-site-project/
├── frontend/                       # React application
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Page components (Japanese UI)
│   │   ├── contexts/              # React Context (Auth, Cart)
│   │   ├── services/              # API service layer
│   │   └── layouts/               # Layout components
│   ├── .env.example               # Environment template
│   └── package.json
├── rails-api/                      # Rails backend (user API)
│   ├── app/
│   │   ├── controllers/api/v1/    # API controllers
│   │   ├── models/                # ActiveRecord models
│   │   ├── services/              # Business logic layer
│   │   └── errors/                # Custom error classes
│   ├── config/
│   ├── db/
│   │   ├── migrate/               # Database migrations
│   │   └── seeds.rb               # Seed data
│   ├── .env.example               # Environment template
│   └── Gemfile
├── laravel-api/                    # Laravel backend (admin API)
│   ├── app/
│   │   ├── Http/Controllers/API/V1/Admin/  # Admin controllers
│   │   ├── Models/                # Eloquent models
│   │   └── Services/              # Business logic layer
│   ├── database/
│   │   ├── migrations/            # Database migrations
│   │   └── seeders/               # Seed data
│   ├── .env.example               # Environment template
│   └── composer.json
├── docker-compose.yml              # Multi-container orchestration
├── .env.example                    # Root environment template
└── README.md                       # This file
```

## Getting Started

### Prerequisites

- Docker 24+ and docker-compose 2.20+
- Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd ec-site-project
   ```

2. **Set up environment variables**:
   ```bash
   # Copy environment templates
   cp .env.example .env
   cp rails-api/.env.example rails-api/.env
   cp laravel-api/.env.example laravel-api/.env
   cp frontend/.env.example frontend/.env

   # Update the values in each .env file as needed
   ```

3. **Start Docker containers**:
   ```bash
   docker compose up -d
   ```

4. **Set up databases**:
   ```bash
   # Rails database setup
   docker compose exec rails-api bundle exec rails db:create db:migrate db:seed

   # Laravel database setup (migrations already created by Rails)
   docker compose exec laravel-api php artisan db:seed
   ```

5. **Access the application**:
   - Frontend: http://localhost:5173
   - Rails API: http://localhost:3001/api/v1
   - Laravel API: http://localhost:8000/api/v1/admin

### Default Credentials

**Test User Account** (Rails API):
- Email: `test@example.com`
- Password: `password123`

**Admin Accounts** (Laravel API):
- Main Admin:
  - Email: `admin@example.com`
  - Password: `admin123`
- Manager:
  - Email: `manager@example.com`
  - Password: `manager123`

## Environment Variables

Copy `.env.example` files to `.env` in each service directory and update as needed:

### Rails API ([rails-api/.env.example](rails-api/.env.example))

```bash
# Database (Shared with Laravel)
DB_HOST=mysql
DB_PORT=3306
DB_NAME=ec_site_development
DB_USERNAME=ec_user
DB_PASSWORD=ec_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-characters

# CORS
FRONTEND_URL=http://localhost:5173
```

### Laravel API ([laravel-api/.env.example](laravel-api/.env.example))

```bash
# Application
APP_NAME="EC Site Admin API"
APP_KEY=base64:your-app-key-will-be-generated
APP_ENV=local
APP_DEBUG=true

# Database (Shared with Rails)
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=ec_site_development
DB_USERNAME=ec_user
DB_PASSWORD=ec_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=1

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-characters
JWT_TTL=60

# CORS
FRONTEND_URL=http://localhost:5173
```

### Frontend ([frontend/.env.example](frontend/.env.example))

```bash
# API URLs
VITE_USER_API_URL=http://localhost:3001/api/v1
VITE_ADMIN_API_URL=http://localhost:8000/api/v1/admin
```

See the `.env.example` files for complete configuration options.

## API Documentation

### User API (Rails)

Base URL: `http://localhost:3001/api/v1`

#### Authentication

**Register User**
```
POST /auth/register
Body: { name, email, password, password_confirmation, address }
Response: { success, message, data: { token, user } }
```

**Login**
```
POST /auth/login
Body: { email, password }
Response: { success, message, data: { token, user } }
```

**Logout**
```
POST /auth/logout
Headers: { Authorization: "Bearer <token>" }
Response: { success, message }
```

#### Products

**List Products**
```
GET /products
Query: page, per_page, category_id, search, sort_by, sort_order
Response: { success, data: [products], meta: { pagination } }
```

**Product Details**
```
GET /products/:id
Response: { success, data: { product with images and category } }
```

#### Categories

**List Categories**
```
GET /categories
Response: { success, data: [categories] }
```

#### Cart (requires authentication)

**Get Cart**
```
GET /cart
Headers: { Authorization: "Bearer <token>" }
Response: { success, data: { cart_items } }
```

**Add to Cart**
```
POST /cart/items
Headers: { Authorization: "Bearer <token>" }
Body: { product_id, quantity }
Response: { success, message, data: { cart_item } }
```

**Update Cart Item**
```
PATCH /cart/items/:id
Headers: { Authorization: "Bearer <token>" }
Body: { quantity }
Response: { success, message, data: { cart_item } }
```

**Remove from Cart**
```
DELETE /cart/items/:id
Headers: { Authorization: "Bearer <token>" }
Response: { success, message }
```

#### Orders (requires authentication)

**Create Order**
```
POST /orders
Headers: { Authorization: "Bearer <token>" }
Body: { cart_items: [{ product_id, quantity, price }], total_amount, shipping_address }
Response: { success, message, data: { order } }
```

**List Orders**
```
GET /orders
Headers: { Authorization: "Bearer <token>" }
Response: { success, data: [orders] }
```

**Order Details**
```
GET /orders/:id
Headers: { Authorization: "Bearer <token>" }
Response: { success, data: { order with items } }
```

### Admin API (Laravel)

Base URL: `http://localhost:8000/api/v1/admin`

All endpoints require admin authentication via JWT token in the Authorization header.

#### Authentication

**Admin Login**
```
POST /auth/login
Body: { email, password }
Response: { success, message, data: { token, admin } }
```

**Admin Logout**
```
POST /auth/logout
Headers: { Authorization: "Bearer <token>" }
Response: { success, message }
```

#### Products (all require admin auth)

**List Products**
```
GET /products
Headers: { Authorization: "Bearer <token>" }
Query: category_id, is_active, is_suspended, search, stock_status, sort_by, per_page
Response: { success, data: [products], meta: { pagination } }
```

**Product Details**
```
GET /products/:id
Headers: { Authorization: "Bearer <token>" }
Response: { success, data: { product with category, images, inventory logs } }
```

**Create Product**
```
POST /products
Headers: { Authorization: "Bearer <token>" }
Body: { category_id, name, description, price, initial_stock, is_active, images[] }
Response: { success, message, data: { product } }
```

**Update Product**
```
PUT /products/:id
Headers: { Authorization: "Bearer <token>" }
Body: { category_id?, name?, description?, price?, stock_quantity?, is_active?, is_suspended?, adjustment_note?, images[]? }
Response: { success, message, data: { product } }
```

**Delete Product**
```
DELETE /products/:id
Headers: { Authorization: "Bearer <token>" }
Response: { success, message }
```

**Toggle Product Suspension**
```
POST /products/:id/toggle-suspension
Headers: { Authorization: "Bearer <token>" }
Response: { success, message, data: { product } }
```

**Get Low Stock Products**
```
GET /products/low-stock
Headers: { Authorization: "Bearer <token>" }
Query: threshold (default: 10)
Response: { success, data: [products] }
```

#### Inventory Logs (all require admin auth)

**List Inventory Logs**
```
GET /inventory-logs
Headers: { Authorization: "Bearer <token>" }
Query: product_id, admin_id, action_type, date_from, date_to, per_page
Response: { success, data: [logs], meta: { pagination } }
```

## Database Schema

### Shared Tables (used by both Rails and Laravel)

**users** - Customer accounts
- id, name, email, password_digest, address, timestamps

**categories** - Product categories
- id, name, timestamps

**products** - Product catalog
- id, category_id, name, description, price, stock_quantity, is_active, is_suspended, created_by (admin_id), timestamps

**product_images** - Product photos
- id, product_id, image_url, is_primary, timestamps

**orders** - Customer orders
- id, user_id, order_number, total_amount, status, shipping_address, timestamps

**order_items** - Order line items
- id, order_id, product_id, quantity, unit_price, timestamps

**cart_items** - Shopping cart items
- id, user_id, product_id, quantity, timestamps

### Laravel-specific Tables

**admins** - Admin user accounts
- id, name, email, password, timestamps

**inventory_logs** - Inventory change audit trail
- id, product_id, admin_id, action_type, quantity_change, quantity_before, quantity_after, notes, timestamps

## Docker Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f rails-api
docker compose logs -f laravel-api
docker compose logs -f frontend

# Restart a service
docker compose restart rails-api

# Access Rails console
docker compose exec rails-api bundle exec rails console

# Access Laravel artisan
docker compose exec laravel-api php artisan

# Run migrations
docker compose exec rails-api bundle exec rails db:migrate
docker compose exec laravel-api php artisan migrate

# Seed database
docker compose exec rails-api bundle exec rails db:seed
docker compose exec laravel-api php artisan db:seed

# Reset database
docker compose exec rails-api bundle exec rails db:reset

# Copy node_modules from container (for IDE support)
docker compose cp frontend:/app/node_modules ./frontend/
```

## Development Workflow

### Adding a New Feature

1. Create feature branch
2. Implement changes in respective service (frontend/rails-api/laravel-api)
3. Test manually via the UI and API endpoints
4. Commit and push changes

### Database Changes

**Rails migrations** (for shared tables):
```bash
docker compose exec rails-api bundle exec rails generate migration MigrationName
docker compose exec rails-api bundle exec rails db:migrate
```

**Laravel migrations** (for admin-specific tables):
```bash
docker compose exec laravel-api php artisan make:migration migration_name
docker compose exec laravel-api php artisan migrate
```

**Important**: Since Rails and Laravel share the same database, coordinate migrations carefully. Use Rails for shared tables, Laravel only for admin-specific tables.

## Frontend Pages

All pages use direct Japanese text:

1. **ホームページ** (HomePage) - Landing page with featured products
2. **商品一覧** (ProductsPage) - Browse all products with filtering
3. **商品詳細** (ProductDetailPage) - Product details with add to cart
4. **ログイン** (LoginPage) - User login
5. **会員登録** (RegisterPage) - User registration
6. **カート** (CartPage) - Shopping cart management
7. **注文確認** (CheckoutPage) - Checkout and order placement
8. **マイページ** (ProfilePage) - User profile and order history

## Security Features

- **JWT Authentication**: Separate tokens for users and admins
- **Password Hashing**: bcrypt for Rails, bcrypt for Laravel
- **CORS**: Restricted to frontend origin
- **Input Validation**: Strong parameters and request validation
- **SQL Injection Prevention**: ORM with parameterized queries
- **XSS Prevention**: React auto-escaping
- **Protected Routes**: Authentication required for sensitive pages
- **Transaction Locking**: Prevents overselling during concurrent checkouts

## Troubleshooting

### Common Issues

**Port already in use**:
```bash
# Check what's using the port
lsof -i :3001  # Rails
lsof -i :8000  # Laravel
lsof -i :5173  # Frontend

# Kill the process or change ports in docker-compose.yml
```

**Database connection error**:
```bash
# Ensure MySQL container is healthy
docker compose ps

# Restart MySQL
docker compose restart mysql

# Recreate database
docker compose exec rails-api bundle exec rails db:drop db:create db:migrate db:seed
```

**Redis connection error**:
```bash
# Restart Redis container
docker compose restart redis

# Check Redis connectivity
docker compose exec redis redis-cli ping
```

**Frontend can't reach API**:
- Check [vite.config.ts](frontend/vite.config.ts) proxy settings
- Ensure APIs are running: `docker compose ps`
- Check browser console for CORS errors
- Verify .env file has correct API URLs

**TypeScript can't find React types**:
```bash
# Copy node_modules from container to local
docker compose cp frontend:/app/node_modules ./frontend/
```

**Laravel migration conflicts**:
- Laravel and Rails share the same database
- Rails handles shared table migrations
- If you get "table already exists", mark as migrated:
  ```bash
  docker compose exec mysql mysql -u ec_user -pec_password ec_site_development
  # Then insert into schema_migrations
  ```

## Current Status

✅ **Completed**:
- React frontend with Japanese UI
- Rails API (user endpoints)
- Laravel API (admin endpoints)
- Docker containerization
- Database setup and migrations
- Authentication (JWT)
- Product browsing and management
- Cart functionality
- Order creation
- Inventory management
- Environment configuration

⏳ **Pending**:
- Comprehensive test suite
- Production deployment configuration
- Payment integration
- Email notifications
- CSV report generation

## License

This project is developed as an educational project.

---

**Last Updated**: 2025-12-25

## Testing

包括的なテストスイートが実装されています。詳細は [TESTING.md](TESTING.md) を参照してください。

### テスト実行

**すべてのテストを実行**:
```bash
./run-all-tests.sh
```

**個別にテストを実行**:

```bash
# Rails API テスト
docker compose exec rails-api bundle exec rails test

# Laravel API テスト
docker compose exec laravel-api php artisan test

# Frontend テスト
docker compose exec frontend npm test
```

### テストカバレッジ

テストは以下をカバーしています:

**Rails API**:
- ✅ モデルテスト (User, Product, Category, Order, CartItem)
- ✅ コントローラーテスト (Auth, Products, Cart, Orders)
- ✅ バリデーションテスト
- ✅ 統合テスト

**Laravel API**:
- ✅ フィーチャーテスト (Admin Auth, Product Management, Inventory Logs)
- ✅ ユニットテスト (ProductManagementService)
- ✅ 認証テスト
- ✅ API統合テスト

**Frontend**:
- ✅ ページコンポーネントテスト (LoginPage, RegisterPage, ProductsPage)
- ✅ 共通コンポーネントテスト (Header, ProductCard)
- ✅ コンテキストテスト (CartContext)
- ✅ ユーザーインタラクションテスト

### テストファイル

**Rails** (25 tests):
- `/rails-api/test/models/` - モデルテスト
- `/rails-api/test/controllers/api/v1/` - コントローラーテスト

**Laravel** (20+ tests):
- `/laravel-api/tests/Feature/` - フィーチャーテスト
- `/laravel-api/tests/Unit/` - ユニットテスト

**Frontend** (30+ tests):
- `/frontend/src/pages/__tests__/` - ページテスト
- `/frontend/src/components/__tests__/` - コンポーネントテスト
- `/frontend/src/contexts/__tests__/` - コンテキストテスト


## ドキュメント

詳細な設計ドキュメントは [docs](docs/) ディレクトリにあります:

- **[docs/README.md](docs/README.md)** - ドキュメント概要とクイックリファレンス
- **[docs/ER_Diagram_ja.md](docs/ER_Diagram_ja.md)** - データベース設計（日本語）
- **[docs/ER_Diagram.md](docs/ER_Diagram.md)** - Entity-Relationship Diagram (English)
- **[docs/Requirements_Definition.md](docs/Requirements_Definition.md)** - 要件定義 (English)
- **[docs/System_Design.md](docs/System_Design.md)** - システム設計 (English)
- **[docs/Component_Diagram.md](docs/Component_Diagram.md)** - コンポーネント図 (English)

### クイックリファレンス

**アーキテクチャ図**:
```
React Frontend (:5173)
    │
    ├─→ Rails API (:3001)     [ユーザー向け: 商品閲覧、カート、注文]
    │   └─→ MySQL + Redis
    │
    └─→ Laravel API (:8000)   [管理者向け: 商品管理、在庫管理]
        └─→ MySQL + Redis (共有データベース)
```

**主要エンティティ**:
- `users` - ユーザーアカウント（顧客）
- `admins` - 管理者アカウント
- `products` - 商品カタログ（Rails & Laravel 共有）
- `categories` - 商品カテゴリ（共有）
- `orders` - 注文データ
- `cart_items` - ショッピングカート
- `inventory_logs` - 在庫変更履歴（監査ログ）

