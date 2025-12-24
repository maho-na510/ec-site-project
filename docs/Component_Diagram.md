# Component Diagram - EC Site Application

## Overview
This document provides detailed component diagrams showing the architecture of our e-commerce application, including component interactions, dependencies, and data flow.

---

## 1. System-Level Component Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
    end

    subgraph "Frontend - React SPA"
        ReactApp[React Application]
        UserUI[User Interface]
        AdminUI[Admin Interface]
        StateManager[State Management<br/>Context API]
        APIClient[API Client Layer<br/>Axios]

        ReactApp --> UserUI
        ReactApp --> AdminUI
        UserUI --> StateManager
        AdminUI --> StateManager
        UserUI --> APIClient
        AdminUI --> APIClient
    end

    subgraph "Backend Services"
        subgraph "Rails API - User Service"
            RailsRouter[Rails Router]
            RailsControllers[Controllers]
            RailsServices[Service Layer]
            RailsModels[Models<br/>ActiveRecord]

            RailsRouter --> RailsControllers
            RailsControllers --> RailsServices
            RailsServices --> RailsModels
        end

        subgraph "Laravel API - Admin Service"
            LaravelRouter[Laravel Router]
            LaravelControllers[Controllers]
            LaravelServices[Service Layer]
            LaravelModels[Models<br/>Eloquent]

            LaravelRouter --> LaravelControllers
            LaravelControllers --> LaravelServices
            LaravelServices --> LaravelModels
        end
    end

    subgraph "Data Layer"
        MySQL[(MySQL Database)]
        Redis[(Redis<br/>Sessions & Cache)]
    end

    subgraph "External Services"
        SMTP[SMTP Server<br/>Email]
        Storage[File Storage<br/>S3/Local]
    end

    subgraph "Background Jobs"
        Scheduler[Task Scheduler<br/>Cron]
        JobQueue[Job Queue<br/>Sidekiq]
    end

    Browser --> ReactApp
    APIClient -->|HTTP/JSON| RailsRouter
    APIClient -->|HTTP/JSON| LaravelRouter

    RailsModels --> MySQL
    LaravelModels --> MySQL

    RailsServices --> Redis
    LaravelServices --> Redis

    RailsServices --> JobQueue
    LaravelServices --> Scheduler

    JobQueue --> SMTP
    Scheduler --> SMTP
    LaravelServices --> Storage

    Scheduler --> LaravelServices

    style ReactApp fill:#61dafb
    style RailsRouter fill:#cc0000
    style LaravelRouter fill:#ff2d20
    style MySQL fill:#4479a1
    style Redis fill:#dc382d
```

---

## 2. Frontend Component Architecture

```mermaid
graph TB
    subgraph "React Application"
        App[App Component<br/>Routing]

        subgraph "User Features"
            Home[Home Page]
            ProductList[Product List Page]
            ProductDetail[Product Detail Page]
            Cart[Shopping Cart]
            Checkout[Checkout Page]
            OrderHistory[Order History]
            UserAuth[User Auth<br/>Login/Register]
            UserProfile[User Profile]
        end

        subgraph "Admin Features"
            AdminDash[Admin Dashboard]
            ProductMgmt[Product Management]
            InventoryMgmt[Inventory Management]
            AdminAuth[Admin Login]
            CategoryMgmt[Category Management]
            ReportView[Reports View]
        end

        subgraph "Shared Components"
            Header[Header]
            Footer[Footer]
            Button[Button]
            Input[Form Input]
            Modal[Modal Dialog]
            Toast[Toast Notifications]
            Loader[Loading Spinner]
            Table[Data Table]
            Pagination[Pagination]
            ImageGallery[Image Gallery]
        end

        subgraph "State Management"
            AuthContext[Auth Context]
            CartContext[Cart Context]
            UIContext[UI Context]
        end

        subgraph "Hooks & Utils"
            useAuth[useAuth Hook]
            useCart[useCart Hook]
            useAPI[useAPI Hook]
            useForm[useForm Hook]
            APIService[API Service]
            Validators[Form Validators]
        end

        App --> Home
        App --> ProductList
        App --> ProductDetail
        App --> Cart
        App --> Checkout
        App --> AdminDash

        Home --> Header
        ProductList --> Header
        ProductList --> Table
        ProductList --> Pagination

        ProductDetail --> ImageGallery
        ProductDetail --> Button

        Cart --> Table
        Cart --> Button

        Checkout --> Input
        Checkout --> Button

        AdminDash --> Table
        ProductMgmt --> Input
        ProductMgmt --> ImageGallery

        UserAuth --> Input
        UserAuth --> Button
        UserAuth --> useAuth

        ProductList --> useAPI
        Cart --> useCart
        Checkout --> useCart

        useAuth --> AuthContext
        useCart --> CartContext
        useAPI --> APIService

        APIService -->|HTTP Requests| Backend[Backend APIs]
    end

    style App fill:#61dafb
    style AuthContext fill:#ffd700
    style CartContext fill:#ffd700
    style APIService fill:#90ee90
