# Inventory Management System

A full-stack inventory management application with NestJS backend, React frontend, and PostgreSQL database, featuring server-side pagination and full CRUD operations for products.

## Quick Start

Fastest start (development):

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

```bash
docker compose up
```

## URLs

### Development (docker-compose.yml)

- **Frontend**: http://localhost:5175
- **Backend API**: http://localhost:3001

## Architecture

```
┌─────────────────┐    HTTP API     ┌──────────────────┐
│                 │  ──────────────▶ │                  │
│ React Frontend  │                  │ NestJS Backend   │
│ (Vite + TS)     │ ◀──────────────  │ (TypeORM + PG)   │
│                 │                  │                  │
└─────────────────┘                  └──────────────────┘
                                            │
                                            │ SQL
                                            ▼
                                    ┌──────────────────┐
                                    │ PostgreSQL       │
                                    │ (Docker)         │
                                    └──────────────────┘
```

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: NestJS + TypeScript + TypeORM
- **Database**: PostgreSQL 18 with migrations
- **Shared**: TypeScript types and Zod schemas (npm workspaces)
- **Testing**: Jest (backend), Vitest (frontend)
- **Docker**: Multi-stage builds for production

## Prerequisites

- Node.js ≥ 24.12.0
- Docker & Docker Compose
- npm

### Option 1: Docker Development (Hot Reloading)

```bash
# Start with hot-reloading for development
docker compose up

# Access the application
# Frontend: http://localhost:5175
# Backend API: http://localhost:3001
# Database: localhost:5433
```

### Option 3: Local Development

```bash
# Install dependencies
npm install

# Build shared types
npm run build -w shared

# Start PostgreSQL
docker compose up -d db

# Start backend (in terminal 1)
npm run dev -w backend

# Start frontend (in terminal 2)
npm run dev -w frontend
```

## Ports

### Development (docker-compose.yml)

| Service  | Internal Port | External Port | Description       |
| -------- | ------------- | ------------- | ----------------- |
| Frontend | 5173          | 5175          | Vite dev server   |
| Backend  | 3000          | 3001          | NestJS dev server |
| Database | 5432          | 5433          | PostgreSQL        |

### API Endpoints

```
GET    /products?page=1&limit=10     # List products with pagination
GET    /products?page=2&limit=20    # Page 2, 20 items per page
POST   /products                     # Create product
PUT    /products/:id                 # Update product
DELETE /products/:id                 # Delete product
```

## Docker Commands

### Development

```bash
# Start all services with hot-reloading
docker compose up

# Start specific service
docker compose up backend frontend

# Rebuild and start
docker compose up --build

# View logs
docker compose logs -f

# Stop
docker compose down
```

### Useful Docker Commands

```bash
# List running containers
docker ps

# View container logs
docker logs <container-id>

# Execute shell in container
docker exec -it <container-id> sh

# View resource usage
docker stats

# Clean up unused images
docker image prune

# Clean up everything (containers, networks, volumes)
docker system prune -a
```

## Test Commands

### Backend Tests

```bash
# Unit tests (with coverage)
npm run test -w backend

# Unit tests in watch mode
npm run test:watch -w backend

# Integration tests (requires Docker)
npm run test:integration -w backend

# Run all tests
npm run test -w backend && npm run test:integration -w backend

# Specific test file
npm run test -w backend -- products.service.spec.ts

# With verbose output
npm run test -w backend -- --verbose
```

### Frontend Tests

```bash
# Run tests
npm run test -w frontend

# Watch mode
npm run test -w frontend -- --watch

# UI mode (requires @vitest/ui)
npm run test -w frontend -- --ui
```

### Shared Package Tests

```bash
# Build shared package
npm run build -w shared

# Build in watch mode
npm run dev -w shared
```

### All Tests

```bash
# Run all unit tests
npm run test --workspaces

# Run all tests including integration
npm run test --workspaces && npm run test:integration -w backend

# Lint and format
npm run lint
npm run format
```

## Production (Optional)

If you want a production-like container build:

```bash
docker compose -f docker-compose.prod.yml up --build
```

**Access:**

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001

### Ports (docker-compose.prod.yml)

| Service  | Internal Port | External Port | Description                          |
| -------- | ------------- | ------------- | ------------------------------------ |
| Frontend | 80            | 80            | Node static server serving React SPA |
| Backend  | 3000          | 3001          | NestJS API                           |
| Database | 5432          | 5433          | PostgreSQL                           |

## Development Workflow

### Adding New Features

1. **Update shared types (if needed)**
   - Edit `shared/src/product.schemas.ts` for validation
   - Edit `shared/src/product.ts` for types
   - Run `npm run build -w shared`

2. **Backend changes**
   - Update entity: `backend/src/products/product.entity.ts`
   - Update service: `backend/src/products/products.service.ts`
   - Update controller: `backend/src/products/products.controller.ts`
   - Add migration: `backend/src/migrations/`
   - Write tests: `*.spec.ts` files

3. **Frontend changes**
   - Update API calls
   - Update components
   - Update tests

