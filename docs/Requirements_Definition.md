# Requirements Definition Document - EC Site Application

## 1. Project Overview

### 1.1 Purpose
Develop a full-featured e-commerce platform similar to Amazon, with separate user and admin interfaces, supporting product browsing, shopping cart, payment processing, and comprehensive admin management capabilities.

### 1.2 Scope
- **User-facing application**: Product browsing, cart management, checkout, order history
- **Admin application**: Product management, inventory control, sales analytics
- **Technology stack**: Docker, React (frontend), Rails (user backend), Laravel (admin backend), MySQL, Redis

### 1.3 Success Criteria
- Secure authentication and session management
- Concurrent purchase handling without inventory conflicts
- Comprehensive test coverage (unit, integration, E2E)
- Clean, maintainable code following SOLID principles
- Production-ready deployment configuration

---

## 2. Functional Requirements

### 2.1 User Features

#### 2.1.1 User Registration
**Description**: New users can create an account to make purchases.

**Required Fields**:
- Name (full name)
- Email address (unique, used for login)
- Password (minimum 8 characters, must include letters and numbers)
- Password confirmation
- Address (street, city, state, postal code)
- Phone number

**Validation Rules**:
- Email must be unique and valid format
- Password strength validation
- All fields are required

**Policy Decisions**:
- **Email verification**: Required via confirmation link sent to email (prevents fake accounts)
- **Account activation**: Immediate activation after email confirmation
- **Duplicate detection**: Check by email; suggest login if account exists

#### 2.1.2 User Login
**Description**: Registered users authenticate to access personalized features.

**Authentication Method**:
- Email + password
- JWT token-based authentication
- Session stored in Redis (not file-based)

**Features**:
- "Remember me" option (extends token expiration to 30 days)
- Account lockout after 5 failed attempts (15-minute lockout period)
- Secure cookie handling with HttpOnly and Secure flags

**Policy Decisions**:
- **Session duration**: 24 hours for standard login, 30 days for "remember me"
- **Concurrent sessions**: Allow up to 3 active sessions per user
- **Logout behavior**: Invalidate specific session token, not all user sessions

#### 2.1.3 Password Reset
**Description**: Users can reset forgotten passwords via email.

**Workflow**:
1. User requests password reset with email
2. System sends reset link to email (token valid for 1 hour)
3. User clicks link and enters new password
4. System validates token and updates password
5. All existing sessions are invalidated for security

**Security Measures**:
- One-time use tokens
- Rate limiting: Max 3 reset requests per hour per email
- No user enumeration (same message whether email exists or not)

#### 2.1.4 Product Browsing

**Product List Page**:
- Display products with: image, name, price, stock status
- Pagination (20 products per page)
- Filtering: by category, price range, availability
- Sorting: price (low-high, high-low), newest, popularity
- Search functionality: by product name and description

**Product Detail Page**:
- Multiple product images (gallery view)
- Full description
- Price and stock status
- "Add to Cart" button (disabled if out of stock or suspended)
- Quantity selector (max: available stock or 10, whichever is lower)

**Policy Decisions**:
- **Out of stock display**: Show product but disable purchase
- **Suspended products**: Hide from listings but show "unavailable" on direct access
- **Image loading**: Lazy loading for performance
- **Default image**: Placeholder if no product image exists

#### 2.1.5 Shopping Cart

**Features**:
- Add items from product list or detail pages
- Update quantities
- Remove items
- View subtotal
- Cart persists between sessions (stored in database)

**Business Rules**:
- Cart items older than 30 days are auto-removed
- Stock validation on checkout (not on add-to-cart)
- Price shown is current price (may differ from when added)

**Policy Decisions**:
- **Anonymous carts**: Not supported; users must log in to use cart
- **Cart limits**: Max 50 unique items per cart
- **Quantity limits**: Max 10 units per product
- **Stock reservation**: No reservation until checkout; first-come-first-served

#### 2.1.6 Checkout and Payment

**Checkout Workflow**:
1. Review cart items
2. Confirm/edit shipping address
3. Select payment method
4. Review order summary
5. Confirm and submit order

