# Docker Hub Publication Guide

This guide explains how to publish your Aquaponics Monitoring System to Docker Hub, making it easy for others to deploy.

## Prerequisites

1. Install Docker and Docker Compose:
   - [Docker Desktop](https://www.docker.com/products/docker-desktop/) for Mac/Windows
   - [Docker Engine](https://docs.docker.com/engine/install/) for Linux

2. Create a Docker Hub account:
   - Sign up at [Docker Hub](https://hub.docker.com/)

## Publishing to Docker Hub

### Step 1: Log in to Docker Hub

```bash
docker login
```

Enter your Docker Hub username and password when prompted.

### Step 2: Build the Docker images

```bash
docker-compose build
```

This will build both the client and server images according to your Dockerfiles.

### Step 3: Tag the images

Replace `yourusername` with your Docker Hub username:

```bash
# Tag server image
docker tag aquaponics-monitoring-system_server yourusername/aquaponics-monitoring-system-server:latest
docker tag aquaponics-monitoring-system_server yourusername/aquaponics-monitoring-system-server:1.0.0

# Tag client image
docker tag aquaponics-monitoring-system_client yourusername/aquaponics-monitoring-system-client:latest
docker tag aquaponics-monitoring-system_client yourusername/aquaponics-monitoring-system-client:1.0.0
```

### Step 4: Push the images to Docker Hub

```bash
# Push server images
docker push yourusername/aquaponics-monitoring-system-server:latest
docker push yourusername/aquaponics-monitoring-system-server:1.0.0

# Push client images
docker push yourusername/aquaponics-monitoring-system-client:latest
docker push yourusername/aquaponics-monitoring-system-client:1.0.0
```

### Step 5: Create a docker-compose file for users

Create a file named `docker-compose.hub.yml` with the following content:

```yaml
version: '3.8'

services:
  client:
    image: yourusername/aquaponics-monitoring-system-client:latest
    ports:
      - "80:80"
    depends_on:
      - server
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  server:
    image: yourusername/aquaponics-monitoring-system-server:latest
    ports:
      - "6789:6789"
    environment:
      - FLASK_ENV=production
      - O1_API_KEY=your_o1_api_key_here  # Replace with your API key
      - DEEPSEEK_API_KEY=your_deepseek_api_key_here  # Replace with your API key
    volumes:
      - aquaponics_data:/app/data
      - aquaponics_logs:/app/logs
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6789/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  aquaponics_data:
  aquaponics_logs:
```

## For Users: Running the Docker Hub Images

Users can run your Docker Hub images by following these steps:

1. Create a `docker-compose.yml` file with the content from Step 5 above
2. Replace the API keys with their own keys
3. Run the application:
   ```bash
   docker-compose up -d
   ```
4. Access the application at http://localhost

## Automated Publishing

The repository includes a `docker-publish.sh` script that automates these steps. Once Docker is installed, you can simply run:

```bash
./docker-publish.sh
```

This script will:
- Build the Docker images
- Tag them with the appropriate version
- Push them to Docker Hub
- Create a `docker-compose.hub.yml` file for users

## Troubleshooting

- **Permission Denied**: If you encounter permission issues with the script, make it executable with `chmod +x docker-publish.sh`
- **Authentication Error**: If you get authentication errors, try logging in again with `docker login`
- **Build Failures**: Check your Dockerfiles and ensure all dependencies are correctly specified
