# EC Site - Setup Guide

This guide will help you set up and run the EC Site application from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** >= 24.0
- **docker-compose** >= 2.20
- **Git**

That's it! All other dependencies (Ruby, PHP, Node.js, MySQL, Redis) run inside Docker containers.

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ec-site-project
```

### 2. Environment Configuration

Copy the environment template:

```bash
cp .env.example .env
```

The default values are configured for development. You can modify them if needed.

### 3. Initial Setup

Run the setup command (this may take 5-10 minutes on first run):

```bash
make setup
```

This command will:
- Build all Docker containers
- Install Rails and Laravel dependencies
- Create and migrate databases
- Install frontend dependencies
- Seed the database with sample data

### 4. Start the Application

```bash
make start
```

### 5. Access the Application

Open your browser and navigate to:

- **User Interface**: http://localhost:5173
- **Admin Interface**: http://localhost:5173/admin
- **Rails API**: http://localhost:3001/api/v1
- **Laravel API**: http://localhost:8000/api/v1/admin

## Default Credentials

### User Account
- Email: `user@example.com`
- Password: `password123`

### Admin Account
- Email: `admin@example.com`
- Password: `admin123`

## Common Commands

### Container Management

```bash
# Start all containers
make start

# Stop all containers
make stop

# Restart all containers
make restart

# View logs
make logs

# Clean up (stop and remove volumes)
make clean
```

### Database Management

```bash
# Run migrations
make migrate

# Seed database with sample data
make seed

# Reset database (drop, create, migrate, seed)
make db-reset
```

### Testing

```bash
# Run all tests
make test

# Run specific test suites
make test-rails      # Rails tests only
make test-laravel    # Laravel tests only
make test-frontend   # React tests only
make test-e2e        # End-to-end tests only

# Generate coverage reports
make coverage
```

### Shell Access

```bash
# Rails console
make shell-rails

# Laravel shell
make shell-laravel

# Frontend shell
make shell-frontend
```

## Troubleshooting

### Port Already in Use

If you see errors about ports already in use:

```bash
# Check what's using the ports
lsof -i :3306  # MySQL
lsof -i :6379  # Redis
lsof -i :3001  # Rails
lsof -i :8000  # Laravel
lsof -i :5173  # Frontend

# Kill the process or change ports in docker-compose.yml
```

### Database Connection Errors

```bash
# Ensure MySQL is healthy
docker-compose ps

# If MySQL is unhealthy, try recreating it
docker-compose down
docker volume rm ec-site-project_mysql_data
make setup
```

### Permission Errors

If you encounter permission errors with Docker:

```bash
# Fix ownership
sudo chown -R $USER:$USER .

# Or run with sudo (not recommended)
sudo make setup
```

### Redis Connection Errors

```bash
# Restart Redis
docker-compose restart redis

# Check Redis logs
docker-compose logs redis
```

## Development Workflow

### Making Code Changes

All code changes are automatically reflected in the running containers:

- **Rails**: Auto-reloads on file changes
- **Laravel**: Auto-reloads on file changes
- **React**: Hot module replacement (HMR) - instant updates

### Running Migrations

After creating a new migration:

```bash
# Rails
docker-compose run --rm rails-api bundle exec rails db:migrate

# Laravel
docker-compose run --rm laravel-api php artisan migrate
```

### Installing New Dependencies

```bash
# Rails (Gemfile)
docker-compose run --rm rails-api bundle install

# Laravel (composer.json)
docker-compose run --rm laravel-api composer install

# Frontend (package.json)
docker-compose run --rm frontend npm install

# Rebuild containers if needed
make build
```

## Project Structure

```
ec-site-project/
├── docs/                   # Documentation
│   ├── ER_Diagram.md
│   ├── Requirements_Definition.md
│   ├── System_Design.md
│   └── Component_Diagram.md
├── rails-api/             # Rails backend (User API)
│   ├── app/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── services/
│   ├── config/
│   ├── db/
│   └── test/
├── laravel-api/           # Laravel backend (Admin API)
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   └── Services/
│   ├── database/
│   └── tests/
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   └── services/
│   └── tests/
├── docker-compose.yml     # Docker orchestration
├── Makefile              # Convenience commands
└── README.md             # Project overview
```

## Testing

The project follows a comprehensive testing strategy:

### Small Tests (Unit)
- **Rails**: `minitest` for models and services
- **Laravel**: `phpunit` for models and services
- **React**: `Jest` for components and hooks

### Medium Tests (Integration)
- API endpoint testing
- Service integration tests

### Big Tests (E2E)
- **Cypress** for complete user workflows
- Critical paths: registration → login → browse → checkout

### Test Coverage

Target coverage: **80%+**
- Critical paths (checkout, payment): **95%+**
- Services and models: **85%+**
- Controllers: **75%+**

## Performance Considerations

The application implements several performance optimizations:

1. **Database Indexing**: Foreign keys and common query patterns are indexed
2. **Redis Caching**: Product lists cached with 5-minute TTL
3. **Code Splitting**: React lazy loading for admin components
4. **Image Optimization**: Lazy loading and responsive images
5. **Connection Pooling**: Database connections pooled for efficiency

## Security Features

1. **JWT Authentication**: Short-lived access tokens with refresh rotation
2. **HttpOnly Cookies**: Secure session storage
3. **CORS Protection**: Restricted to frontend origin
4. **Rate Limiting**: API endpoint protection
5. **Password Security**: Bcrypt with cost factor 12
6. **SQL Injection Prevention**: ORM with parameterized queries
7. **XSS Prevention**: React auto-escaping and CSP headers

## Deployment

For production deployment:

1. Update environment variables in `.env`
2. Set `RAILS_ENV=production` and `APP_ENV=production`
3. Generate new `JWT_SECRET` and `APP_KEY`
4. Configure proper database credentials
5. Enable HTTPS with SSL certificates
6. Set up database backups
7. Configure monitoring and logging

Recommended platforms: AWS ECS, Google Cloud Run, or Kubernetes.

## Getting Help

- Check the [main README](README.md) for project overview
- Review [System Design](docs/System_Design.md) for architecture details
- Check [Requirements](docs/Requirements_Definition.md) for features

## License

This project is developed as an educational assignment.