4. **Test everything**
   - Run backend tests
   - Run frontend tests
   - Test Docker build

### Database Migrations

```bash
# Generate migration (from backend directory)
cd backend
npx typeorm migration:generate src/migrations/AddNewField -d ormconfig.ts

# Run migrations
npx typeorm migration:run -d ormconfig.ts

# Revert migration
npx typeorm migration:revert -d ormconfig.ts
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Key variables:

```env
# Backend
PORT=3000
NODE_ENV=development
POSTGRES_HOST=db              # Use 'localhost' for local dev, 'db' for Docker
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=inventory
CORS_ORIGIN=http://localhost:5175  # Frontend URL

# Frontend
VITE_API_URL=http://localhost:3001  # Backend API URL

# Seeding
SEED_COUNT=75                    # Number of products to seed on first run
```

### Production Considerations

1. **Database**: Use managed PostgreSQL (RDS, Cloud SQL)
2. **Backend**: Set `NODE_ENV=production`
3. **Frontend**: Update `VITE_API_URL` to production domain
4. **Secrets**: Use strong passwords, rotate regularly
5. **CORS**: Restrict origins to specific domains
6. **SSL**: Terminate SSL at a reverse proxy (e.g. Traefik/Caddy) or your hosting provider

## Testing

### Run All Tests

```bash
# All unit tests across all workspaces
npm run test --workspaces

# All tests (unit + backend integration)
npm run test --workspaces && npm run test:integration -w backend
```

### Test Structure

```
backend/src/
├── *.spec.ts              # Unit tests (services, pipes, filters)
└── test/
    ├── *.int.spec.ts      # Integration tests
    ├── test-constants.ts  # Test constants
    └── test-postgres.ts   # Test database setup

frontend/src/
└── *.test.tsx             # Component tests

shared/src/
└── *.spec.ts              # Schema validation tests
```

### Test Coverage

**Backend** (30 tests):

- ✅ Unit tests for services
- ✅ Unit tests for validation pipe
- ✅ Unit tests for schemas
- ✅ Integration tests for all CRUD operations
- ✅ Integration tests for pagination
- ✅ Integration tests for error handling
- ✅ Integration tests for CORS

**Frontend**:

- ✅ Component tests for products page
- ✅ Component tests for create/edit forms
- ✅ Component tests for pagination

### Example Test Run

```bash
$ npm run test:integration -w backend

PASS test/products-pagination.int.spec.ts
PASS test/products-create.int.spec.ts
PASS test/products-update.int.spec.ts
PASS test/products-delete.int.spec.ts
PASS test/products-schema.int.spec.ts
PASS test/cors.int.spec.ts

Test Suites: 7 passed, 7 total
Tests:       15 passed, 15 total
```

## Deployment

### Docker Registry (Optional)

```bash
# Build and tag images
docker compose -f docker-compose.prod.yml build

# Tag for registry
docker tag inventory-management-system-backend:latest \
  your-registry.com/inventory/backend:latest
docker tag inventory-management-system-frontend:latest \
  your-registry.com/inventory/frontend:latest

# Push to registry
docker push your-registry.com/inventory/backend:latest
docker push your-registry.com/inventory/frontend:latest

# Deploy on server
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Cloud Deployment

For cloud deployment, consider:

1. **AWS ECS/Fargate**
2. **Google Cloud Run**
3. **Azure Container Apps**

## Troubleshooting

### Database Connection Issues

```bash
# Check if database is healthy
docker compose ps db
docker compose logs db

# Reset database (WARNING: data loss!)
docker compose down -v
docker compose up -d db
```

### Backend Not Starting

```bash
# Check logs
docker compose logs backend

# Common issues:
# - Database not ready (wait for health check)
# - Port already in use (change PORT in .env)
# - Missing environment variables
```

### Frontend Not Connecting

```bash
# Check logs
docker compose logs frontend

# Verify backend is accessible
curl http://localhost:3001/products

# Check CORS settings
# CORS_ORIGIN in backend .env must match frontend URL
```

### Port Already in Use

Change ports in `.env`:

```env
# Backend
PORT=3001

# Frontend (dev)
VITE_PORT=5176

# Database
POSTGRES_PORT=5434
```

## API Documentation

### List Products

```http
GET /products?page=1&limit=10

Response:
{
  "data": [
    {
      "id": 1,
      "article": "A-1",
      "name": "Product 1",
      "priceMinor": 9999,
      "quantity": 10
    }
  ],
  "total": 75
}
```

### Create Product

```http
POST /products
Content-Type: application/json

{
  "article": "NEW-001",
  "name": "New Product",
  "priceMinor": 4999,
  "quantity": 5
}

Response: 201 Created
```

### Update Product

```http
PUT /products/1
Content-Type: application/json

{
  "name": "Updated Name",
  "priceMinor": 5999
}

Response: 200 OK
```

### Delete Product

```http
DELETE /products/1

Response: 204 No Content
```

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For issues and questions:

- Check the troubleshooting section
- Review test files for examples
- Check Docker logs: `docker compose logs`