```

---

## 3. Rails Backend Component Architecture

```mermaid
graph TB
    subgraph "Rails API - User Service"
        subgraph "HTTP Layer"
            Middleware[Middleware Stack]
            Router[Routes<br/>config/routes.rb]

            subgraph "Middleware Components"
                CORS[CORS Middleware]
                Auth[Auth Middleware]
                RateLimit[Rate Limiter]
                Logger[Request Logger]
                ErrorHandler[Error Handler]
            end

            Middleware --> CORS
            Middleware --> Auth
            Middleware --> RateLimit
            Middleware --> Logger
            Middleware --> ErrorHandler
        end

        Router --> Controllers

        subgraph "Controllers"
            AuthController[AuthController<br/>login, register]
            UsersController[UsersController<br/>profile, update]
            ProductsController[ProductsController<br/>list, show]
            CartsController[CartsController<br/>CRUD cart items]
            OrdersController[OrdersController<br/>create, history]
        end

        Controllers --> Services

        subgraph "Service Layer"
            AuthService[AuthenticationService]
            RegService[RegistrationService]
            PwdResetService[PasswordResetService]
            ProductService[ProductService]
            CartService[CartService]
            OrderService[OrderProcessingService]
            PaymentService[PaymentService]
        end

        Services --> Models

        subgraph "Models - ActiveRecord"
            User[User]
            Product[Product]
            Cart[Cart]
            CartItem[CartItem]
            Order[Order]
            OrderItem[OrderItem]
            Payment[Payment]
            Category[Category]
            PwdResetToken[PasswordResetToken]
        end

        Models --> DB[(MySQL)]

        subgraph "External Integrations"
            Services --> RedisCache[(Redis)]
            Services --> JobQueue[Background Jobs<br/>Sidekiq]
            JobQueue --> Mailer[Action Mailer]
        end
    end

    style Router fill:#cc0000
    style Services fill:#90ee90
    style Models fill:#4169e1
    style DB fill:#4479a1
    style RedisCache fill:#dc382d
