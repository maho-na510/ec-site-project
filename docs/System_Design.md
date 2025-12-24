# System Design Document - EC Site Application

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Architecture Selection Rationale](#2-architecture-selection-rationale)
3. [Design Principles](#3-design-principles)
4. [Component Design](#4-component-design)
5. [Data Flow](#5-data-flow)
6. [Security Architecture](#6-security-architecture)
7. [Performance Optimization](#7-performance-optimization)
8. [Testing Strategy](#8-testing-strategy)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Design Innovations](#10-design-innovations)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

This application follows a **Microservices-oriented Architecture** with clear separation of concerns between user-facing and admin functionalities.

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           React SPA (Single Page Application)        │   │
│  │   - User Interface     - Admin Interface             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS / REST API
                            │
        ┌───────────────────┴──────────────────┐
        │                                       │
┌───────▼────────┐                    ┌────────▼────────┐
│  Rails Backend │                    │ Laravel Backend │
│  (User API)    │                    │   (Admin API)   │
│  Port: 3000    │                    │   Port: 8000    │
└───────┬────────┘                    └────────┬────────┘
        │                                       │
        │                                       │
        └───────────────────┬───────────────────┘
                            │
        ┌───────────────────┴──────────────────┐
        │                                       │
┌───────▼────────┐                    ┌────────▼────────┐
│     MySQL      │                    │      Redis      │
│   Database     │                    │  Session Store  │
│   Port: 3306   │                    │   Port: 6379    │
└────────────────┘                    └─────────────────┘
```

### 1.2 Technology Stack Mapping

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18+ | User interface for both user and admin portals |
| **User Backend** | Ruby on Rails 7+ | API server for customer-facing features |
| **Admin Backend** | Laravel 10+ | API server for administrative features |
| **Database** | MySQL 8.0+ | Persistent data storage |
| **Cache/Session** | Redis 7+ | Session management and caching |
| **Containerization** | Docker & docker-compose | Development and deployment environment |
| **Web Server** | Nginx (production) | Reverse proxy and static file serving |

---

## 2. Architecture Selection Rationale

### 2.1 Why Microservices-Oriented Architecture?

**Decision**: Separate Rails (user) and Laravel (admin) backends rather than a monolithic application.

**Rationale**:

1. **Separation of Concerns**
   - User and admin features have different access patterns, security requirements, and scaling needs
   - Admin operations are less frequent but more complex
   - User operations are high-frequency and read-heavy

2. **Technology Flexibility**
   - Leverage Rails' convention-over-configuration for rapid user feature development
   - Utilize Laravel's elegant syntax and robust ecosystem for admin panel
   - Demonstrates proficiency in multiple frameworks as required

3. **Security Isolation**
   - Admin and user authentication are completely separate
   - Compromising user service doesn't expose admin capabilities
   - Different security policies can be applied to each service

4. **Independent Scaling**
   - User service can scale horizontally during high traffic (shopping seasons)
   - Admin service requires minimal resources under normal operation
   - Different caching strategies for each service

5. **Development Velocity**
   - Teams can work independently on user and admin features
   - Deployments can be independent (lower risk)
   - Technology-specific optimizations (Rails query optimization vs Laravel Eloquent)

**Alternatives Considered**:

| Architecture | Pros | Cons | Why Not Selected |
|-------------|------|------|------------------|
| **Monolithic** | Simpler deployment, shared code | Tight coupling, harder to scale | Doesn't demonstrate microservices understanding |
| **Full Microservices** | Maximum flexibility | Over-engineered for MVP, complex deployment | Too complex for project scope |
| **Serverless** | Auto-scaling, low ops | Vendor lock-in, cold starts | Not compatible with Rails/Laravel requirement |

### 2.2 Why React SPA?

**Decision**: Single Page Application (SPA) with separate user and admin views.

**Rationale**:

1. **Modern User Experience**
   - No page reloads, smooth transitions
   - Responsive, app-like feel
   - Better perceived performance

2. **Code Reusability**
   - Share components between user and admin interfaces
   - Consistent UI/UX patterns
   - DRY principle

3. **API-First Design**
   - Clean separation between frontend and backend
   - Easier to add mobile apps later
   - Better testability

**Alternatives Considered**:

| Approach | Pros | Cons | Why Not Selected |
|----------|------|------|------------------|
| **Server-Side Rendering (SSR)** | Better SEO, faster initial load | More complex, server overhead | E-commerce needs SPA interactivity |
| **Separate React Apps** | Complete isolation | Code duplication, larger bundle | Shared components reduce development time |
| **Traditional MVC Views** | Simpler, framework-native | Poor UX, full page reloads | Doesn't meet modern UX standards |

### 2.3 Why MySQL?

**Decision**: MySQL 8.0 as the primary database.

**Rationale**:

1. **ACID Compliance**: Critical for e-commerce transactions and inventory management
2. **Mature Ecosystem**: Well-documented, excellent ORM support (ActiveRecord, Eloquent)
3. **Transaction Support**: Essential for concurrent purchase scenarios
4. **JSON Support**: MySQL 8.0 supports JSON columns for flexible data structures
5. **Performance**: Optimized for read-heavy workloads with proper indexing

**Note**: PostgreSQL was also considered and would be equally suitable. MySQL chosen per standard practice for Rails/Laravel applications.

### 2.4 Why Redis for Sessions?

**Decision**: Store sessions in Redis, not files.

**Rationale**:

1. **Performance**: In-memory storage, sub-millisecond latency
2. **Scalability**: Supports horizontal scaling of application servers
3. **Expiration**: Built-in TTL for automatic session cleanup
4. **Atomic Operations**: Race-condition-free session updates
5. **Shared State**: Multiple app instances can share session data

**File-based sessions**: Not suitable for production scaling, no shared state across instances.

---

## 3. Design Principles

### 3.1 SOLID Principles Application

#### 3.1.1 Single Responsibility Principle (SRP)

**Application**:
- **Controllers**: Handle HTTP requests/responses only, delegate business logic to services
- **Models**: Database interactions and simple validations only
- **Services**: Encapsulate business logic (e.g., `OrderProcessingService`, `InventoryService`)
- **Repositories**: Data access abstraction (optional layer for complex queries)

**Example**:
```ruby
# BAD: Controller doing too much
class OrdersController
  def create
    # Validation, inventory check, payment, email - all in controller
  end
end

# GOOD: Single responsibility
class OrdersController
  def create
    result = OrderProcessingService.new(current_user, params).execute
    render json: result
  end
end

class OrderProcessingService
  def execute
    validate_cart
    check_inventory
    process_payment
    create_order
    send_confirmation_email
  end
end
```

#### 3.1.2 Open/Closed Principle

**Application**:
- Payment methods are extensible without modifying core payment logic
- New product types can be added without changing existing code
- Strategy pattern for pricing calculations (future discounts, taxes)

**Example**:
```ruby
# Payment strategy interface
class PaymentProcessor
  def process(order)
    raise NotImplementedError
  end
end

class CreditCardProcessor < PaymentProcessor
  def process(order)
    # Credit card logic
  end
end

class PayPalProcessor < PaymentProcessor
  def process(order)
    # PayPal logic
  end
end

# New payment methods added without modifying existing code
```

#### 3.1.3 Liskov Substitution Principle

**Application**:
- All payment processors can be used interchangeably
- Different product types (if extended) follow same interface
- Test doubles and mocks maintain same contracts

#### 3.1.4 Interface Segregation Principle

**Application**:
- Separate interfaces for different admin capabilities (product manager, inventory manager)
- Clients only depend on methods they use
- Granular service classes rather than "god objects"

#### 3.1.5 Dependency Inversion Principle

**Application**:
- High-level modules depend on abstractions, not concrete implementations
- Dependency injection for services, payment processors, email senders
- Easier testing with mock dependencies

**Example**:
```ruby
# BAD: Direct dependency
class OrderService
  def send_email
    EmailSender.new.send(...)  # Hard dependency
  end
end

# GOOD: Dependency injection
class OrderService
  def initialize(email_sender: EmailSender.new)
    @email_sender = email_sender
  end

  def send_email
    @email_sender.send(...)  # Can inject mock for testing
  end
end
```

### 3.2 Additional Design Principles

#### 3.2.1 DRY (Don't Repeat Yourself)

- Shared validation logic in models
- Reusable React components
- Helper functions for common operations
- Database triggers for audit logging

#### 3.2.2 KISS (Keep It Simple, Stupid)

- Avoid premature optimization
- Clear, readable code over clever solutions
- Minimal abstractions necessary for current requirements

#### 3.2.3 YAGNI (You Aren't Gonna Need It)

- Implement features as specified, not anticipated future needs
- Architecture supports extension, but doesn't pre-build unused features

#### 3.2.4 Convention Over Configuration

- Follow Rails and Laravel conventions
- Standard REST API design
- Consistent naming patterns

---

## 4. Component Design

### 4.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          React Frontend                              │
│  ┌────────────────────────────┐  ┌─────────────────────────────┐   │
│  │    User Interface          │  │    Admin Interface          │   │
│  │  ┌──────────────────────┐  │  │  ┌───────────────────────┐  │   │
│  │  │ Components:          │  │  │  │ Components:           │  │   │
│  │  │ - ProductList        │  │  │  │ - ProductManager      │  │   │
│  │  │ - ProductDetail      │  │  │  │ - InventoryManager    │  │   │
│  │  │ - Cart               │  │  │  │ - Dashboard           │  │   │
│  │  │ - Checkout           │  │  │  │ - AdminAuth           │  │   │
│  │  │ - UserAuth           │  │  │  │                       │  │   │
│  │  └──────────────────────┘  │  │  └───────────────────────┘  │   │
│  │  ┌──────────────────────┐  │  │  ┌───────────────────────┐  │   │
│  │  │ State Management:    │  │  │  │ State Management:     │  │   │
│  │  │ - React Context API  │  │  │  │ - React Context API   │  │   │
│  │  │ - Custom Hooks       │  │  │  │ - Custom Hooks        │  │   │
│  │  └──────────────────────┘  │  │  └───────────────────────┘  │   │
│  └────────────────────────────┘  └─────────────────────────────┘   │
│                          │                      │                    │
│                     ┌────┴──────────────────────┴─────┐              │
│                     │      API Client Layer            │              │
│                     │  - Axios HTTP client             │              │
│                     │  - Request interceptors          │              │
│                     │  - Token management              │              │
│                     └────┬──────────────────────┬─────┘              │
└──────────────────────────┼──────────────────────┼────────────────────┘
                           │                      │
                   ┌───────▼───────┐      ┌───────▼───────┐
                   │  Rails API    │      │  Laravel API  │
                   │  (User)       │      │  (Admin)      │
                   └───────┬───────┘      └───────┬───────┘
                           │                      │
        ┌──────────────────┴────────────┬─────────┴──────────────────┐
        │                               │                            │
┌───────▼──────────┐          ┌─────────▼─────────┐      ┌──────────▼─────┐
│ Controllers      │          │ Controllers       │      │ Middleware     │
│ - REST endpoints │          │ - REST endpoints  │      │ - Auth         │
│ - Request/       │          │ - Request/        │      │ - CORS         │
│   Response       │          │   Response        │      │ - Rate Limit   │
└───────┬──────────┘          └─────────┬─────────┘      └──────────┬─────┘
        │                               │                            │
┌───────▼──────────┐          ┌─────────▼─────────┐                 │
│ Services         │          │ Services          │                 │
│ - Business Logic │          │ - Business Logic  │                 │
│ - OrderService   │          │ - ProductService  │                 │
│ - CartService    │          │ - InventoryService│                 │
│ - PaymentService │          │ - ReportService   │                 │
└───────┬──────────┘          └─────────┬─────────┘                 │
        │                               │                            │
┌───────▼──────────┐          ┌─────────▼─────────┐                 │
│ Models (ORM)     │          │ Models (ORM)      │                 │
│ - ActiveRecord   │          │ - Eloquent        │                 │
│ - User           │          │ - Product         │                 │
│ - Order          │          │ - Admin           │                 │
│ - Product        │          │ - InventoryLog    │                 │
└───────┬──────────┘          └─────────┬─────────┘                 │
        │                               │                            │
        └───────────────┬───────────────┴────────────────────────────┘
                        │
        ┌───────────────▼────────────────┐
        │        MySQL Database          │
        │  - Users, Products, Orders     │
        │  - Carts, Payments, Inventory  │
        └────────────────────────────────┘

        ┌────────────────────────────────┐
        │         Redis Cache            │
        │  - Sessions (User & Admin)     │
        │  - Cache (Product lists, etc)  │
        └────────────────────────────────┘

        ┌────────────────────────────────┐
        │      Background Jobs           │
        │  - CSV Generation (Cron)       │
        │  - Email Sending (Sidekiq)     │
        └────────────────────────────────┘
```

### 4.2 Component Responsibilities

#### 4.2.1 Frontend Components (React)

**User Interface Components**:

| Component | Responsibility | Key Features |
|-----------|----------------|--------------|
| **ProductList** | Display products with filtering/sorting | Pagination, lazy loading, search |
| **ProductDetail** | Show single product details | Image gallery, add to cart |
| **Cart** | Manage shopping cart | Update quantities, remove items, checkout |
| **Checkout** | Order confirmation and payment | Address confirmation, payment form |
| **UserAuth** | Login, registration, password reset | Form validation, error handling |
| **OrderHistory** | Display user's past orders | Order details, reorder functionality |

**Admin Interface Components**:

| Component | Responsibility | Key Features |
|-----------|----------------|--------------|
| **Dashboard** | Overview of key metrics | Sales summary, low stock alerts |
| **ProductManager** | CRUD operations for products | Image upload, category assignment |
| **InventoryManager** | Stock adjustments and audit | Stock history, bulk updates |
| **AdminAuth** | Admin login | Enhanced security, session management |

**Shared Components**:
- `Button`, `Input`, `Modal`, `Alert`, `LoadingSpinner`, `Table`, `Pagination`

**State Management**:
- **Context API**: Global state (auth, cart, theme)
- **Custom Hooks**: `useAuth`, `useCart`, `useProducts`, `useAPI`
- **Local State**: Component-specific UI state

#### 4.2.2 Backend Components

**Rails (User API) - Layered Architecture**:

```
Controllers (HTTP layer)
    ↓
Services (Business logic)
    ↓
Models (Data access)
    ↓
Database
```

**Key Services**:

| Service | Responsibility |
|---------|----------------|
| **AuthenticationService** | User login, token generation, session management |
| **RegistrationService** | User registration, email confirmation |
| **PasswordResetService** | Password reset workflow |
| **ProductService** | Product queries, filtering, search |
| **CartService** | Cart operations, stock validation |
| **OrderProcessingService** | Order creation, payment processing, inventory deduction |
| **PaymentService** | Payment gateway integration (mocked) |

**Laravel (Admin API)**:

| Service | Responsibility |
|---------|----------------|
| **AdminAuthService** | Admin authentication |
| **ProductManagementService** | Product CRUD operations |
| **InventoryService** | Stock adjustments, audit logging |
| **ReportGenerationService** | CSV report generation |
| **ImageUploadService** | Handle image uploads to storage |

#### 4.2.3 Database Layer

**Models** (Rails ActiveRecord / Laravel Eloquent):
- Encapsulate database queries
- Define relationships (has_many, belongs_to)
- Validation rules
- Scopes for common queries (e.g., `active_products`, `recent_orders`)

**Migrations**:
- Version-controlled schema changes
- Reversible migrations for rollback capability

#### 4.2.4 Middleware Components

| Middleware | Purpose | Applied To |
|------------|---------|-----------|
| **AuthenticationMiddleware** | Verify JWT tokens | Protected routes |
| **CorsMiddleware** | CORS headers for frontend | All API routes |
| **RateLimitMiddleware** | Prevent abuse | All API routes |
| **LoggingMiddleware** | Request/response logging | All routes |
| **ErrorHandlingMiddleware** | Standardized error responses | All routes |

---

## 5. Data Flow

### 5.1 User Registration Flow

```
User → React Form → Validation
    ↓
Rails POST /api/v1/users/register
    ↓
RegistrationService
    - Validate input
    - Hash password (bcrypt)
    - Create user in DB
    - Generate email confirmation token
    - Send confirmation email
    ↓
Response: { user_id, message: "Check email" }
    ↓
User clicks email link → React /confirm-email/:token
    ↓
Rails POST /api/v1/users/confirm
    - Verify token
    - Activate account
    ↓
Redirect to login
```

### 5.2 User Login Flow

```
User → React Login Form
    ↓
Rails POST /api/v1/auth/login { email, password }
    ↓
AuthenticationService
    - Validate credentials
    - Generate JWT token (1 hour expiry)
    - Store session in Redis (24 hour TTL)
    - Return token + user info
    ↓
React receives token
    - Store in memory (not localStorage for security)
    - Set HttpOnly cookie for refresh token
    - Update auth context
    ↓
Subsequent requests include Authorization: Bearer <token>
```

### 5.3 Product Browsing Flow

```
User → ProductList component loads
    ↓
React → GET /api/v1/products?page=1&category=electronics
    ↓
Rails ProductsController
    ↓
ProductService.list(filters)
    - Build query with filters
    - Check Redis cache
    - If cache miss: query DB, cache result (5 min TTL)
    ↓
Response: { products: [...], total: 100, page: 1 }
    ↓
React renders products, pagination
```

### 5.4 Add to Cart Flow

```
User clicks "Add to Cart" on ProductDetail
    ↓
React → POST /api/v1/cart/items { product_id, quantity }
    ↓
Rails CartController
    - Authenticate user
    ↓
CartService.add_item(user, product_id, quantity)
    - Find or create cart for user
    - Check if item already in cart (update quantity vs create)
    - Basic validation (quantity > 0)
    - Create/update cart_item record
    - No stock validation at this point (done at checkout)
    ↓
Response: { cart: {...}, items: [...] }
    ↓
React updates cart context, shows success message
```

### 5.5 Checkout Flow (Critical Path - Concurrency Handling)

```
User → Checkout component → Review cart
    ↓
React → POST /api/v1/orders { shipping_address, payment_method }
    ↓
Rails OrdersController → OrderProcessingService
    ↓
Begin Database Transaction (CRITICAL for consistency)
    ↓
Step 1: Lock and Validate Inventory
    - FOR UPDATE lock on products (prevents concurrent modifications)
    - For each cart item:
        - Check stock_quantity >= requested quantity
        - If insufficient: rollback, return error
    ↓
Step 2: Create Order
    - Generate unique order_number
    - Create order record with total_amount
    - Create order_items (snapshot product prices)
    ↓
Step 3: Deduct Inventory
    - Update products.stock_quantity -= ordered quantity
    - Create inventory_log entries for audit trail
    ↓
Step 4: Process Payment (Mocked)
    - PaymentService.process(order)
    - Generate transaction_id
    - Create payment record
    ↓
Step 5: Clear Cart
    - Delete cart_items for user
    ↓
Commit Transaction
    ↓
Step 6: Background Jobs (async, outside transaction)
    - Send order confirmation email
    - Update analytics
    ↓
Response: { order_id, order_number, status: "success" }
    ↓
React → Redirect to order confirmation page
```

**Concurrency Scenario**:
```
Time | User A                    | User B
-----|---------------------------|---------------------------
T1   | Add Product X (1 left)    |
T2   | to cart                   | Add Product X to cart
T3   | Start checkout            |
T4   | Lock Product X row        | Start checkout
T5   | Check stock: 1 available  | Wait for lock...
T6   | Create order, deduct -1   |
T7   | Commit transaction        |
T8   | Release lock              | Acquire lock
T9   |                           | Check stock: 0 available
T10  |                           | Error: Out of stock
T11  |                           | Rollback, show error
```

### 5.6 Admin Product Creation Flow

```
Admin → ProductManager form
    ↓
React → POST /api/v1/admin/products (multipart/form-data)
    {
        name, description, price, category_id,
        initial_stock, images: [File, File]
    }
    ↓
Laravel ProductsController
    - Authenticate admin (JWT)
    ↓
ProductManagementService.create(data)
    ↓
Begin Transaction
    ↓
Step 1: Upload Images
    - ImageUploadService.upload(images)
    - Save to storage (S3 or local)
    - Get URLs
    ↓
Step 2: Create Product
    - Validate input
    - Create product record
    - Associate images
    ↓
Step 3: Initialize Inventory
    - Set stock_quantity
    - Create inventory_log (action: "initial_stock")
    ↓
Commit Transaction
    ↓
Step 4: Clear Cache
    - Invalidate product list cache in Redis
    ↓
Response: { product: {...} }
    ↓
React → Redirect to product list, show success
```

### 5.7 CSV Report Generation Flow

```
Cron Job (9:00 AM daily)
    ↓
Laravel Task Scheduler → ReportGenerationService
    ↓
Query Database
    - Get all products with stock info
    - JOIN categories for category name
    ↓
Generate CSV
    - Headers: SKU, Name, Category, Stock, Status
    - Stream to file: inventory_report_2025-12-24.csv
    ↓
Save to storage
    - Local: /storage/reports/
    - Or upload to S3
    ↓
Optional: Email to admins
    ↓
Log completion
    - Create report_log entry
    - Timestamp, row count, file path
    ↓
Cleanup old reports (> 30 days)
```

---

## 6. Security Architecture

### 6.1 Authentication Architecture

**JWT Token Structure**:
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user_id": 123,
    "email": "user@example.com",
    "role": "user",
    "exp": 1735084800,
    "iat": 1735081200
  },
  "signature": "..."
}
```

**Token Lifecycle**:
1. **Access Token**: Short-lived (1 hour), sent in Authorization header
2. **Refresh Token**: Long-lived (30 days), stored in HttpOnly cookie
3. **Session in Redis**: Stores user state, auto-expires with TTL

**Security Measures**:
- Tokens signed with secret key (environment variable)
- Refresh token rotation on use
- Token blacklist in Redis for logout

### 6.2 Session Management (Redis)

**Session Storage Structure**:
```
Key: session:user:123:abc123token
Value: {
  user_id: 123,
  email: "user@example.com",
  created_at: "2025-12-24T10:00:00Z",
  last_accessed: "2025-12-24T14:30:00Z",
  ip_address: "192.168.1.1",
  user_agent: "Mozilla/5.0..."
}
TTL: 86400 seconds (24 hours)
```

**Session Security**:
- HttpOnly cookies (XSS protection)
- Secure flag (HTTPS only)
- SameSite=Strict (CSRF protection)
- Session invalidation on logout
- Concurrent session limit (max 3 per user)

### 6.3 API Security

**CORS Configuration**:
```ruby
# Rails config/initializers/cors.rb
allowed_origins = ENV['FRONTEND_URL'] # http://localhost:5173 (dev)

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins allowed_origins
    resource '/api/*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options],
      credentials: true  # Allow cookies
  end
end
```

**Rate Limiting**:
- **Anonymous**: 100 requests/hour per IP
- **Authenticated Users**: 1000 requests/hour per user
- **Admin**: 500 requests/hour per admin
- **Login Endpoint**: 5 attempts/15 minutes per IP

**Input Validation**:
- Strong parameters (Rails) / Request validation (Laravel)
- Type checking, length limits, format validation
- SQL injection prevention (ORM parameterized queries)
- XSS prevention (output encoding, React auto-escapes)

### 6.4 Data Protection

**Password Security**:
- Bcrypt hashing (cost factor 12)
- Minimum 8 characters, complexity requirements
- Password reset tokens: 1-hour expiry, one-time use

**Sensitive Data**:
- Environment variables for secrets (never commit)
- Encrypted database columns for sensitive fields (if needed)
- TLS/SSL for all API communication (production)

**OWASP Top 10 Mitigations**:

| Vulnerability | Mitigation |
|---------------|------------|
| **Injection** | ORM with parameterized queries, input validation |
| **Broken Authentication** | JWT with short expiry, secure session management, rate limiting |
| **Sensitive Data Exposure** | TLS, password hashing, no logging of sensitive data |
| **XML External Entities** | N/A (JSON API only) |
| **Broken Access Control** | Authorization checks on every endpoint, role-based access |
| **Security Misconfiguration** | Security headers, CORS, environment-specific configs |
| **XSS** | React auto-escaping, CSP headers, input sanitization |
| **Insecure Deserialization** | Avoid deserializing untrusted data |
| **Using Components with Known Vulnerabilities** | Regular dependency updates, vulnerability scanning |
| **Insufficient Logging & Monitoring** | Structured logging, security event alerts |

---

## 7. Performance Optimization

### 7.1 Database Optimization

**Indexing Strategy**:
```sql
-- Primary keys (auto-indexed)
-- Foreign keys (critical for joins)
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_products_category_id ON products(category_id);

-- Query optimization indexes
CREATE INDEX idx_users_email ON users(email);  -- Login queries
CREATE INDEX idx_products_active ON products(is_active, is_suspended);  -- Filter queries
CREATE INDEX idx_orders_user_id_created ON orders(user_id, created_at DESC);  -- Order history
CREATE INDEX idx_products_name_fulltext ON products(name);  -- Search

-- Composite indexes for common query patterns
CREATE INDEX idx_products_category_active ON products(category_id, is_active, is_suspended);
```

**Query Optimization**:
- **N+1 Prevention**: Eager loading with `includes` (Rails) / `with` (Laravel)
- **Select Specific Columns**: Avoid `SELECT *`, use `select(:id, :name, :price)`
- **Pagination**: Limit result sets, cursor-based pagination for large datasets
- **Batch Processing**: Process large datasets in chunks

**Database Connection Pooling**:
```yaml
# config/database.yml
production:
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  # Maximum connections per app instance
```

### 7.2 Caching Strategy

**Multi-Layer Caching**:

```
Browser Cache (static assets)
    ↓
CDN Cache (images, CSS, JS)
    ↓
Redis Cache (API responses, product lists)
    ↓
Database Query Cache
    ↓
Database
```

**Redis Caching Patterns**:

| Cache Key | TTL | Invalidation |
|-----------|-----|--------------|
| `products:list:category:1:page:1` | 5 min | On product create/update/delete |
| `product:123` | 15 min | On product update |
| `categories:all` | 1 hour | On category change |
| `user:123:cart` | 30 min | On cart modification |

**Cache-Aside Pattern**:
```ruby
def get_product(id)
  cache_key = "product:#{id}"

  # Try cache first
  cached = Redis.current.get(cache_key)
  return JSON.parse(cached) if cached

  # Cache miss: query database
  product = Product.find(id)

  # Store in cache
  Redis.current.setex(cache_key, 900, product.to_json)  # 15 min TTL

  product
end
```

### 7.3 Frontend Performance

**Code Splitting**:
- Lazy load admin components (not needed for regular users)
- Route-based code splitting
- Dynamic imports for heavy libraries

**Image Optimization**:
- Lazy loading with Intersection Observer
- Responsive images (srcset)
- WebP format with fallback
- Image CDN for automatic optimization

**Bundle Optimization**:
- Tree shaking (remove unused code)
- Minification and compression
- Separate vendor bundle (better caching)

### 7.4 API Performance

**Response Compression**:
- Gzip/Brotli compression for API responses
- Reduces payload size by ~70%

**Pagination**:
- Default page size: 20 items
- Max page size: 100 items
- Include pagination metadata in responses

**Field Selection**:
- Allow clients to specify needed fields
- Example: `GET /api/v1/products?fields=id,name,price`

---

## 8. Testing Strategy

### 8.1 Test Pyramid

```
        /\
       /  \
      /E2E \      Big Tests (10%)
     /------\
    /        \
   /Integration\  Medium Tests (30%)
  /------------\
 /              \
/  Unit Tests    \ Small Tests (60%)
------------------
```

### 8.2 Small Tests (Unit Tests)

**Rails (minitest)**:
- Test individual models, services, helpers
- Mock external dependencies
- Fast execution (< 1 second per test)

```ruby
# test/services/order_processing_service_test.rb
class OrderProcessingServiceTest < ActiveSupport::TestCase
  def setup
    @user = users(:john)
    @product = products(:laptop)
    @cart = carts(:john_cart)
  end

  test "creates order and deducts inventory" do
    initial_stock = @product.stock_quantity

    service = OrderProcessingService.new(@user)
    order = service.execute

    assert_equal initial_stock - 1, @product.reload.stock_quantity
    assert_equal "completed", order.status
  end

  test "raises error when insufficient stock" do
    @product.update(stock_quantity: 0)

    service = OrderProcessingService.new(@user)

    assert_raises(InsufficientStockError) do
      service.execute
    end
  end
end
```

**Laravel (phpunit)**:
```php
// tests/Unit/InventoryServiceTest.php
class InventoryServiceTest extends TestCase {
    public function test_adjusts_stock_and_logs_change() {
        $product = Product::factory()->create(['stock_quantity' => 100]);
        $admin = Admin::factory()->create();

        $service = new InventoryService();
        $service->adjustStock($product, 50, 'restock', $admin);

        $this->assertEquals(150, $product->fresh()->stock_quantity);
        $this->assertDatabaseHas('inventory_logs', [
            'product_id' => $product->id,
            'admin_id' => $admin->id,
            'action_type' => 'restock'
        ]);
    }
}
```

**React (Jest)**:
```javascript
// src/components/ProductCard.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from './ProductCard';

test('disables add to cart button when out of stock', () => {
  const product = { id: 1, name: 'Laptop', price: 999, stock: 0 };

  render(<ProductCard product={product} />);

  const button = screen.getByText(/add to cart/i);
  expect(button).toBeDisabled();
});

test('calls onAddToCart when button clicked', () => {
  const product = { id: 1, name: 'Laptop', price: 999, stock: 5 };
  const mockAddToCart = jest.fn();

  render(<ProductCard product={product} onAddToCart={mockAddToCart} />);

  fireEvent.click(screen.getByText(/add to cart/i));

  expect(mockAddToCart).toHaveBeenCalledWith(product.id, 1);
});
```

### 8.3 Medium Tests (Integration Tests)

**API Endpoint Testing**:
```ruby
# test/integration/products_api_test.rb
class ProductsApiTest < ActionDispatch::IntegrationTest
  test "GET /api/v1/products returns product list" do
    get "/api/v1/products", headers: auth_headers

    assert_response :success
    json = JSON.parse(response.body)
    assert_equal Product.count, json['products'].length
  end

  test "POST /api/v1/products requires authentication" do
    post "/api/v1/products", params: { product: { name: "Test" } }

    assert_response :unauthorized
  end
end
```

**Database Integration**:
- Test with real test database (not mocked)
- Test transactions, rollbacks
- Test unique constraints, foreign keys

### 8.4 Big Tests (E2E Tests)

**Cypress Example**:
```javascript
// cypress/e2e/checkout_flow.cy.js
describe('Checkout Flow', () => {
  beforeEach(() => {
    cy.login('user@example.com', 'password');
  });

  it('completes full purchase flow', () => {
    // Browse products
    cy.visit('/products');
    cy.contains('Laptop').click();

    // Add to cart
    cy.get('[data-testid="add-to-cart"]').click();
    cy.contains('Added to cart').should('be.visible');

    // Go to cart
    cy.get('[data-testid="cart-icon"]').click();
    cy.contains('Checkout').click();

    // Confirm address
    cy.get('[data-testid="confirm-address"]').click();

    // Select payment
    cy.get('[data-testid="payment-method"]').select('credit_card');

    // Place order
    cy.get('[data-testid="place-order"]').click();

    // Verify success
    cy.contains('Order confirmed').should('be.visible');
    cy.get('[data-testid="order-number"]').should('exist');
  });

  it('shows error when product out of stock', () => {
    // Add last item to cart
    cy.addToCart(productId, quantity: 1);

    // Simulate concurrent purchase (via API)
    cy.request('POST', '/api/v1/orders', {
      product_id: productId,
      quantity: 1
    });

    // Try to checkout
    cy.get('[data-testid="checkout"]').click();

    // Should see error
    cy.contains('Out of stock').should('be.visible');
  });
});
```

**Critical E2E Test Scenarios**:
1. User registration → login → browse → add to cart → checkout
2. Admin login → create product → manage inventory
3. Concurrent purchase handling
4. Password reset flow
5. Session timeout and re-login

### 8.5 Test Coverage Goals

**Target Coverage**:
- Overall: 80%+
- Critical paths (checkout, payment): 95%+
- Models: 90%+
- Services: 85%+
- Controllers: 75%+
- Frontend components: 70%+

**Coverage Exclusions**:
- Configuration files
- Database migrations
- Simple getters/setters
- Framework-generated boilerplate

---

## 9. Deployment Architecture

### 9.1 Docker Containerization

**Services**:

```yaml
# docker-compose.yml structure
services:
  frontend:
    - React app (production build served by nginx)

  rails-api:
    - Rails server (puma)

  laravel-api:
    - Laravel server (php-fpm + nginx)

  mysql:
    - MySQL 8.0

  redis:
    - Redis 7+

  nginx:
    - Reverse proxy
    - Routes /api/user/* → rails-api
    - Routes /api/admin/* → laravel-api
    - Routes /* → frontend
```

**Container Communication**:
```
User Browser
    ↓
Nginx (port 80/443)
    ↓ /api/user/*
Rails API (port 3000)
    ↓ /api/admin/*
Laravel API (port 8000)
    ↓
MySQL (port 3306) & Redis (port 6379)
```

### 9.2 Environment Configuration

**Development**:
- Hot reload for frontend
- Debugger enabled
- Verbose logging
- Mock email sending

**Production**:
- Optimized builds
- Error logging only
- Real email SMTP
- HTTPS enforced

**Environment Variables**:
```bash
# .env
DATABASE_URL=mysql://user:pass@db:3306/ec_site
REDIS_URL=redis://redis:6379/0
JWT_SECRET=<random_secret>
FRONTEND_URL=http://localhost:5173
ADMIN_FRONTEND_URL=http://localhost:5173/admin
```

### 9.3 Makefile for Container Management

```makefile
# Makefile
.PHONY: setup start stop test migrate seed clean

setup:
	docker-compose build
	docker-compose run rails-api rake db:create db:migrate
	docker-compose run laravel-api php artisan migrate
	make seed

start:
	docker-compose up -d

stop:
	docker-compose down

restart:
	make stop
	make start

test:
	docker-compose run rails-api rake test
	docker-compose run laravel-api php artisan test
	docker-compose run frontend npm test

migrate:
	docker-compose run rails-api rake db:migrate
	docker-compose run laravel-api php artisan migrate

seed:
	docker-compose run rails-api rake db:seed
	docker-compose run laravel-api php artisan db:seed

clean:
	docker-compose down -v
	docker system prune -f

logs:
	docker-compose logs -f

shell-rails:
	docker-compose run rails-api bash

shell-laravel:
	docker-compose run laravel-api bash
```

---

## 10. Design Innovations

### 10.1 Concurrency Handling with Optimistic Locking

**Innovation**: Hybrid approach combining database row locking and optimistic locking for concurrent purchases.

**Implementation**:
```ruby
# app/models/product.rb
class Product < ApplicationRecord
  # Add version column for optimistic locking
  # Migration: add_column :products, :lock_version, :integer, default: 0
end

# app/services/order_processing_service.rb
def deduct_inventory(order_items)
  ActiveRecord::Base.transaction do
    order_items.each do |item|
      product = Product.lock("FOR UPDATE").find(item.product_id)

      # Row-level lock prevents concurrent modifications
      if product.stock_quantity < item.quantity
        raise InsufficientStockError, "Not enough stock for #{product.name}"
      end

      product.update!(stock_quantity: product.stock_quantity - item.quantity)

      # Log inventory change
      InventoryLog.create!(
        product: product,
        quantity_before: product.stock_quantity + item.quantity,
        quantity_after: product.stock_quantity,
        action_type: 'sale'
      )
    end
  end
end
```

**Benefit**:
- **Correctness**: Prevents overselling under high concurrency
- **Performance**: Row-level locks minimize contention vs table locks
- **Audit Trail**: Complete inventory history

### 10.2 Multi-Backend Architecture with Shared Database

**Innovation**: Separate Rails and Laravel backends share a single MySQL database but with clear domain boundaries.

**Design**:
```
Rails (User API)
  - Reads/Writes: users, carts, cart_items, orders, order_items, payments
  - Reads only: products, categories

Laravel (Admin API)
  - Reads/Writes: admins, products, categories, inventory_logs
  - Reads only: orders, order_items (for reporting)
```

**Benefits**:
- **Data Consistency**: Single source of truth
- **Cross-Service Queries**: Admin can view user orders without API calls
- **Simplified Deployment**: No data synchronization required

**Tradeoff**: Not "pure" microservices (coupled via database), but appropriate for project scope.

### 10.3 Service Layer Pattern

**Innovation**: Explicit service layer separates business logic from controllers and models.

**Structure**:
```
Controllers:  HTTP concerns (request/response, status codes)
    ↓
Services:     Business logic (orchestration, validation, transactions)
    ↓
Models:       Data access (queries, relationships, simple validations)
```

**Example**:
```ruby
# app/controllers/orders_controller.rb
class OrdersController < ApplicationController
  def create
    result = OrderProcessingService.new(current_user, order_params).execute
    render json: result, status: :created
  rescue InsufficientStockError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end
end

# app/services/order_processing_service.rb
class OrderProcessingService
  def initialize(user, params)
    @user = user
    @params = params
  end

  def execute
    ActiveRecord::Base.transaction do
      @order = create_order
      deduct_inventory
      process_payment
      send_confirmation_email
      @order
    end
  end

  private

  def create_order
    # Complex order creation logic
  end

  def deduct_inventory
    # Inventory management logic
  end

  def process_payment
    # Payment processing logic
  end

  def send_confirmation_email
    # Email sending (async job)
  end
end
```

**Benefits**:
- **Testability**: Service methods are pure functions, easy to unit test
- **Reusability**: Services can be called from controllers, background jobs, console
- **Single Responsibility**: Each layer has clear purpose
- **Maintainability**: Changes to business logic don't affect controller/model structure

### 10.4 React Context + Custom Hooks Pattern

**Innovation**: Combine Context API for global state with custom hooks for logic reuse.

**Implementation**:
```javascript
// src/contexts/AuthContext.js
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkSession();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    setUser(response.data.user);
    localStorage.setItem('token', response.data.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// src/hooks/useAuth.js
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Usage in components
function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div>
      Welcome, {user.name}!
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

**Benefits**:
- **DRY**: Auth logic written once, used everywhere
- **Type Safety**: Can add TypeScript for compile-time checks
- **Testing**: Mock context provider in tests
- **Performance**: Context updates only re-render subscribed components

### 10.5 Scheduled Task Architecture

**Innovation**: Combine Laravel Task Scheduler with health monitoring.

**Implementation**:
```php
// app/Console/Kernel.php
protected function schedule(Schedule $schedule) {
    $schedule->call(function () {
        $service = new ReportGenerationService();
        $result = $service->generateInventoryReport();

        // Log success/failure
        Log::info('Inventory report generated', [
            'row_count' => $result['row_count'],
            'file_path' => $result['file_path']
        ]);

        // Alert on failure
        if (!$result['success']) {
            // Send alert to admins
            Mail::to(config('app.admin_email'))
                ->send(new ReportFailedMail($result['error']));
        }
    })->dailyAt('09:00')
      ->timezone('America/New_York')
      ->name('inventory_report')
      ->withoutOverlapping();  // Prevent concurrent runs
}
```

**Benefits**:
- **Reliability**: `withoutOverlapping()` prevents job pile-up
- **Monitoring**: Logging and alerting built-in
- **Maintainability**: Declarative schedule configuration

---

## 11. Conclusion

This system design provides a robust foundation for a production-ready e-commerce application with:

**Architectural Strengths**:
- Clear separation of concerns (user vs admin backends)
- Scalable microservices-oriented design
- Security-first approach (authentication, session management, OWASP compliance)
- Performance optimization at every layer (caching, indexing, query optimization)

**Code Quality**:
- SOLID principles throughout
- Comprehensive testing strategy (80%+ coverage)
- Service layer for maintainable business logic
- Reusable React components

**Operational Excellence**:
- Dockerized deployment
- Automated testing and deployment pipelines
- Scheduled tasks with monitoring
- Comprehensive logging and error handling

**Future-Proof**:
- Easy to add features (product variants, reviews, discounts)
- Scalable architecture (horizontal scaling, caching)
- Well-documented for new developers

This design demonstrates not just "working code," but thoughtful engineering with clear rationale for every decision.

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-24 | Development Team | Initial system design document |
