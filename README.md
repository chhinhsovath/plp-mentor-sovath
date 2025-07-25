# Nationwide Mentoring Platform - MoEYS Cambodia

A comprehensive digital platform for teacher mentoring and observation management for the Ministry of Education, Youth and Sports of Cambodia.

## 🏗️ Project Structure

```
├── backend/          # NestJS API server
├── frontend/         # React + Vite frontend
├── .kiro/           # Kiro specifications and tasks
├── PRD/             # Product requirements and database schemas
└── docker-compose.yml # Development environment setup
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- PostgreSQL 15+ (if running locally)

### Development Setup

1. **Clone and setup environment:**
   ```bash
   git clone <repository-url>
   cd mentoring-platform
   ```

2. **Start with Docker (Recommended):**
   ```bash
   docker-compose up -d
   ```
   This will start:
   - Redis cache on port 6379
   - Backend API on port 3000 (connects to remote DB)
   - Frontend app on port 5173
   
   **Note:** Database is hosted remotely at 157.10.73.52

3. **Or run locally:**

   **Backend:**
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run start:dev
   ```

   **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### 🌐 Access Points

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **API Documentation:** http://localhost:3000/api/docs
- **Database:** 157.10.73.52:5432 (Remote PostgreSQL Server)
- **Server SSH:** ssh ubuntu@157.10.73.52

## 🛠️ Development

### Backend (NestJS)

```bash
cd backend

# Development
npm run start:dev

# Build
npm run build

# Tests
npm run test
npm run test:e2e

# Database migrations
npm run migration:generate -- MigrationName
npm run migration:run
```

### Frontend (React + Vite)

```bash
cd frontend

# Development
npm run dev

# Build
npm run build

# Tests
npm run test
npm run test:coverage

# Linting
npm run lint
```

## 🗄️ Database

The application uses PostgreSQL with the following key features:
- UUID primary keys
- Role-based hierarchy system
- JSONB for flexible metadata
- Full-text search for Khmer content

Initial schema files are located in `PRD/` directory.

## 🌍 Internationalization

The platform supports:
- **Primary:** Khmer (km) - Default language
- **Secondary:** English (en)

Translation files are located in `frontend/src/i18n/locales/`

## 🧪 Testing

### Backend Testing
- Unit tests with Jest
- Integration tests for API endpoints
- E2E tests with Supertest

### Frontend Testing
- Component tests with Vitest + React Testing Library
- E2E tests with Cypress (to be added)

## 📋 Available Scripts

### Root Level
- `docker-compose up` - Start all services
- `docker-compose down` - Stop all services

### Backend
- `npm run start:dev` - Development server
- `npm run build` - Production build
- `npm run test` - Run tests
- `npm run lint` - Lint code

### Frontend
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run test` - Run tests
- `npm run lint` - Lint code

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
DB_HOST=157.10.73.52
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=P@ssw0rd
DB_NAME=plp_mentoring_sovath
DB_SSL=false
JWT_SECRET=your-secret-key
NODE_ENV=development
```

**Frontend:**
```env
VITE_API_URL=http://localhost:3000/api/v1
```

## 📚 Documentation

- **API Documentation:** Available at `/api/docs` when backend is running
- **Specifications:** Located in `.kiro/specs/nationwide-mentoring-platform/`
- **Database Schema:** Located in `PRD/` directory

## 🤝 Contributing

1. Follow the task-based development approach outlined in `.kiro/specs/`
2. Use conventional commit messages
3. Ensure tests pass before submitting PRs
4. Follow ESLint and Prettier configurations

## 📄 License

This project is proprietary software for the Ministry of Education, Youth and Sports of Cambodia.

---

**Built with ❤️ for Cambodia's Education System 🇰🇭**