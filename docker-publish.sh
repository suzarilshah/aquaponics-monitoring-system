#!/bin/bash
# Script to build and publish Docker images to Docker Hub

# Configuration
DOCKER_HUB_USERNAME="suzarilshah"
IMAGE_NAME="aquaponics-monitoring-system"
VERSION="1.0.0"
LATEST=true

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Building and publishing Docker images for Aquaponics Monitoring System${NC}"
echo -e "${YELLOW}=============================================================${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if user is logged in to Docker Hub
echo -e "${YELLOW}Checking Docker Hub login status...${NC}"
if ! docker info | grep -q "Username"; then
    echo -e "${YELLOW}Please log in to Docker Hub:${NC}"
    docker login
fi

# Build the Docker images
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose build

# Tag the images
echo -e "${YELLOW}Tagging images for Docker Hub...${NC}"

# Tag server image
docker tag aquaponics-monitoring-system_server ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}-server:${VERSION}
if [ "$LATEST" = true ]; then
    docker tag aquaponics-monitoring-system_server ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}-server:latest
fi

# Tag client image
docker tag aquaponics-monitoring-system_client ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}-client:${VERSION}
if [ "$LATEST" = true ]; then
    docker tag aquaponics-monitoring-system_client ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}-client:latest
fi

# Push the images to Docker Hub
echo -e "${YELLOW}Pushing images to Docker Hub...${NC}"

# Push server image
echo -e "${YELLOW}Pushing server image...${NC}"
docker push ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}-server:${VERSION}
if [ "$LATEST" = true ]; then
    docker push ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}-server:latest
fi

# Push client image
echo -e "${YELLOW}Pushing client image...${NC}"
docker push ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}-client:${VERSION}
if [ "$LATEST" = true ]; then
    docker push ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}-client:latest
fi

echo -e "${GREEN}Images successfully pushed to Docker Hub!${NC}"
echo -e "${GREEN}Server: ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}-server:${VERSION}${NC}"
echo -e "${GREEN}Client: ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}-client:${VERSION}${NC}"

# Create a docker-compose file for users to pull and run the images
echo -e "${YELLOW}Creating docker-compose.yml for users...${NC}"

cat > docker-compose.hub.yml << EOL
version: '3.8'

services:
  client:
    image: ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}-client:latest
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
    image: ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}-server:latest
    ports:
      - "6789:6789"
    environment:
      - FLASK_ENV=production
      - O1_API_KEY=your_o1_api_key_here
      - DEEPSEEK_API_KEY=your_deepseek_api_key_here
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
EOL

echo -e "${GREEN}Created docker-compose.hub.yml for users to run the application${NC}"
echo -e "${YELLOW}=============================================================${NC}"
echo -e "${GREEN}Deployment instructions:${NC}"
echo -e "1. Download the docker-compose.hub.yml file"
echo -e "2. Rename it to docker-compose.yml"
echo -e "3. Update the API keys in the file"
echo -e "4. Run 'docker-compose up -d'"
echo -e "${YELLOW}=============================================================${NC}"