**Payment Methods** (Mock Implementation):
- Credit card
- Debit card
- PayPal (simulated)

**Concurrency Handling**:
- **Optimistic locking**: Use product version number
- If stock insufficient at checkout:
  - Show error message
  - Adjust cart quantities to available stock
  - User must review and resubmit

**Payment Processing** (Simulated):
- No actual payment gateway integration
- Create payment record with "completed" status
- Generate transaction ID (UUID)

**Policy Decisions**:
- **Order confirmation**: Immediate order creation if payment succeeds
- **Failed payment**: Order created with "payment_failed" status; user can retry
- **Stock deduction timing**: Immediately on order creation (within transaction)
- **Order modification**: No modification after creation; must cancel and reorder

#### 2.1.7 Order History
**Features**:
- View past orders
- Order details: items, quantities, prices, total, status, date
- Reorder functionality (add all items to cart)

**Policy Decisions**:
- **Order retention**: Indefinitely (soft delete for users)
- **Cancelled orders**: Shown in history with "cancelled" status

---

### 2.2 Admin Features

#### 2.2.1 Admin Login
**Description**: Administrative users access backend management interface.

**Authentication**:
- Separate admin account system (not shared with users)
- Email + password
- JWT token authentication
- Session stored in Redis

**Security**:
- Stronger password requirements (min 12 characters, special characters)
- 2FA optional (can be added as enhancement)
- Admin session timeout: 2 hours of inactivity

**Policy Decisions**:
- **Admin registration**: Manual creation by existing admin (no self-registration)
- **Role-based access**: Single admin role for MVP; can extend to multiple roles

#### 2.2.2 Admin Account Management
**Features**:
- Create new admin accounts
- List all admins
- Deactivate admin accounts
- Admin activity logging

**Policy Decisions**:
- **Minimum admins**: At least one active admin must exist
- **Self-deactivation**: Admins cannot deactivate themselves

#### 2.2.3 Product Management

**Create Product**:
- Name, description, price, initial stock, category
- Upload multiple images (max 5 per product)
- Set active/inactive status

**Edit Product**:
- Update all fields except stock (use inventory management)
- Reorder images
- Add/remove images

**Delete Product**:
- Soft delete (product remains in historical orders)
- Cannot delete if active orders contain it

**Suspend Product**:
- Toggle suspension status
- Suspended products hidden from user-facing site
- Can be unsuspended anytime

**Policy Decisions**:
- **Price changes**: Take effect immediately; don't affect existing orders
- **Image storage**: Upload to cloud storage (AWS S3 or similar); store URLs in database
- **Image formats**: JPEG, PNG, WebP; max 5MB per image
- **Category assignment**: Required; "Uncategorized" default category exists

#### 2.2.4 Inventory Management

**Features**:
- View current stock for all products
- Adjust stock quantities (add or reduce)
- Inventory adjustment reasons (restock, damage, theft, correction)
- Inventory history/audit log

**Business Rules**:
- Stock cannot go below zero
- All adjustments logged with admin ID, timestamp, reason
- Automatic stock deduction on order creation

**Policy Decisions**:
- **Negative stock**: Not allowed; validation prevents over-selling
- **Stock alerts**: Show warning if stock < 10 units
- **Bulk updates**: Support CSV import for stock adjustments (future enhancement)

#### 2.2.5 Category Management

**Features**:
- Create, edit, delete categories
- View products in each category
- Reorder categories for display

**Policy Decisions**:
- **Category deletion**: Only if no products assigned; or reassign products first
- **Default category**: "Uncategorized" cannot be deleted

#### 2.2.6 Order Management (Future Enhancement)

**Note**: Not in MVP scope, but architecture should support:
- View all orders
- Update order status
- Process refunds
- Customer communication

#### 2.2.7 CSV Export Scheduling

**Description**: Automated daily inventory report generation.

