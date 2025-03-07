#!/bin/bash
# Script to run the Aquaponics Monitoring System containers from Docker Hub

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up Aquaponics Monitoring System containers from Docker Hub${NC}"
echo -e "${YELLOW}=============================================================${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Create Docker volumes for data persistence
echo -e "${YELLOW}Creating Docker volumes for data persistence...${NC}"
docker volume create aquaponics_data
docker volume create aquaponics_logs

# Create a Docker network
echo -e "${YELLOW}Creating Docker network...${NC}"
docker network create aquaponics-network 2>/dev/null || true

# Check if containers are already running and stop them
echo -e "${YELLOW}Checking for existing containers...${NC}"
if [ "$(docker ps -q -f name=aquaponics-server)" ]; then
    echo -e "${YELLOW}Stopping existing server container...${NC}"
    docker stop aquaponics-server
    docker rm aquaponics-server
fi

if [ "$(docker ps -q -f name=aquaponics-client)" ]; then
    echo -e "${YELLOW}Stopping existing client container...${NC}"
    docker stop aquaponics-client
    docker rm aquaponics-client
fi

# Ask for API keys if not provided as environment variables
if [ -z "$O1_API_KEY" ]; then
    read -p "Enter your Azure OpenAI API key (O1_API_KEY): " O1_API_KEY
fi

if [ -z "$DEEPSEEK_API_KEY" ]; then
    read -p "Enter your DeepSeek API key (DEEPSEEK_API_KEY): " DEEPSEEK_API_KEY
fi

# Run the server container
echo -e "${YELLOW}Starting server container...${NC}"
docker run -d \
  --name aquaponics-server \
  --network aquaponics-network \
  -p 6789:6789 \
  -e FLASK_ENV=production \
  -e O1_API_KEY="$O1_API_KEY" \
  -e DEEPSEEK_API_KEY="$DEEPSEEK_API_KEY" \
  -v aquaponics_data:/app/data \
  -v aquaponics_logs:/app/logs \
  --restart always \
  --health-cmd="curl -f http://localhost:6789/health || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  --health-start-period=40s \
  suzarilshah/aquaponics-monitoring-system-server:latest

# Verify server is running before starting client
echo -e "${YELLOW}Waiting for server to be ready...${NC}"
sleep 10

# Run the client container
echo -e "${YELLOW}Starting client container...${NC}"
docker run -d \
  --name aquaponics-client \
  --network aquaponics-network \
  -p 80:80 \
  --restart always \
  --health-cmd="curl -f http://localhost || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  --health-start-period=40s \
  suzarilshah/aquaponics-monitoring-system-client:latest

# Check if containers are running
echo -e "${YELLOW}Checking container status...${NC}"
if [ "$(docker ps -q -f name=aquaponics-server)" ] && [ "$(docker ps -q -f name=aquaponics-client)" ]; then
    echo -e "${GREEN}Aquaponics Monitoring System is now running!${NC}"
    echo -e "${GREEN}Server API: http://localhost:6789${NC}"
    echo -e "${GREEN}Client UI: http://localhost${NC}"
else
    echo -e "${RED}Failed to start containers. Check Docker logs:${NC}"
    echo -e "${YELLOW}Server logs:${NC}"
    docker logs aquaponics-server
    echo -e "${YELLOW}Client logs:${NC}"
    docker logs aquaponics-client
fi

echo -e "${YELLOW}=============================================================${NC}"
