# EC Site - E-Commerce Platform

A full-stack e-commerce application built with React, Rails, Laravel, MySQL, and Redis, featuring separate user and admin interfaces with comprehensive security and testing.

## Project Overview

This project is a modern e-commerce platform similar to Amazon, with the following key features:

**User Features**:
- User registration and authentication
- Product browsing with filtering and search
- Shopping cart management
- Checkout and payment processing (mock)
- Order history

**Admin Features**:
- Admin authentication
- Product management (CRUD operations)
- Inventory management with audit logging
- Category management
- Automated daily CSV inventory reports

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18+ | Single-page application for user and admin interfaces |
| **User Backend** | Ruby on Rails 7+ | RESTful API for user-facing features |
| **Admin Backend** | Laravel 10+ | RESTful API for administrative features |
| **Database** | MySQL 8.0+ | Persistent data storage |
| **Cache/Session** | Redis 7+ | Session management and caching |
| **Containerization** | Docker & docker-compose | Development and deployment environment |
| **Testing** | minitest, phpunit, Jest, Cypress | Comprehensive test coverage |

## Architecture

This application follows a **microservices-oriented architecture** with clear separation between user and admin services:

```
React SPA (Frontend)
    ↓
Nginx (Reverse Proxy)
    ↓ /api/user/*          ↓ /api/admin/*
Rails API               Laravel API
    ↓                       ↓
    MySQL Database    +    Redis Cache
```

**Key architectural decisions**:
- Separate backends for security isolation and independent scaling
- Shared MySQL database for data consistency
- Redis for session storage (not file-based) for scalability
- Service layer pattern for maintainable business logic
- JWT token-based authentication with HttpOnly cookies

## Project Structure

```
ec-site-project/
├── docs/                           # Documentation
│   ├── ER_Diagram.md               # Entity-relationship diagram
│   ├── Requirements_Definition.md  # Detailed requirements
│   ├── System_Design.md            # Architecture and design decisions
│   └── Component_Diagram.md        # Component diagrams and interactions
├── frontend/                       # React application
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Page components
│   │   ├── contexts/              # React Context for state management
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── services/              # API service layer
│   │   └── utils/                 # Utility functions
│   └── package.json
├── rails-api/                      # Rails backend (user API)
│   ├── app/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── services/              # Business logic layer
│   │   └── jobs/                  # Background jobs
│   ├── config/
│   ├── db/
│   │   ├── migrate/
│   │   └── seeds.rb
│   ├── test/                      # minitest tests
│   └── Gemfile
├── laravel-api/                    # Laravel backend (admin API)
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   └── Services/              # Business logic layer
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── tests/                     # phpunit tests
│   └── composer.json
├── docker-compose.yml              # Multi-container orchestration
├── Makefile                        # Container management commands
└── README.md                       # This file
```

## Documentation

Comprehensive documentation is available in the [docs](docs/) directory:

1. **[ER Diagram](docs/ER_Diagram.md)**: Database schema and entity relationships
2. **[Requirements Definition](docs/Requirements_Definition.md)**: Detailed functional and non-functional requirements
3. **[System Design](docs/System_Design.md)**: Architecture selection rationale, design principles, and implementation details
4. **[Component Diagram](docs/Component_Diagram.md)**: Visual component diagrams and data flow

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

2. **Initial setup** (creates containers, databases, and runs migrations):
   ```bash
   make setup
   ```

3. **Start the application**:
   ```bash
   make start
   ```

4. **Access the application**:
   - Frontend (User): http://localhost:3000
   - Frontend (Admin): http://localhost:3000/admin
   - Rails API: http://localhost:3001/api/v1
   - Laravel API: http://localhost:8000/api/v1/admin

### Makefile Commands

| Command | Description |
|---------|-------------|
| `make setup` | Initial setup: build containers, create databases, run migrations, seed data |
| `make start` | Start all containers in detached mode |
| `make stop` | Stop all running containers |
| `make restart` | Restart all containers |
| `make test` | Run all tests (Rails, Laravel, React, E2E) |
| `make migrate` | Run database migrations for both backends |
| `make seed` | Seed database with sample data |
| `make logs` | View logs from all containers |
| `make clean` | Stop containers and remove volumes (clean slate) |
| `make shell-rails` | Open bash shell in Rails container |
| `make shell-laravel` | Open bash shell in Laravel container |

## Testing

The project implements a comprehensive testing strategy following the Small/Medium/Big test pyramid:

### Test Levels

**Small Tests (Unit)**:
- Rails: `minitest` for models and services
- Laravel: `phpunit` for models and services
- React: `Jest` for components and hooks

**Medium Tests (Integration)**:
- API endpoint testing with real test database
- Service integration tests

**Big Tests (E2E)**:
- `Cypress` for complete user workflows
- Critical paths: registration → login → browse → checkout

### Running Tests

```bash
# Run all tests
make test

# Run specific test suites
docker-compose run rails-api bundle exec rails test
docker-compose run laravel-api php artisan test
docker-compose run frontend npm test
docker-compose run frontend npm run test:e2e
```

### Test Coverage

Target coverage: **80%+**
- Critical paths (checkout, payment): **95%+**
- Services and models: **85%+**
- Controllers: **75%+**

## Key Features Implementation

### Security

- **Authentication**: JWT tokens with refresh token rotation
- **Session Management**: Redis-based sessions with HttpOnly cookies
- **CORS**: Restricted to frontend origin
- **Rate Limiting**: API endpoint protection
- **Password Security**: Bcrypt with cost factor 12
- **Input Validation**: Strong parameters and sanitization
- **SQL Injection Prevention**: ORM with parameterized queries
- **XSS Prevention**: React auto-escaping and CSP headers