**Specification**:
- **Schedule**: Every day at 9:00 AM (server timezone)
- **Format**: CSV file
- **Content**: Product name, SKU, current stock, category, status
- **Delivery**: Save to designated server directory; email to admins (optional)

**Implementation**:
- Use cron job or task scheduler (sidekiq for Rails, Laravel scheduler)
- Generate separate files per client (for multi-tenancy; single client in MVP)

**Policy Decisions**:
- **File naming**: `inventory_report_YYYY-MM-DD.csv`
- **Retention**: Keep last 30 days of reports
- **Failure handling**: Log errors; send alert to admins if generation fails

---

## 3. Non-Functional Requirements

### 3.1 Performance

**Response Time**:
- Page load: < 2 seconds for 95th percentile
- API endpoints: < 500ms for simple queries, < 2s for complex
- Database queries: Optimized with proper indexing

**Scalability**:
- Support 1000 concurrent users (initial target)
- Horizontal scaling capability for all services
- Database connection pooling

**Optimization Strategies**:
- Database query optimization (N+1 prevention, eager loading)
- Redis caching for frequently accessed data (product lists, categories)
- CDN for static assets and images
- Lazy loading for images
- API response pagination

### 3.2 Security

**Authentication**:
- JWT tokens with short expiration
- Refresh token mechanism
- Secure password hashing (bcrypt, cost factor 12)

**Session Management**:
- Sessions stored in Redis (not files)
- HttpOnly cookies prevent XSS attacks
- Secure flag for HTTPS-only transmission
- SameSite attribute to prevent CSRF

**API Security**:
- All API endpoints require authentication (except login, register, public product view)
- Token-based authentication in Authorization header
- CORS configuration for frontend domain only
- Rate limiting to prevent abuse

**Data Protection**:
- SQL injection prevention (parameterized queries, ORM)
- XSS prevention (input sanitization, output encoding)
- CSRF tokens for state-changing operations
- Input validation on all user inputs

