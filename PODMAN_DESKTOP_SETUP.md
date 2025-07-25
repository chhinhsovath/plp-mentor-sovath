# PLP Mentoring Platform - Podman Desktop Setup

## Quick Start with Podman Desktop

### Prerequisites
1. **Ensure Podman Desktop is running**
   - Open Podman Desktop application
   - Check that the Podman machine shows green/running status
   - If not, click "Start" on the machine

### Option 1: Using Command Line (Recommended)

```bash
cd /Users/user/Desktop/apps/plp-mentor-sovath
./podman-start.sh
```

### Option 2: Manual Start

```bash
cd /Users/user/Desktop/apps/plp-mentor-sovath
podman-compose up --build -d
```

### Option 3: Using Podman Desktop GUI

1. **Open Podman Desktop**
2. Navigate to **Images** → **Build**
3. Select the `podman-compose.yml` file
4. Click **Build & Run**

### Option 3: Set Up Auto-Start

1. In Podman Desktop, after containers are running:
   - Click on each container
   - Go to **Settings** → **Restart Policy**
   - Set to **Always**

2. The containers will now auto-start when Podman Desktop starts

## Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

### Default Login Credentials

The application connects to a real PostgreSQL database with these users:

- **Administrator**: 
  - Username: `admin`
  - Password: any password (simplified for development)
  
- **Other users**:
  - `chhinhs` - Administrator
  - `teacher_demo` - Teacher
  - `zone_demo` - Zone Manager
  - `provincial_user` - Provincial Officer

## Available Commands

```bash
make start    # Build and start all services
make stop     # Stop all services
make restart  # Restart all services
make logs     # View logs
make status   # Check service status
make clean    # Remove containers and volumes
```

## Auto-Start Configuration

The `podman-compose-autostart.yml` includes:
- ✅ Health checks for both services
- ✅ Restart policies set to "always"
- ✅ Proper dependency management
- ✅ Volume persistence

## Troubleshooting

### If Podman Desktop shows connection errors:
```bash
podman machine stop
podman machine start
```

### To view logs in Podman Desktop:
1. Click on the container
2. Go to **Logs** tab
3. Or use: `make logs`

### To rebuild after code changes:
```bash
make restart
```

## Features

- 🚀 Auto-start on system boot (if Podman Desktop starts automatically)
- 🔄 Auto-restart on crashes
- 🏥 Health monitoring
- 📦 Isolated environment
- 🔧 Easy management through Podman Desktop GUI