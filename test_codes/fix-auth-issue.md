# Fix Authentication Issue

Based on the browser console errors, here's how to fix the login issue:

## The Problem
- Frontend is configured to use `/api/v1/auth/login`
- Backend server is not responding (ERR_CONNECTION_RESET)
- This means either the backend is not running or there's a connection issue

## Quick Fix Steps

### 1. Stop any running servers
```bash
# Kill any process using port 3000
lsof -ti:3000 | xargs kill -9
# Kill any process using port 5173
lsof -ti:5173 | xargs kill -9
```

### 2. Start Backend Server
```bash
cd backend
npm install
npm run start:dev
```

Wait until you see:
```
🚀 Application is running on: http://localhost:3000
📚 API Documentation: http://localhost:3000/api/docs
```

### 3. In a new terminal, start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Test the Backend
Open a new terminal and run:
```bash
curl http://localhost:3000/api/v1/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"chhinhs","password":"password"}'
```

You should get a response with tokens.

### 5. Login via Browser
1. Open http://localhost:5173
2. Enter credentials:
   - Username: chhinhs
   - Password: password
3. Click Login

## Alternative: Use the Start Script
```bash
# From project root
./start-dev.sh
```

This will:
- Check database connection
- Seed users if needed
- Start both backend and frontend
- Show you the URLs and credentials

## If Still Having Issues

1. **Check Backend Logs**
   - Look for any error messages in the terminal where backend is running
   - Check if it says "Database connected successfully"

2. **Check Network Tab**
   - Open browser DevTools → Network tab
   - Try to login and see the actual request/response
   - Look for the exact error

3. **Verify Database Connection**
   ```bash
   cd backend
   node check-setup.js
   ```

4. **Manually Create User**
   ```bash
   cd backend
   npx ts-node seed-dev-users.ts
   ```

## Common Issues

1. **Port Already in Use**
   - Another process is using port 3000
   - Solution: Kill the process or change the port in backend/.env

2. **Database Connection Failed**
   - Can't connect to remote PostgreSQL
   - Solution: Check network connectivity to 157.10.73.52

3. **CORS Error**
   - Frontend URL not allowed by backend
   - Solution: Backend is already configured for http://localhost:5173