```

### Rails Component Responsibilities

| Component | Responsibility | Key Methods |
|-----------|----------------|-------------|
| **AuthController** | Handle login/logout requests | `login`, `logout`, `refresh_token` |
| **AuthenticationService** | Validate credentials, generate JWT | `authenticate`, `generate_token`, `verify_token` |
| **RegistrationService** | Create new users, send confirmation | `register`, `confirm_email`, `send_confirmation` |
| **ProductService** | Query products with filters | `list`, `search`, `filter_by_category` |
| **CartService** | Manage cart operations | `add_item`, `update_quantity`, `remove_item`, `get_cart` |
| **OrderProcessingService** | Orchestrate checkout flow | `execute`, `validate_cart`, `deduct_inventory`, `process_payment` |
| **PaymentService** | Mock payment processing | `process`, `generate_transaction_id`, `validate_payment` |

---

## 4. Laravel Backend Component Architecture

```mermaid
graph TB
    subgraph "Laravel API - Admin Service"
        subgraph "HTTP Layer"
            LaravelMiddleware[Middleware Stack]
            LaravelRouter[Routes<br/>routes/api.php]

            subgraph "Middleware Components"
                LaravelCORS[CORS]
                LaravelAuth[Admin Auth]
                LaravelRateLimit[Rate Limiter]
                LaravelLog[Logger]
            end

            LaravelMiddleware --> LaravelCORS
            LaravelMiddleware --> LaravelAuth
            LaravelMiddleware --> LaravelRateLimit
        end

        LaravelRouter --> LaravelControllers

        subgraph "Controllers"
            AdminAuthController[AdminAuthController]
            AdminController[AdminController]
            ProductController[ProductController]
            InventoryController[InventoryController]
            CategoryController[CategoryController]
            ReportController[ReportController]
        end

        LaravelControllers --> LaravelServices

        subgraph "Service Layer"
            AdminAuthService[AdminAuthService]
            ProductMgmtService[ProductManagementService]
            InventoryService[InventoryService]
            ImageUploadService[ImageUploadService]
            ReportService[ReportGenerationService]
        end

        LaravelServices --> LaravelModels

        subgraph "Models - Eloquent"
            Admin[Admin]
            ProductModel[Product]
            ProductImage[ProductImage]
            CategoryModel[Category]
            InventoryLog[InventoryLog]
        end

        LaravelModels --> LaravelDB[(MySQL)]

        subgraph "External Integrations"
            LaravelServices --> LaravelRedis[(Redis)]
            LaravelServices --> TaskScheduler[Task Scheduler]
            ImageUploadService --> FileStorage[File Storage<br/>S3/Local]
            TaskScheduler --> EmailService[Mail Service]
        end
    end

    style LaravelRouter fill:#ff2d20
    style LaravelServices fill:#90ee90
    style LaravelModels fill:#4169e1
    style LaravelDB fill:#4479a1
    style LaravelRedis fill:#dc382d
```

### Laravel Component Responsibilities

| Component | Responsibility | Key Methods |
|-----------|----------------|-------------|
| **AdminAuthController** | Admin authentication | `login`, `logout`, `verify` |
| **ProductController** | Product CRUD operations | `index`, `store`, `update`, `destroy`, `suspend` |
| **ProductManagementService** | Product business logic | `create`, `update`, `delete`, `toggle_suspension` |
| **InventoryController** | Inventory adjustments | `adjust`, `history`, `low_stock_alert` |
| **InventoryService** | Inventory business logic | `adjust_stock`, `log_change`, `get_audit_trail` |
| **ImageUploadService** | Image upload handling | `upload`, `delete`, `validate` |
| **ReportGenerationService** | CSV report generation | `generate_inventory_report`, `format_csv`, `save_file` |
| **ReportController** | Trigger reports, download | `generate`, `download`, `list` |

---

## 5. Data Flow Diagrams

### 5.1 User Login Flow

```mermaid
sequenceDiagram
    actor User
    participant React
    participant RailsAPI
    participant AuthService
    participant DB
    participant Redis

    User->>React: Enter email & password
    React->>React: Validate form
    React->>RailsAPI: POST /api/v1/auth/login
    RailsAPI->>AuthService: authenticate(email, password)
    AuthService->>DB: Find user by email
    DB-->>AuthService: User record
    AuthService->>AuthService: Verify password (bcrypt)

    alt Valid credentials
        AuthService->>AuthService: Generate JWT token
        AuthService->>Redis: Store session
        Redis-->>AuthService: OK
        AuthService-->>RailsAPI: {token, user}
        RailsAPI-->>React: 200 OK {token, user}
        React->>React: Store token, update state
        React-->>User: Redirect to dashboard
    else Invalid credentials
        AuthService-->>RailsAPI: Authentication error
        RailsAPI-->>React: 401 Unauthorized
        React-->>User: Show error message
    end
```

### 5.2 Product Browsing Flow

```mermaid
sequenceDiagram
    actor User
    participant React
    participant RailsAPI
    participant ProductService
    participant Redis
    participant DB

    User->>React: Visit /products
    React->>RailsAPI: GET /api/v1/products?page=1&category=electronics
    RailsAPI->>ProductService: list(filters)
    ProductService->>Redis: Check cache
    Redis-->>ProductService: Cache MISS

    ProductService->>DB: Query products with filters
    DB-->>ProductService: Product records
    ProductService->>ProductService: Format response
    ProductService->>Redis: Store in cache (TTL 5 min)
    ProductService-->>RailsAPI: {products, total, page}
    RailsAPI-->>React: 200 OK {products, ...}
    React->>React: Render product list
    React-->>User: Display products
