# Development Setup Guide

This guide will help you set up the PLP Mentoring Platform for development with the remote database.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

## Database Information

The project is configured to use a remote PostgreSQL database:
- **Host**: 157.10.73.52
- **Port**: 5432
- **Database**: plp_mentoring_sovath
- **Username**: admin
- **Password**: P@ssw0rd

## Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Verify .env configuration**:
   The `.env` file should already be configured with:
   ```env
   DB_HOST=157.10.73.52
   DB_PORT=5432
   DB_USERNAME=admin
   DB_PASSWORD=P@ssw0rd
   DB_NAME=plp_mentoring_sovath
   DB_SSL=false
   ```

4. **Run database migrations**:
   ```bash
   npm run migration:run
   ```

5. **Seed the database with development users**:
   ```bash
   npx ts-node seed-dev-users.ts
   ```
   
   This will create the following users:
   - **chhinhs** (Administrator) - Password: `password`
   - **zone_user** (Zone) - Password: `password`
   - **provincial_user** (Provincial) - Password: `password`
   - **teacher_user** (Teacher) - Password: `password`

6. **Start the backend server**:
   ```bash
   npm run start:dev
   ```
   
   The backend will run on http://localhost:3000

## Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Verify .env configuration**:
   The `.env` file should contain:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

4. **Start the frontend development server**:
   ```bash
   npm run dev
   ```
   
   The frontend will run on http://localhost:5173

## Login Credentials

### Primary Administrator Account
- **Username**: chhinhs
- **Password**: password
- **Role**: Administrator
- **Access**: Full system access

### Test Accounts
- **Zone Manager**: zone_user / password
- **Provincial Officer**: provincial_user / password
- **Teacher**: teacher_user / password

## Testing the Setup

1. Open your browser and navigate to http://localhost:5173
2. Click on "Login" or navigate to http://localhost:5173/login
3. Enter the credentials:
   - Username: `chhinhs`
   - Password: `password`
4. Click "Login" button

You should be logged in as an Administrator with full access to:
- Dashboard
- Observations
- Reports
- Users Management
- Settings

## Troubleshooting

### Cannot connect to database
- Ensure you have network connectivity to 157.10.73.52
- Verify the database credentials are correct
- Check if the PostgreSQL service is running on the remote server

### Login fails
- Ensure the backend is running (http://localhost:3000)
- Check browser console for errors
- Verify the user was created by running the seed script
- Check backend logs for authentication errors

### Frontend cannot connect to backend
- Ensure both frontend and backend are running
- Check that VITE_API_URL in frontend/.env is correct
- Look for CORS errors in browser console
- Verify backend is accessible at http://localhost:3000/api

## Server Access (for reference)

If you need to access the server directly:
- **SSH**: `ssh ubuntu@157.10.73.52`
- **Password**: `en_&xdX#!N(^OqCQzc3RE0B)m6ogU!`

## API Documentation

Once the backend is running, you can access the API documentation at:
- Swagger UI: http://localhost:3000/api-docs

## Development Workflow

1. Make sure both backend and frontend are running
2. Login with chhinhs account for full admin access
3. Test different features based on user roles
4. Check backend logs for API requests
5. Use browser developer tools for debugging frontend issues