.PHONY: help setup build start stop restart logs clean test migrate seed shell-rails shell-laravel shell-frontend db-reset

# Default target
help:
	@echo "EC Site - Makefile Commands"
	@echo "============================"
	@echo ""
	@echo "Setup & Build:"
	@echo "  make setup          - Initial setup (build, create DB, migrate, seed)"
	@echo "  make build          - Build all Docker containers"
	@echo ""
	@echo "Container Management:"
	@echo "  make start          - Start all containers"
	@echo "  make stop           - Stop all containers"
	@echo "  make restart        - Restart all containers"
	@echo "  make logs           - View logs from all containers"
	@echo "  make clean          - Stop containers and remove volumes"
	@echo ""
	@echo "Database:"
	@echo "  make migrate        - Run database migrations"
	@echo "  make seed           - Seed database with sample data"
	@echo "  make db-reset       - Reset database (drop, create, migrate, seed)"
	@echo ""
	@echo "Testing:"
	@echo "  make test           - Run all tests (Rails, Laravel, React, E2E)"
	@echo "  make test-rails     - Run Rails tests only"
	@echo "  make test-laravel   - Run Laravel tests only"
	@echo "  make test-frontend  - Run React tests only"
	@echo "  make test-e2e       - Run E2E tests only"
	@echo "  make coverage       - Generate test coverage reports"
	@echo ""
	@echo "Shell Access:"
	@echo "  make shell-rails    - Open bash shell in Rails container"
	@echo "  make shell-laravel  - Open bash shell in Laravel container"
	@echo "  make shell-frontend - Open bash shell in Frontend container"
	@echo ""

# Initial setup - run this once when first cloning the project
setup:
	@echo "Setting up EC Site project..."
	@echo "Building Docker containers..."
	docker compose build
	@echo "Creating database..."
	docker compose up -d mysql redis
	@echo "Waiting for MySQL to be ready..."
	@sleep 10
	@echo "Running Rails migrations..."
	docker compose run --rm rails-api bundle install
	docker compose run --rm rails-api bundle exec rake db:create db:migrate
	@echo "Running Laravel migrations..."
	docker compose run --rm laravel-api composer install
	docker compose run --rm laravel-api php artisan migrate
	@echo "Installing frontend dependencies..."
	docker compose run --rm frontend npm install
	@echo "Seeding database..."
	$(MAKE) seed
	@echo "Setup complete! Run 'make start' to start the application."

# Build all containers
build:
	docker compose build

# Start all containers
start:
	@echo "Starting all containers..."
	docker compose up -d
	@echo "Application started!"
	@echo "  Frontend: http://localhost:5173"
	@echo "  Rails API: http://localhost:3001/api/v1"
	@echo "  Laravel API: http://localhost:8000/api/v1/admin"

# Stop all containers
stop:
	@echo "Stopping all containers..."
	docker compose down

# Restart all containers
restart:
	@echo "Restarting all containers..."
	$(MAKE) stop
	$(MAKE) start

# View logs
logs:
	docker compose logs -f

# Clean up containers and volumes
clean:
	@echo "Stopping containers and removing volumes..."
	docker compose down -v
	@echo "Cleaning up Docker system..."
	docker system prune -f
	@echo "Cleanup complete!"

# Run all tests
test:
	@echo "Running all tests..."
	@echo "================================"
	@echo "Running Rails tests..."
	docker compose run --rm rails-api bundle exec rails test
	@echo "================================"
	@echo "Running Laravel tests..."
	docker compose run --rm laravel-api php artisan test
	@echo "================================"
	@echo "Running Frontend tests..."
	docker compose run --rm frontend npm test -- --run
	@echo "================================"
	@echo "All tests complete!"

# Run Rails tests only
test-rails:
	@echo "Running Rails tests..."
	docker compose run --rm rails-api bundle exec rails test

# Run Laravel tests only
test-laravel:
	@echo "Running Laravel tests..."
	docker compose run --rm laravel-api php artisan test

# Run Frontend tests only
test-frontend:
	@echo "Running Frontend tests..."
	docker compose run --rm frontend npm test -- --run

# Run E2E tests
test-e2e:
	@echo "Running E2E tests..."
	docker compose up -d
	@echo "Waiting for services to be ready..."
	@sleep 5
	docker compose run --rm frontend npm run test:e2e

# Generate test coverage reports
coverage:
	@echo "Generating test coverage reports..."
	@echo "Rails coverage..."
	docker compose run --rm rails-api bundle exec rails test
	@echo "Laravel coverage..."
	docker compose run --rm laravel-api php artisan test --coverage
	@echo "Frontend coverage..."
	docker compose run --rm frontend npm test -- --coverage
	@echo "Coverage reports generated!"

# Run database migrations
migrate:
	@echo "Running database migrations..."
	docker compose run --rm rails-api bundle exec rake db:migrate
	docker compose run --rm laravel-api php artisan migrate
	@echo "Migrations complete!"

# Seed database
seed:
	@echo "Seeding database..."
	docker compose run --rm rails-api bundle exec rake db:seed
	docker compose run --rm laravel-api php artisan db:seed
	@echo "Seeding complete!"

# Reset database
db-reset:
	@echo "Resetting database..."
	docker compose run --rm rails-api bundle exec rake db:drop db:create db:migrate db:seed
	docker compose run --rm laravel-api php artisan migrate:fresh --seed
	@echo "Database reset complete!"

# Shell access
shell-rails:
	docker compose run --rm rails-api bash

shell-laravel:
	docker compose run --rm laravel-api bash

shell-frontend:
	docker compose run --rm frontend sh

# Install dependencies
install:
	@echo "Installing dependencies..."
	docker compose run --rm rails-api bundle install
	docker compose run --rm laravel-api composer install
	docker compose run --rm frontend npm install
	@echo "Dependencies installed!"
