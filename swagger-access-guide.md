# How to Access API Documentation via Swagger

## Swagger URL

The Swagger documentation is available at:
```
http://157.10.73.52:3001/api/docs
```

**Note**: Swagger is only available in non-production environments. If it's not accessible, the server might be running in production mode.

## How to Use Swagger UI

### 1. Open Swagger UI
Navigate to: http://157.10.73.52:3001/api/docs

### 2. Authenticate
Since most APIs require authentication, you need to:

1. First, login to get a JWT token:
   - Find the **Auth** section in Swagger
   - Click on `POST /auth/login`
   - Click "Try it out"
   - Enter credentials:
     ```json
     {
       "username": "chhinhs",
       "password": "password"
     }
     ```
   - Click "Execute"
   - Copy the `accessToken` from the response

2. Set the Bearer token:
   - Click the "Authorize" button (usually at the top right with a lock icon)
   - In the dialog, enter: `Bearer YOUR_ACCESS_TOKEN`
   - Click "Authorize"
   - Click "Close"

### 3. Test APIs
Now you can test any API endpoint:

1. Find the endpoint you want to test (e.g., Observation Forms)
2. Click on the endpoint to expand it
3. Click "Try it out"
4. Fill in any required parameters
5. Click "Execute"
6. View the response

## Example: Testing Observation Forms API

### Get all observation forms:
1. Navigate to **Observation Forms** section
2. Click on `GET /observation-forms`
3. Click "Try it out"
4. Optionally add query parameters (subject, grade, search)
5. Click "Execute"

### Create a new observation session:
1. Navigate to **Observation Sessions** section
2. Click on `POST /observation-sessions`
3. Click "Try it out"
4. Fill in the request body
5. Click "Execute"

## Alternative: Using cURL from Swagger

Swagger also generates cURL commands for you:
1. After executing any request
2. Look for the "Curl" section in the response
3. Copy the generated cURL command
4. Use it in your terminal

## If Swagger is Not Available

If you get an error accessing Swagger, it might be because:

1. **Production mode**: Swagger is disabled in production
2. **Different path**: Check if it's at a different URL
3. **Not deployed**: The latest code might not be deployed

### Enable Swagger in Production (Not Recommended)

If you need Swagger in production temporarily, you would need to modify the backend code:

```typescript
// In backend/src/main.ts
// Remove or comment out the condition:
// if (process.env.NODE_ENV !== 'production') {

// Always enable Swagger (NOT recommended for production)
const config = new DocumentBuilder()
  .setTitle('Mentoring Platform API')
  .setDescription('API for Nationwide Mentoring Platform - MoEYS Cambodia')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

## Quick Test

Test if Swagger is available:
```bash
curl -I http://157.10.73.52:3001/api/docs
```

If you get a 200 OK response, Swagger is available.

## API Documentation Features in Swagger

- **Interactive API testing**: Test APIs directly from the browser
- **Request/Response examples**: See example payloads
- **Schema definitions**: View data models
- **Authentication**: Built-in authentication support
- **Export**: Download OpenAPI specification

## Tips

1. Always authenticate first before testing protected endpoints
2. Use the "Schema" tab to understand request/response structures
3. Check the response codes to understand possible outcomes
4. Use the search box to quickly find specific endpoints
5. Swagger validates your input before sending requests