```

### 5.3 Checkout with Concurrency Handling

```mermaid
sequenceDiagram
    actor User
    participant React
    participant RailsAPI
    participant OrderService
    participant DB
    participant PaymentService

    User->>React: Click "Place Order"
    React->>RailsAPI: POST /api/v1/orders
    RailsAPI->>OrderService: execute(user, cart)

    OrderService->>DB: BEGIN TRANSACTION
    OrderService->>DB: SELECT * FROM products FOR UPDATE
    DB-->>OrderService: Locked product rows

    OrderService->>OrderService: Validate stock quantities

    alt Sufficient stock
        OrderService->>DB: Create order record
        OrderService->>DB: Create order_items
        OrderService->>DB: Deduct inventory
        OrderService->>DB: Create inventory_logs

        OrderService->>PaymentService: process(order)
        PaymentService-->>OrderService: Payment success
        OrderService->>DB: Create payment record

        OrderService->>DB: Clear cart items
        OrderService->>DB: COMMIT TRANSACTION

        OrderService-->>RailsAPI: {order}
        RailsAPI-->>React: 201 Created
        React-->>User: Order confirmation
    else Insufficient stock
        OrderService->>DB: ROLLBACK TRANSACTION
        OrderService-->>RailsAPI: InsufficientStockError
        RailsAPI-->>React: 422 Unprocessable Entity
        React-->>User: "Out of stock" error
    end
```

### 5.4 Admin Product Creation

```mermaid
sequenceDiagram
    actor Admin
    participant React
    participant LaravelAPI
    participant ProductService
    participant ImageService
    participant DB
    participant Storage

    Admin->>React: Fill product form, select images
    React->>LaravelAPI: POST /api/v1/admin/products (multipart)
    LaravelAPI->>ProductService: create(data)

    ProductService->>DB: BEGIN TRANSACTION

    ProductService->>ImageService: upload(images)
    ImageService->>Storage: Save images
    Storage-->>ImageService: URLs
    ImageService-->>ProductService: Image URLs

    ProductService->>DB: INSERT INTO products
    ProductService->>DB: INSERT INTO product_images
    ProductService->>DB: INSERT INTO inventory_logs

    ProductService->>DB: COMMIT TRANSACTION

    ProductService-->>LaravelAPI: {product}
    LaravelAPI-->>React: 201 Created
    React-->>Admin: Success message, redirect
```

### 5.5 Scheduled CSV Report Generation

```mermaid
sequenceDiagram
    participant Cron
    participant Scheduler
    participant ReportService
    participant DB
    participant FileSystem
    participant Email

    Cron->>Scheduler: Trigger at 9:00 AM
    Scheduler->>ReportService: generateInventoryReport()

    ReportService->>DB: Query all products with stock info
    DB-->>ReportService: Product data

    ReportService->>ReportService: Format as CSV
    ReportService->>FileSystem: Save inventory_report_2025-12-24.csv
    FileSystem-->>ReportService: File path

    ReportService->>ReportService: Log report generation

    alt Success
        ReportService->>Email: Send report to admins (optional)
        ReportService-->>Scheduler: Success
    else Failure
        ReportService->>Email: Send error alert
        ReportService-->>Scheduler: Failure (log error)
    end