**Reference**: [IPA Session Management Guidelines](https://www.ipa.go.jp/security/vuln/websecurity/session-management.html)

### 3.3 Testing

**Test Coverage**:
- Aim for 80%+ code coverage
- All non-trivial logic must have tests
- Exclude simple getters/setters and framework boilerplate

**Test Levels** (Small/Medium/Big):

**Small Tests** (Unit):
- Test individual functions/methods in isolation
- Mock external dependencies
- Rails: minitest
- Laravel: phpunit
- React: Jest

**Medium Tests** (Integration):
- Test interactions between components
- Use test database
- Test API endpoints with real database
- Test service layer integration

**Big Tests** (E2E):
- Test complete user workflows in browser
- Framework: Cypress or Playwright
- Cover critical paths:
  - User registration → login → browse → add to cart → checkout
  - Admin login → create product → manage inventory

**Test Data**:
- Fixtures and factories for consistent test data
- Separate test database
- Reset database between test runs

### 3.4 Maintainability

**Code Quality**:
- Follow SOLID principles
- Single Responsibility Principle: Each class/function does one thing
- DRY (Don't Repeat Yourself)
- Clear naming conventions
- Comprehensive comments for complex logic

**Code Structure**:
- Modular architecture
- Service layer for business logic
- Repository pattern for data access (optional)
- Consistent folder structure

**Documentation**:
- README with setup instructions
- API documentation (OpenAPI/Swagger)
- Code comments for non-obvious logic
- Architecture decision records (ADRs)

### 3.5 Deployment

**Containerization**:
- All services in Docker containers
- docker-compose for local development
- Environment-specific configurations

**Container Management**:
- Makefile for common operations:
  - `make setup`: Initial setup
  - `make start`: Start all containers
  - `make stop`: Stop containers
  - `make test`: Run all tests
  - `make migrate`: Run database migrations
  - `make seed`: Seed database with sample data

**Environment Variables**:
- Separate configs for development, test, production
- Secrets managed via environment variables (never committed)

---

## 4. Data Requirements

### 4.1 Database
- **DBMS**: MySQL 8.0 or higher
- **Character set**: utf8mb4 (full Unicode support, including emojis)
- **Collation**: utf8mb4_unicode_ci
- **Timezone**: UTC for all timestamps

### 4.2 Data Retention
- **User data**: Soft delete; retain indefinitely unless user requests deletion (GDPR compliance)
- **Orders**: Retain indefinitely
- **Logs**: 90 days for application logs, indefinitely for inventory logs
- **Sessions**: Auto-expire based on TTL in Redis

### 4.3 Backup
- **Frequency**: Daily automated backups
- **Retention**: Last 7 daily, 4 weekly, 3 monthly
- **Recovery**: Point-in-time recovery capability

---

## 5. User Interface Requirements

### 5.1 Design Principles
- **Responsive**: Mobile-first design, works on all devices
- **Accessibility**: WCAG 2.1 Level AA compliance
- **Intuitive**: Minimal learning curve, clear CTAs
- **Consistent**: Uniform styling and interaction patterns

### 5.2 User-Facing UI
- Clean product displays with high-quality images
- Clear pricing and stock information
- Easy navigation and search
- Streamlined checkout process (minimize steps)

### 5.3 Admin UI
- Dashboard with key metrics (today's sales, low stock alerts)
- Data tables with sorting, filtering, search
- Forms with validation feedback
- Confirmation dialogs for destructive actions

### 5.4 CSS Framework
- Choice is free (Tailwind CSS, Material-UI, Bootstrap, or custom)
- Must be reasonably polished and professional

---

## 6. Integration Requirements

### 6.1 External Services
- **Email**: SMTP for transactional emails (registration, password reset, order confirmation)
- **Image Storage**: Cloud storage (AWS S3, Cloudinary, or local storage for MVP)
- **Payment Gateway**: Mock implementation; ready for Stripe/PayPal integration

### 6.2 APIs
- RESTful API design
- JSON request/response format
- Versioned endpoints (/api/v1/...)
- Proper HTTP status codes

---

## 7. Constraints and Assumptions

### 7.1 Technical Constraints
- Must use specified technology stack (Docker, React, Rails, Laravel, MySQL, Redis)
- Must support MySQL 8.0 or higher
- Must store sessions in Redis

### 7.2 Business Assumptions
- Single-tenant application (one store owner)
- Products cannot have variants (size, color) in MVP
- Single currency (USD assumed)
- Single language (English)
- Single warehouse/fulfillment center

### 7.3 Future Enhancements (Out of Scope)
- Multi-tenant support
- Product variants
- Multi-currency and localization
- Customer reviews and ratings
- Wishlist functionality
- Promotional codes and discounts
- Advanced analytics and reporting
- Email marketing integration
- Social login (Google, Facebook)

---

## 8. Acceptance Criteria

### 8.1 Functional Completeness
- All user features functional and tested in browser
- All admin features functional and tested in browser
- Concurrent purchase scenario handled correctly
- CSV scheduling works correctly

### 8.2 Quality Standards
- All tests passing (unit, integration, E2E)
- Test coverage > 80%
- No critical security vulnerabilities
- Code follows SOLID principles and style guide

### 8.3 Documentation
- ER Diagram complete and accurate
- Requirements definition complete
- System design document with architecture rationale
- Component diagram
- Setup instructions in README

### 8.4 Deployment Readiness
- All services run via docker-compose
- Makefile for container management
- Database migrations work correctly
- Seed data available for demo

---

## 9. Glossary

- **JWT**: JSON Web Token - standard for secure token-based authentication
- **SOLID**: Software design principles (Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion)
- **E2E**: End-to-End testing
- **ORM**: Object-Relational Mapping
- **CSRF**: Cross-Site Request Forgery
- **XSS**: Cross-Site Scripting
- **CORS**: Cross-Origin Resource Sharing
- **CDN**: Content Delivery Network
- **MVP**: Minimum Viable Product
- **GDPR**: General Data Protection Regulation

---

## 10. Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-24 | Development Team | Initial requirements definition |

---

**Note**: This document serves as the foundation for system design and implementation. Any deviations or clarifications should be documented and approved before implementation.
