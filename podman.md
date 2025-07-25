⏺ Success! Your project is now running with Podman

  All containers are successfully running:

  1. Redis: Running on port 6379
  2. Backend API: Running on http://localhost:3000
  3. Frontend: Running on http://localhost:5173

  You can access:
  - Frontend application: http://localhost:5173
  - Backend health check: http://localhost:3000/api/v1/health

  To manage the containers:
  - View logs: podman-compose logs -f [service-name]
  - Stop all: podman-compose down
  - Start all: podman-compose up -d
  - Rebuild: podman-compose build