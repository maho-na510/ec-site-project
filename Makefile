.PHONY: help setup build start stop restart logs clean test test-setup test-rails test-laravel test-frontend test-e2e coverage migrate seed db-reset shell-rails shell-laravel shell-frontend report-inventory report-inventory-per-admin report-list scheduler-logs install

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
	@echo "  make migrate        - Run database migrations (dev + test schema sync)"
	@echo "  make seed           - Seed database with sample data"
	@echo "  make db-reset       - Reset database (drop, create, migrate, seed)"
	@echo ""
	@echo "Testing:"
	@echo "  make test-setup     - Prepare test database (run once before first test)"
	@echo "  make test           - Run all tests (Rails, Laravel, React)"
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
	@echo "Scheduler / Reports:"
	@echo "  make report-inventory           - Generate all-products inventory CSV now"
	@echo "  make report-inventory-per-admin - Generate per-admin inventory CSVs now"
	@echo "  make report-list                - List all generated reports"
	@echo "  make scheduler-logs             - Tail scheduler logs"
	@echo ""

# Initial setup - run this once when first cloning the project
setup:
	@echo "Setting up EC Site project..."
	@[ -f .env ] || cp .env.example .env
	@echo "Building Docker containers..."
	docker compose build
	@echo "Starting MySQL, Redis, Mailpit and waiting for health checks..."
	docker compose up -d --wait mysql redis mailpit
	@echo "Running Rails setup..."
	docker compose run --rm rails-api bundle install
	docker compose run --rm rails-api bundle exec rails db:create db:migrate
	@echo "Setting up Rails test database..."
	docker compose run --rm -e RAILS_ENV=test rails-api bundle exec rails db:create db:schema:load
	@echo "Running Laravel setup..."
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
	@echo "  Frontend:    http://localhost:5173"
	@echo "  Rails API:   http://localhost:3001/api/v1"
	@echo "  Laravel API: http://localhost:8000/api/v1/admin"
	@echo "  Mailpit UI:  http://localhost:8025"

# Stop all containers
stop:
	@echo "Stopping all containers..."
	docker compose down

# Restart all containers
restart:
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

# Prepare test database (run once before first test, or after schema changes)
# MySQL root で DB ごと作り直すことで外部キー制約の DROP 順序問題を回避する
test-setup:
	@echo "Setting up test database..."
	docker compose up -d --wait mysql redis mailpit
	docker compose exec -T mysql sh -c 'mysql -uroot -p"$$MYSQL_ROOT_PASSWORD" -e "DROP DATABASE IF EXISTS ec_site_test; CREATE DATABASE ec_site_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"'
	docker compose run --rm -e RAILS_ENV=test rails-api bundle exec rails db:schema:load
	@echo "Test database ready!"

# Run all tests
test:
	@echo "Running all tests..."
	@echo "================================"
	@echo "Running Rails tests..."
	docker compose run --rm -e RAILS_ENV=test rails-api bundle exec rails test
	@echo "================================"
	@echo "Running Laravel tests..."
	docker compose run --rm laravel-api php artisan test
	@echo "================================"
	@echo "Running Frontend tests..."
	docker compose run --rm frontend npm test -- --watchAll=false
	@echo "================================"
	@echo "All tests complete!"

# Run Rails tests only
test-rails:
	docker compose run --rm -e RAILS_ENV=test rails-api bundle exec rails test

# Run Laravel tests only
test-laravel:
	docker compose run --rm laravel-api php artisan test

# Run Frontend tests only
test-frontend:
	docker compose run --rm frontend npm test -- --watchAll=false

# Run E2E tests
test-e2e:
	@echo "Running E2E tests..."
	docker compose up -d --wait
	docker compose run --rm frontend npm run test:e2e

# Generate test coverage reports
coverage:
	@echo "Generating test coverage reports..."
	@echo "Rails coverage..."
	docker compose run --rm -e RAILS_ENV=test rails-api bundle exec rails test
	@echo "Laravel coverage..."
	docker compose run --rm laravel-api php artisan test --coverage
	@echo "Frontend coverage..."
	docker compose run --rm frontend npm test -- --coverage
	@echo "Coverage reports generated!"

# Run database migrations (dev migration + test schema sync)
migrate:
	@echo "Running database migrations..."
	docker compose run --rm rails-api bundle exec rails db:migrate
	@echo "Syncing test schema..."
	docker compose exec -T mysql sh -c 'mysql -uroot -p"$$MYSQL_ROOT_PASSWORD" -e "DROP DATABASE IF EXISTS ec_site_test; CREATE DATABASE ec_site_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"'
	docker compose run --rm -e RAILS_ENV=test rails-api bundle exec rails db:schema:load
	docker compose run --rm laravel-api php artisan migrate
	@echo "Migrations complete!"

# Seed database
seed:
	@echo "Seeding database..."
	docker compose run --rm rails-api bundle exec rails db:seed
	docker compose run --rm laravel-api php artisan db:seed
	@echo "Seeding complete!"

# Reset database
db-reset:
	@echo "Resetting database..."
	docker compose run --rm rails-api bundle exec rails db:drop db:create db:migrate db:seed
	@echo "Resetting test database..."
	docker compose exec -T mysql sh -c 'mysql -uroot -p"$$MYSQL_ROOT_PASSWORD" -e "DROP DATABASE IF EXISTS ec_site_test; CREATE DATABASE ec_site_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"'
	docker compose run --rm -e RAILS_ENV=test rails-api bundle exec rails db:schema:load
	docker compose run --rm laravel-api php artisan migrate:fresh --seed
	@echo "Database reset complete!"

# Shell access
shell-rails:
	docker compose run --rm rails-api bash

shell-laravel:
	docker compose run --rm laravel-api bash

shell-frontend:
	docker compose run --rm frontend sh

# --- Scheduler / Reports ---

# 全商品の在庫CSVを今すぐ生成
report-inventory:
	@echo "Generating all-products inventory report..."
	docker compose exec laravel-api php artisan reports:generate-inventory
	@echo "Done! Check storage/app/reports/ for the file."

# 管理者ごとの在庫CSVを今すぐ生成（毎日9時のスケジュールと同じ処理）
report-inventory-per-admin:
	@echo "Generating per-admin inventory reports..."
	docker compose exec laravel-api php artisan reports:generate-inventory --per-admin
	@echo "Done! Check storage/app/reports/ for the files."

# 生成済みレポートの一覧を表示
report-list:
	docker compose exec laravel-api php artisan tinker --execute="App\Services\ReportGenerationService::new()->getAvailableReports() |> collect($$1)->each(fn($$r) => dump($$r['filename'], $$r['size']))"

# スケジューラーのログを確認
scheduler-logs:
	docker compose exec laravel-scheduler tail -f /var/www/html/storage/logs/scheduler.log

# Install dependencies
install:
	@echo "Installing dependencies..."
	docker compose run --rm rails-api bundle install
	docker compose run --rm laravel-api composer install
	docker compose run --rm frontend npm install
	@echo "Dependencies installed!"