```

---

## 6. Database Component Diagram

```mermaid
erDiagram
    USERS ||--o{ CARTS : has
    USERS ||--o{ ORDERS : places
    USERS ||--o{ PASSWORD_RESET_TOKENS : has

    PRODUCTS ||--o{ CART_ITEMS : "added to"
    PRODUCTS ||--o{ ORDER_ITEMS : "purchased in"
    PRODUCTS ||--o{ PRODUCT_IMAGES : has
    PRODUCTS }o--|| CATEGORIES : "belongs to"

    CARTS ||--o{ CART_ITEMS : contains

    ORDERS ||--o{ ORDER_ITEMS : contains
    ORDERS ||--|| PAYMENTS : has

    ADMINS ||--o{ PRODUCTS : manages
    ADMINS ||--o{ INVENTORY_LOGS : creates

    USERS {
        bigint id PK
        string name
        string email UK
        string password_digest
        text address
        datetime created_at
    }

    PRODUCTS {
        bigint id PK
        string name
        decimal price
        integer stock_quantity
        boolean is_active
        boolean is_suspended
        bigint category_id FK
        integer lock_version
    }

    CARTS {
        bigint id PK
        bigint user_id FK
        datetime created_at
    }

    CART_ITEMS {
        bigint id PK
        bigint cart_id FK
        bigint product_id FK
        integer quantity
    }

    ORDERS {
        bigint id PK
        bigint user_id FK
        string order_number UK
        decimal total_amount
        string status
        datetime created_at
    }

    ORDER_ITEMS {
        bigint id PK
        bigint order_id FK
        bigint product_id FK
        integer quantity
        decimal price_at_purchase
    }

    PAYMENTS {
        bigint id PK
        bigint order_id FK
        string payment_method
        decimal amount
        string status
        string transaction_id
    }

    ADMINS {
        bigint id PK
        string name
        string email UK
        string password_digest
    }

    INVENTORY_LOGS {
        bigint id PK
        bigint product_id FK
        bigint admin_id FK
        integer quantity_before
        integer quantity_after
        string action_type
        datetime created_at
    }

    CATEGORIES {
        bigint id PK
        string name
        text description
    }

    PRODUCT_IMAGES {
        bigint id PK
        bigint product_id FK
        string image_url
        integer display_order
    }

    PASSWORD_RESET_TOKENS {
        bigint id PK
        bigint user_id FK
        string token UK
        datetime expires_at
    }
```

---

## 7. Security Component Diagram

```mermaid
graph TB
    subgraph "Security Layers"
        subgraph "Transport Security"
            HTTPS[HTTPS/TLS<br/>Encrypted Transport]
            CORS[CORS Policy<br/>Origin Validation]
        end

        subgraph "Authentication"
            JWT[JWT Tokens<br/>Access & Refresh]
            BcryptHash[Bcrypt Password<br/>Hashing]
            SessionMgmt[Session Management<br/>Redis]
        end

        subgraph "Authorization"
            RoleCheck[Role-Based Access Control]
            RouteGuard[Protected Routes<br/>Middleware]
            TokenVerify[Token Verification]
        end

        subgraph "Input Validation"
            ParamValidation[Strong Parameters]
            TypeCheck[Type Validation]
            Sanitization[Input Sanitization]
            SQLInjection[SQL Injection Prevention<br/>ORM]
        end

        subgraph "Attack Prevention"
            RateLimit[Rate Limiting]
            CSRFToken[CSRF Tokens]
            XSSPrevention[XSS Prevention<br/>Output Encoding]
            SessionFixation[Session Fixation<br/>Prevention]
        end

        subgraph "Data Protection"
            EnvVars[Environment Variables<br/>Secrets]
            LogSanitization[Log Sanitization<br/>No Sensitive Data]
            SecureCookies[Secure Cookies<br/>HttpOnly, SameSite]
        end
    end

    Request[Incoming Request] --> HTTPS
    HTTPS --> CORS
    CORS --> RateLimit
    RateLimit --> TokenVerify
    TokenVerify --> RouteGuard
    RouteGuard --> ParamValidation
    ParamValidation --> Controller[Application Controllers]

    TokenVerify --> JWT
    JWT --> SessionMgmt
    RouteGuard --> RoleCheck

    ParamValidation --> TypeCheck
    TypeCheck --> Sanitization
    Sanitization --> SQLInjection

    CSRFToken --> Controller
    SecureCookies --> SessionMgmt

    style HTTPS fill:#90ee90
    style JWT fill:#ffd700
    style RateLimit fill:#ff6b6b
    style SQLInjection fill:#4169e1
```

---

## 8. Deployment Component Diagram

```mermaid
graph TB
    subgraph "Docker Compose Environment"
        subgraph "Frontend Container"
            Nginx[Nginx Web Server<br/>Port 80/443]
            ReactBuild[React Build<br/>Static Files]

            Nginx --> ReactBuild
        end

        subgraph "Rails Container"
            PumaServer[Puma Server<br/>Port 3000]
            RailsApp[Rails Application]

            PumaServer --> RailsApp
        end

        subgraph "Laravel Container"
            PHPFPMNginx[PHP-FPM + Nginx<br/>Port 8000]
            LaravelApp[Laravel Application]

            PHPFPMNginx --> LaravelApp
        end

        subgraph "Database Container"
            MySQLServer[MySQL 8.0<br/>Port 3306]
            MySQLData[(Data Volume)]

            MySQLServer --> MySQLData
        end

        subgraph "Cache Container"
            RedisServer[Redis 7+<br/>Port 6379]
            RedisData[(Data Volume)]

            RedisServer --> RedisData
        end

        subgraph "Background Jobs"
            SidekiqWorker[Sidekiq Worker]
            CronScheduler[Cron Scheduler]
        end

        Nginx -->|/api/user/*| PumaServer
        Nginx -->|/api/admin/*| PHPFPMNginx
        Nginx -->|/*| ReactBuild

        RailsApp --> MySQLServer
        LaravelApp --> MySQLServer

        RailsApp --> RedisServer
        LaravelApp --> RedisServer

        SidekiqWorker --> RedisServer
        SidekiqWorker --> MySQLServer

        CronScheduler --> LaravelApp
    end

    User[User Browser] -->|HTTPS| Nginx

    subgraph "External Services"
        SMTP[SMTP Server]
        S3[File Storage<br/>AWS S3]
    end

    SidekiqWorker --> SMTP
    LaravelApp --> S3

    style Nginx fill:#009639
    style MySQLServer fill:#4479a1
    style RedisServer fill:#dc382d
    style PumaServer fill:#cc0000
    style PHPFPMNginx fill:#ff2d20
```

---

## 9. Testing Component Diagram

```mermaid
graph TB
    subgraph "Testing Pyramid"
        subgraph "E2E Tests - Big"
            Cypress[Cypress/Playwright]
            E2ETests[End-to-End Test Suites]

            Cypress --> E2ETests
        end

        subgraph "Integration Tests - Medium"
            RailsIntegration[Rails API Tests<br/>Request Specs]
            LaravelIntegration[Laravel Feature Tests]
            ReactIntegration[React Integration Tests]

            RailsIntegration --> TestDB[(Test Database)]
            LaravelIntegration --> TestDB
        end

        subgraph "Unit Tests - Small"
            RailsUnit[Rails Unit Tests<br/>minitest]
            LaravelUnit[Laravel Unit Tests<br/>phpunit]
            ReactUnit[React Unit Tests<br/>Jest]

            subgraph "Rails Unit"
                ModelTests[Model Tests]
                ServiceTests[Service Tests]
                HelperTests[Helper Tests]
            end

            subgraph "Laravel Unit"
                EloquentTests[Eloquent Tests]
                ServiceTestsLaravel[Service Tests]
                HelperTestsLaravel[Helper Tests]
            end

            subgraph "React Unit"
                ComponentTests[Component Tests]
                HookTests[Hook Tests]
                UtilTests[Utility Tests]
            end

            RailsUnit --> ModelTests
            RailsUnit --> ServiceTests

            LaravelUnit --> EloquentTests
            LaravelUnit --> ServiceTestsLaravel

            ReactUnit --> ComponentTests
            ReactUnit --> HookTests
        end

        E2ETests --> RailsIntegration
        E2ETests --> LaravelIntegration
        E2ETests --> ReactIntegration

        RailsIntegration --> RailsUnit
        LaravelIntegration --> LaravelUnit
        ReactIntegration --> ReactUnit
    end

    subgraph "Test Infrastructure"
        Fixtures[Test Fixtures<br/>Factories]
        Mocks[Mocks & Stubs]
        TestHelpers[Test Helpers]
        Coverage[Coverage Reports<br/>SimpleCov, Istanbul]
    end

    ModelTests --> Fixtures
    ServiceTests --> Mocks
    E2ETests --> TestHelpers

    RailsUnit --> Coverage
    LaravelUnit --> Coverage
    ReactUnit --> Coverage

    style E2ETests fill:#ff6b6b
    style RailsIntegration fill:#ffd700
    style LaravelIntegration fill:#ffd700
    style RailsUnit fill:#90ee90
    style LaravelUnit fill:#90ee90
    style ReactUnit fill:#90ee90
```

---

## 10. Monitoring & Logging Components

```mermaid
graph TB
    subgraph "Application Layer"
        RailsAppLog[Rails Application]
        LaravelAppLog[Laravel Application]
        ReactAppLog[React Application]
    end

    subgraph "Logging Infrastructure"
        RailsLogger[Rails Logger<br/>Log Level: Info]
        LaravelLogger[Laravel Logger<br/>Monolog]
        BrowserConsole[Browser Console<br/>Dev Tools]

        RailsAppLog --> RailsLogger
        LaravelAppLog --> LaravelLogger
        ReactAppLog --> BrowserConsole
    end

    subgraph "Log Aggregation"
        LogFiles[Log Files<br/>logs/production.log]
        ErrorTracking[Error Tracking<br/>Sentry/Rollbar]
        StructuredLogs[Structured Logging<br/>JSON Format]

        RailsLogger --> LogFiles
        LaravelLogger --> LogFiles
        RailsLogger --> StructuredLogs
        LaravelLogger --> StructuredLogs

        LogFiles --> ErrorTracking
    end

    subgraph "Monitoring"
        HealthCheck[Health Check Endpoints<br/>/health]
        Metrics[Application Metrics<br/>Request Count, Latency]
        DBMonitoring[Database Monitoring<br/>Slow Queries]
        RedisMonitoring[Redis Monitoring<br/>Memory Usage]

        RailsAppLog --> HealthCheck
        LaravelAppLog --> HealthCheck
        RailsAppLog --> Metrics
        RailsLogger --> DBMonitoring
    end

    subgraph "Alerting"
        Alerts[Alert System]
        Email[Email Notifications]
        Slack[Slack Webhook]

        ErrorTracking --> Alerts
        HealthCheck --> Alerts
        Alerts --> Email
        Alerts --> Slack
    end

    style LogFiles fill:#ffd700
    style ErrorTracking fill:#ff6b6b
    style Metrics fill:#90ee90
    style Alerts fill:#ff6b6b
```

---

## 11. Component Interaction Matrix

| Component | Interacts With | Interaction Type | Purpose |
|-----------|----------------|------------------|---------|
| **React App** | Rails API | HTTP/REST | User feature API calls |
| **React App** | Laravel API | HTTP/REST | Admin feature API calls |
| **Rails API** | MySQL | TCP/SQL | User data persistence |
| **Laravel API** | MySQL | TCP/SQL | Admin data persistence |
| **Rails API** | Redis | TCP/Redis Protocol | Session storage, caching |
| **Laravel API** | Redis | TCP/Redis Protocol | Session storage, caching |
| **Rails API** | Sidekiq | Redis Queue | Background job processing |
| **Laravel API** | Task Scheduler | Cron | Scheduled tasks |
| **Sidekiq** | SMTP | SMTP Protocol | Email sending |
| **Laravel** | File Storage | S3 API / File System | Image uploads |
| **All Services** | Nginx | HTTP Reverse Proxy | Request routing |

---

## 12. Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 18+ | SPA framework |
| | React Router | 6+ | Client-side routing |
| | Axios | 1.6+ | HTTP client |
| | Context API | Built-in | State management |
| **User Backend** | Ruby on Rails | 7+ | API framework |
| | Puma | 6+ | Web server |
| | ActiveRecord | Built-in | ORM |
| | BCrypt | 3.1+ | Password hashing |
| | JWT | 2.7+ | Token authentication |
| | Sidekiq | 7+ | Background jobs |
| **Admin Backend** | Laravel | 10+ | API framework |
| | PHP-FPM | 8.2+ | PHP processor |
| | Eloquent | Built-in | ORM |
| | Laravel Scheduler | Built-in | Cron jobs |
| **Database** | MySQL | 8.0+ | Relational database |
| **Cache/Session** | Redis | 7+ | In-memory store |
| **Web Server** | Nginx | 1.24+ | Reverse proxy, static files |
| **Containerization** | Docker | 24+ | Containerization |
| | docker-compose | 2.20+ | Multi-container orchestration |
| **Testing** | minitest | Built-in Rails | Rails unit tests |
| | phpunit | 10+ | Laravel unit tests |
| | Jest | 29+ | React unit tests |
| | Cypress | 13+ | E2E tests |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-24 | Development Team | Initial component diagram |

---

**Note**: These diagrams use Mermaid syntax and can be rendered in GitHub, GitLab, or any Markdown viewer that supports Mermaid. For best visualization, use tools like [Mermaid Live Editor](https://mermaid.live/).
