# Getting Started Guide

Welcome! This guide will help you set up and run the EC Site application step by step.

## Prerequisites

Make sure you have:
- ✅ **Docker Desktop** installed and running
- ✅ **Git** installed
- ✅ A terminal/command line

## Step-by-Step Setup

### Step 1: Start Docker Desktop

Open Docker Desktop on your Mac and wait for it to fully start.

### Step 2: Clone and Navigate

If you haven't already:
```bash
cd /Users/ravensmaho/ec-site-project
```

### Step 3: Environment Setup

Copy the environment file (first time only):
```bash
cp .env.example .env
```

The default values are already configured for development.

### Step 4: Build and Setup Everything

Run the automated setup (this takes 5-10 minutes first time):
```bash
make setup
```

This command will:
- ✅ Build all Docker containers
- ✅ Install Rails dependencies
- ✅ Install Laravel dependencies
- ✅ Install React dependencies
- ✅ Create databases
- ✅ Run migrations
- ✅ Seed sample data

You'll see output like:
```
Building containers...
Creating databases...
🌱 Starting database seed...
✅ Created 3 users
✅ Created 7 categories
✅ Created 20 products
🎉 Database seeding completed successfully!
```

### Step 5: Start All Services

```bash
make start
```

This starts:
- 🗄️ MySQL database (localhost:3306)
- 🔴 Redis cache (localhost:6379)
- 🚂 Rails API (localhost:3001)
- 🐘 Laravel API (localhost:8000)
- ⚛️ React Frontend (localhost:5173)

Wait until you see:
```
rails-api    | * Listening on http://0.0.0.0:3000
laravel-api  | Server running on [http://0.0.0.0:8000]
frontend     | Local: http://localhost:5173/
```

### Step 6: Test Your Setup

Open your browser and visit:

**Frontend (React):**
- User Interface: http://localhost:5173
- Admin Interface: http://localhost:5173/admin

**APIs:**
- Rails Health Check: http://localhost:3001/api/v1/health
- Laravel Health Check: http://localhost:8000/api/health

You should see:
```json
{
  "status": "healthy",
  "services": {
    "database": {"status": "up"},
    "redis": {"status": "up"}
  }
}
```

## Test Accounts

### Regular Users (Rails API)

**User Account 1:**
- Email: `user@example.com`
- Password: `password123`

**User Account 2:**
- Email: `jane@example.com`
- Password: `password123`

**Test User (has items in cart):**
- Email: `test@example.com`
- Password: `password123`

### Admin Accounts (Laravel API)

**Main Admin:**
- Email: `admin@example.com`
- Password: `admin123`

**Manager:**
- Email: `manager@example.com`
- Password: `manager123`

## Quick Test with curl

### 1. Check if APIs are running

```bash
# Rails API
curl http://localhost:3001/api/v1/health

# Laravel API
curl http://localhost:8000/api/health
```

### 2. Get Products (No auth needed)

```bash
curl http://localhost:3001/api/v1/products
```

You should see a list of 20 products!

### 3. Login as User

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Save the `access_token` from the response.

### 4. Get Your Profile (Auth required)

```bash
curl http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

Replace `YOUR_ACCESS_TOKEN_HERE` with the token from step 3.

## Common Commands

### Container Management

```bash
# Start all services
make start

# Stop all services
make stop

# Restart all services
make restart

# View logs
make logs

# View logs for specific service
docker compose logs -f rails-api
docker compose logs -f laravel-api
docker compose logs -f frontend
```

### Database Management

```bash
# Run migrations
make migrate

# Seed database with fresh data
make seed

# Reset database (drop, create, migrate, seed)
make db-reset
```

### Access Container Shells

```bash
# Rails console
make shell-rails

# Laravel shell
make shell-laravel

# Frontend shell
make shell-frontend
```

### Running Tests

```bash
# Run all tests
make test

# Run specific test suites
make test-rails
make test-laravel
make test-frontend
```

## Sample Data Included

After seeding, you'll have:

- **3 Users** with sample profiles
- **7 Categories**: Electronics, Computers, Audio, Clothing, Books, Sports, Home
- **20 Products** across all categories with:
  - Realistic names and descriptions
  - Various prices ($24.99 - $1299.99)
  - Different stock levels (0 - 500 items)
  - Multiple images per product
- **2 Sample Orders** (completed and pending)
- **1 Active Shopping Cart** (for test@example.com)
- **2 Admin Accounts** with different roles

## What You Can Do Now

### As a User:
1. ✅ Browse products by category
2. ✅ Search for products
3. ✅ Add items to cart
4. ✅ Update cart quantities
5. ✅ Checkout and create orders
6. ✅ View order history
7. ✅ Cancel pending orders

### As an Admin:
1. ✅ View all products
2. ✅ Create/edit/delete products
3. ✅ Manage inventory
4. ✅ Generate reports
5. ✅ View all orders

## Troubleshooting

### Port Already in Use

If you see "port already in use" errors:
```bash
# Stop all containers
make stop

# Check what's using the port
lsof -i :3001  # Rails
lsof -i :8000  # Laravel
lsof -i :5173  # Frontend

# Kill the process or restart Docker
```

### Database Connection Error

```bash
# Check if MySQL is running
docker compose ps

# Restart MySQL
docker compose restart mysql

# Reset database
make db-reset
```

### Redis Connection Error

```bash
# Restart Redis
docker compose restart redis
```

### Can't See Products

```bash
# Re-seed the database
make seed
```

## Next Steps

1. **Explore the Frontend** - Open http://localhost:5173 in your browser
2. **Test the Shopping Flow** - Login, browse products, add to cart, checkout
3. **Try the Admin Panel** - Login with admin credentials
4. **Run the Tests** - `make test-rails` to verify everything works
5. **Check the Documentation**:
   - [TESTING.md](TESTING.md) - How to test the application
   - [SETUP.md](SETUP.md) - Detailed setup instructions
   - [README.md](README.md) - Project overview

## Need Help?

- Check logs: `make logs`
- Restart everything: `make restart`
- Clean slate: `make clean` then `make setup`

## Development Workflow

When making code changes:

1. **Edit code** - Changes auto-reload in containers
2. **Test changes** - Run relevant tests
3. **Commit changes** - Git add/commit/push
4. **Verify** - Check that everything still works

Happy coding! 🚀