### Concurrency Handling

Checkout process uses database transactions with row-level locking to prevent overselling:

```ruby
ActiveRecord::Base.transaction do
  product = Product.lock("FOR UPDATE").find(product_id)
  # Validate stock, create order, deduct inventory
end
```

### Performance Optimization

- **Database**: Indexed foreign keys, composite indexes for common queries
- **Caching**: Redis caching for product lists (5 min TTL)
- **Frontend**: Code splitting, lazy loading, image optimization
- **API**: Response compression, pagination, field selection

### Scheduled Tasks

Daily inventory CSV report generation at 9:00 AM using Laravel Task Scheduler:

```php
$schedule->call(function () {
    $service = new ReportGenerationService();
    $service->generateInventoryReport();
})->dailyAt('09:00');
```

## Design Principles

This project follows industry best practices:

### SOLID Principles

- **Single Responsibility**: Controllers handle HTTP, services handle business logic, models handle data
- **Open/Closed**: Payment processors extensible without modifying core code
- **Liskov Substitution**: All payment methods interchangeable
- **Interface Segregation**: Granular service classes
- **Dependency Inversion**: Services use dependency injection

### Additional Principles

- **DRY**: Reusable components, shared validation logic
- **KISS**: Simple, readable code over clever solutions
- **Convention over Configuration**: Follow Rails and Laravel conventions
- **Test-Driven Development**: Comprehensive test coverage

## API Documentation

### User API (Rails)

Base URL: `http://localhost:3001/api/v1`

**Authentication**:
- POST `/auth/register` - User registration
- POST `/auth/login` - User login
- POST `/auth/logout` - User logout
- POST `/auth/refresh` - Refresh access token

**Products**:
- GET `/products` - List products (pagination, filtering, search)
- GET `/products/:id` - Product details

**Cart**:
- GET `/cart` - Get user's cart
- POST `/cart/items` - Add item to cart
- PUT `/cart/items/:id` - Update quantity
- DELETE `/cart/items/:id` - Remove item

**Orders**:
- POST `/orders` - Create order (checkout)
- GET `/orders` - Order history
- GET `/orders/:id` - Order details

### Admin API (Laravel)

Base URL: `http://localhost:8000/api/v1/admin`

**Authentication**:
- POST `/auth/login` - Admin login
- POST `/auth/logout` - Admin logout

**Products**:
- GET `/products` - List products
- POST `/products` - Create product
- PUT `/products/:id` - Update product
- DELETE `/products/:id` - Delete product
- POST `/products/:id/suspend` - Toggle suspension

**Inventory**:
- POST `/inventory/adjust` - Adjust stock
- GET `/inventory/logs` - Inventory audit trail

**Reports**:
- POST `/reports/generate` - Generate CSV report
- GET `/reports` - List reports
- GET `/reports/:id/download` - Download report

## Environment Variables

Create `.env` files in each service directory:

**Rails (.env)**:
```bash
DATABASE_URL=mysql://user:password@mysql:3306/ec_site_development
REDIS_URL=redis://redis:6379/0
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

**Laravel (.env)**:
```bash
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=ec_site_development
DB_USERNAME=user
DB_PASSWORD=password

REDIS_HOST=redis
REDIS_PORT=6379

JWT_SECRET=your-secret-key
```

**React (.env)**:
```bash
VITE_USER_API_URL=http://localhost:3001/api/v1
VITE_ADMIN_API_URL=http://localhost:8000/api/v1/admin
```

## Deployment

### Development

Use docker-compose for local development:

```bash
make start
```

### Production

For production deployment:

1. Build optimized images
2. Use environment-specific configurations
3. Enable HTTPS with SSL certificates
4. Configure database backups
5. Set up monitoring and logging

Recommended platforms: AWS ECS, Google Cloud Run, or Kubernetes.

## Contributing

### Code Style

- **Rails**: Follow Ruby Style Guide and Rails conventions
- **Laravel**: Follow PSR-12 coding standard
- **React**: Use ESLint with Airbnb style guide
- **Database**: Use snake_case for table and column names

### Git Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Write tests first (TDD)
3. Implement feature
4. Ensure all tests pass: `make test`
5. Commit with descriptive message
6. Create pull request

### Pull Request Requirements

- All tests passing
- Code coverage maintained (80%+)
- Documentation updated
- No merge conflicts

## Troubleshooting

### Common Issues

**Database connection error**:
```bash
# Ensure MySQL container is running
docker-compose ps
# Recreate database
make migrate
```

**Port already in use**:
```bash
# Change ports in docker-compose.yml
# Or stop conflicting services
```

**Redis connection error**:
```bash
# Restart Redis container
docker-compose restart redis
```

### Logs

View application logs:
```bash
# All services
make logs

# Specific service
docker-compose logs -f rails-api
docker-compose logs -f laravel-api
docker-compose logs -f frontend
```

## License

This project is developed as an educational assignment.

## Contact

For questions or issues, please open a GitHub issue.

---

## Next Steps

Now that documentation is complete, you can proceed with:

1. **Project Setup**: Create Docker configuration and folder structure
2. **Backend Development**: Implement Rails and Laravel APIs
3. **Frontend Development**: Build React components
4. **Testing**: Write comprehensive tests
5. **Deployment**: Set up production environment

Refer to the [System Design Document](docs/System_Design.md) for detailed implementation guidance.

---

**Last Updated**: 2025-12-24
