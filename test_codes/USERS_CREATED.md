# Users Successfully Created in Live Database! ✅

The following users have been created in the live PostgreSQL database at 157.10.73.52:

## Primary Administrator Account
- **Username**: `chhinhs`
- **Password**: `password`
- **Email**: chhinhs@moeys.gov.kh
- **Role**: Administrator
- **Access**: Full system access (national level)
- **ID**: cc2de920-637e-4445-a3fb-fd2e9342472a

## Additional Test Accounts

### 1. System Administrator
- **Username**: `admin`
- **Password**: `password`
- **Email**: admin@moeys.gov.kh
- **Role**: Administrator
- **ID**: 3356884a-972f-47a0-a2f4-b4a6c37ff1ec

### 2. Teacher Demo
- **Username**: `teacher_demo`
- **Password**: `password`
- **Email**: teacher@moeys.gov.kh
- **Role**: Teacher
- **ID**: 422019db-a67c-483b-897d-10a4e4fe08f1

### 3. Zone Manager
- **Username**: `zone_demo`
- **Password**: `password`
- **Email**: zone@moeys.gov.kh
- **Role**: Zone
- **ID**: eda3797b-f2ff-4d1f-88d8-21e412620e2e

## How to Login

1. **Start the Backend Server**:
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Start the Frontend Server**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open Browser**: http://localhost:5173/login

4. **Enter Credentials**:
   - Username: `chhinhs`
   - Password: `password`

5. **Click "ចូលប្រើប្រាស់" (Login)**

## Troubleshooting

If you still can't login:

1. **Check Backend is Running**:
   - You should see: `🚀 Application is running on: http://localhost:3000`
   - API docs should be accessible at: http://localhost:3000/api/docs

2. **Check Frontend Environment**:
   - Ensure `frontend/.env` contains: `VITE_API_URL=http://localhost:3000/api/v1`

3. **Test Direct API Login**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"chhinhs","password":"password"}'
   ```

4. **Check Browser Console**:
   - Look for any red errors
   - Check Network tab for failed requests

## Database Connection Info
- **Host**: 157.10.73.52
- **Port**: 5432
- **Database**: plp_mentoring_sovath
- **Total Users**: 4

Created on: ${new Date().toLocaleString()}