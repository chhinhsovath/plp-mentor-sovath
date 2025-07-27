# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive nationwide mentoring platform for the Ministry of Education, Youth and Sports of Cambodia, designed to manage teacher mentoring, classroom observations, and educational quality improvement across all administrative levels.

## Technology Stack

### Backend (NestJS)
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL (hosted at 157.10.73.52)
- **ORM**: TypeORM with migrations
- **Authentication**: JWT with Passport
- **API**: RESTful with Swagger documentation
- **Key Libraries**: bcrypt, class-validator, multer, exceljs, pdfkit

### Frontend (React + Vite)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Ant Design (antd) - **CRITICAL: Only use Ant Design components**
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form with Ant Design integration
- **Charts**: Ant Design Charts, Recharts
- **Internationalization**: i18next (Khmer primary, English secondary)

## Development Commands

### Root Level
```bash
# Start development environment (Docker)
npm run dev
docker-compose up -d

# Build entire project
npm run build

# Linting
npm run lint

# Testing
npm run test

# Database operations
npm run db:setup      # Initial database setup
npm run db:migrate    # Run migrations
npm run db:seed       # Seed data
```

### Backend Specific
```bash
cd backend
npm run start:dev     # Development server
npm run build         # Production build
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run migration:generate -- MigrationName
npm run migration:run
```

### Frontend Specific
```bash
cd frontend
npm run dev           # Development server
npm run build         # Production build
npm run test          # Unit tests with Vitest
npm run lint          # ESLint
```

## Architecture Overview

### Backend Structure
- **Modular Architecture**: Each feature is a NestJS module
- **Core Modules**:
  - `auth`: JWT authentication and authorization
  - `users`: User management with role hierarchy
  - `observation-forms`: Dynamic form builder
  - `observation-sessions`: Classroom observation data
  - `missions`: Mission tracking and management
  - `surveys`: Public survey system
  - `analytics`: Reporting and analytics
  - `hierarchy`: Role-based access control

### Frontend Structure
- **Component Organization**:
  - `components/`: Reusable UI components
  - `pages/`: Route-level components
  - `contexts/`: React contexts (Auth, Theme)
  - `services/`: API service layer
  - `hooks/`: Custom React hooks
  - `utils/`: Utility functions
  - `i18n/`: Internationalization files

### Role Hierarchy
The system implements a hierarchical role structure:
1. **Administrator**: Full system access
2. **Zone**: Zone-level oversight
3. **Provincial**: Provincial management
4. **Department**: Department coordination
5. **Cluster**: Cluster-level supervision
6. **Director**: School management
7. **Teacher/Observer**: Classroom observations

Each role has hierarchical access to data based on geographic and administrative boundaries.

## Critical Implementation Guidelines

### UI Development
1. **MUST use Ant Design components exclusively** - Do not use Material UI, Bootstrap, or other libraries
2. **All UI text must be in Khmer** - This is a monolingual Khmer application
3. **Use Ant Design theme customization** for styling consistency
4. **Leverage Ant Design's built-in features**: form validation, responsive grid, notifications

### API Integration
- Base URL: `http://localhost:3000/api/v1`
- All API calls require JWT authentication (except login/register)
- Use the existing API service layer in `frontend/src/services/`
- Handle errors consistently with Ant Design notifications

### Database Considerations
- UUID primary keys throughout
- JSONB fields for flexible metadata
- Role-based data filtering at query level
- Soft deletes implemented where appropriate

### Security Requirements
- JWT tokens stored in localStorage
- Role-based route protection
- API-level authorization checks
- Input validation on both frontend and backend

## Key Features to Maintain

1. **Offline Capability**: Form data persists locally before sync
2. **Role-Based Access**: Strict hierarchical data access
3. **Khmer Language**: Primary interface language
4. **Dynamic Forms**: Flexible observation form builder
5. **Real-time Analytics**: Dashboard with live data updates
6. **Mobile Responsiveness**: Ant Design's responsive utilities

## Common Development Tasks

### Adding a New Module
1. Create NestJS module in `backend/src/`
2. Add TypeORM entities with proper relations
3. Generate and run migrations
4. Create corresponding frontend pages/components
5. Add routes with proper role protection
6. Update navigation menu if needed

### Implementing Forms
- Use Ant Design Form component with React Hook Form
- Implement validation using Yup or Zod schemas
- Handle submission with proper error display
- Save drafts locally for offline support

### Adding Reports/Analytics
- Use existing analytics module structure
- Implement data aggregation at database level
- Use Ant Design Charts or Recharts for visualization
- Ensure proper role-based data filtering