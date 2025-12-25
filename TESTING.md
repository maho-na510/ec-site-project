# Testing Guide

This document explains how to test the EC Site application.

## Quick Start

### 1. Start Docker

Make sure Docker Desktop is running on your Mac.

### 2. Setup and Start Services

```bash
# First time only - setup everything
make setup

# Start all services
make start
```

### 3. Run Tests

```bash
# Run all tests
make test

# Or run specific test suites
make test-rails      # Rails API tests only
make test-laravel    # Laravel API tests only
make test-frontend   # React tests only
```

## Manual Testing with curl

### Health Check

```bash
curl http://localhost:3001/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-24T13:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": {"status": "up"},
    "redis": {"status": "up"}
  }
}
```

### User Registration

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "name": "Test User",
      "email": "test@example.com",
      "password": "password123",
      "password_confirmation": "password123",
      "address": "123 Test St"
    }
  }'
```

### User Login

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the `access_token` from the response for authenticated requests.

### Get Products

```bash
curl http://localhost:3001/api/v1/products
```

### Get User Profile (Authenticated)

```bash
curl http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Add Item to Cart

```bash
curl -X POST http://localhost:3001/api/v1/cart/items \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "quantity": 2
  }'
```

### View Cart

```bash
curl http://localhost:3001/api/v1/cart \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create Order (Checkout)

```bash
curl -X POST http://localhost:3001/api/v1/orders \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shipping_address": "123 Test St, Test City, TS 12345",
    "payment_method": "credit_card"
  }'
```

## Automated Tests

### Rails Tests (Minitest)

The Rails API uses Minitest for testing. Tests are located in `rails-api/test/`.

**Test Coverage:**
- Controller tests: `rails-api/test/controllers/api/v1/`
- Model tests: `rails-api/test/models/`
- Service tests: `rails-api/test/services/`
- Integration tests: `rails-api/test/integration/`

**Run Rails tests:**
```bash
# Inside the Rails container
docker-compose run --rm rails-api bundle exec rails test

# With coverage report
docker-compose run --rm rails-api bundle exec rails test

# Run specific test file
docker-compose run --rm rails-api bundle exec rails test test/controllers/api/v1/auth_controller_test.rb

# Run specific test
docker-compose run --rm rails-api bundle exec rails test test/controllers/api/v1/auth_controller_test.rb:10
```

### Laravel Tests (PHPUnit)

The Laravel API uses PHPUnit for testing.

```bash
# Run all Laravel tests
docker-compose run --rm laravel-api php artisan test

# With coverage
docker-compose run --rm laravel-api php artisan test --coverage
```

### React Tests (Jest + React Testing Library)

```bash
# Run React tests
docker-compose run --rm frontend npm test

# Run with coverage
docker-compose run --rm frontend npm test -- --coverage
```

### E2E Tests (Cypress)

```bash
# Open Cypress UI
docker-compose run --rm frontend npm run cypress:open

# Run headless
docker-compose run --rm frontend npm run cypress:run
```

## Testing Checklist

### Authentication Flow
- [ ] User can register
- [ ] User can login
- [ ] User receives JWT token
- [ ] Token is validated on protected routes
- [ ] User can logout
- [ ] Token can be refreshed

### Product Browsing
- [ ] Public can view products without authentication
- [ ] Products can be filtered by category
- [ ] Products can be searched by keyword
- [ ] Product details include images
- [ ] Pagination works correctly

### Shopping Cart
- [ ] User can add items to cart
- [ ] User can update item quantities
- [ ] User can remove items from cart
- [ ] Stock validation prevents overselling
- [ ] Cart total is calculated correctly

### Order Processing
- [ ] User can create order from cart
- [ ] Stock is deducted on order creation
- [ ] Pessimistic locking prevents concurrent overselling
- [ ] Order cannot be created with empty cart
- [ ] Shipping address is required
- [ ] User can view order history
- [ ] User can cancel pending orders
- [ ] Completed orders cannot be cancelled

### Password Reset
- [ ] User can request password reset
- [ ] Reset token is stored in Redis
- [ ] Reset token expires after 1 hour
- [ ] User can reset password with valid token
- [ ] Invalid token is rejected

### Admin Functions (Laravel)
- [ ] Admin can view all products
- [ ] Admin can create/update/delete products
- [ ] Admin can adjust inventory
- [ ] Admin can generate CSV reports
- [ ] Daily reports are scheduled at 9:00 AM

## Test Coverage Goals

According to the assignment requirements:

- **Overall Coverage: 80%+**
- **Critical Paths (checkout, payment): 95%+**
- **Services and Models: 85%+**
- **Controllers: 75%+**

## Viewing Test Results

### Check Coverage Reports

After running tests with coverage:

```bash
# Rails coverage (SimpleCov)
open rails-api/coverage/index.html

# Laravel coverage
open laravel-api/coverage/index.html

# React coverage
open frontend/coverage/lcov-report/index.html
```

## Common Test Issues

### Database Connection Errors

```bash
# Reset test database
docker-compose run --rm rails-api bundle exec rails db:test:prepare
docker-compose run --rm laravel-api php artisan migrate:fresh --env=testing
```

### Redis Connection Errors

```bash
# Restart Redis
docker-compose restart redis
```

### Fixture Loading Errors

Make sure all fixtures are valid YAML and reference existing associations.

## Best Practices

1. **Write tests before implementation** (TDD approach)
2. **Test edge cases** (empty input, invalid data, boundary conditions)
3. **Test error paths** (network errors, database errors, validation errors)
4. **Use fixtures** for consistent test data
5. **Mock external services** (payment gateways, email services)
6. **Test concurrency** especially for checkout flow
7. **Keep tests fast** by using transactions and avoiding unnecessary setup

## Integration with CI/CD

The test suite can be integrated with CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: |
    docker-compose up -d
    docker-compose run rails-api bundle exec rails test
    docker-compose run laravel-api php artisan test
    docker-compose run frontend npm test -- --coverage
```
