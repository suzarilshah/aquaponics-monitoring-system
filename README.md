# Aquaponics Monitoring System

An AI-powered monitoring system for aquaponics, focusing on goldfish and spearmint growth parameters.

## Features

- Real-time monitoring of key parameters:
  - Fish: pH (6.5-7.5), Temperature (18-24°C), Ammonia (<0.5ppm)
  - Spearmint: Height (20-60cm), Growth Rate (0.8-1.5cm/day), EC (1.2-2.0 mS/cm)
- AI-powered analysis and predictions:
  - Ensemble model approach combining Deepseek and O1 Mini models
  - Predictive analytics for fish health and plant growth
  - System risk assessment and alerts
  - Actionable recommendations based on telemetry data
- AI-powered chatbot for system management
- Cross-dependency tracking between parameters
- Data visualization and analysis
- Downloadable telemetry data in CSV format
- Persistent storage of analysis history

## Docker Setup

### Option 1: Build from Source

1. Clone the repository:
   ```bash
   git clone https://github.com/suzarilshah/aquaponics-monitoring-system.git
   cd aquaponics-monitoring-system
   ```

2. Create a `.env` file in the root directory with your API keys:
   ```
   O1_API_KEY=your_azure_openai_key_here
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   ```
   
   Note: If API keys are not provided, the system will use mock responses for development purposes.

3. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

4. Access the application:
   - Frontend: `http://localhost`
   - Backend API: `http://localhost:6789`

### Option 2: Pull from Docker Hub (Recommended)

1. Create a `docker-compose.yml` file with the following content:
   ```yaml
   version: '3.8'

   services:
     client:
       image: suzarilshah/aquaponics-monitoring-system-client:latest
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
       image: suzarilshah/aquaponics-monitoring-system-server:latest
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

2. Update the API keys in the file with your own keys

3. Run the application:
   ```bash
   docker-compose up -d
   ```

4. Access the application:
   - Frontend: `http://localhost`
   - Backend API: `http://localhost:6789`

## Docker Architecture

The application is containerized using a multi-container setup:

### Client Container
- Built with Node.js and served through Nginx
- Handles static file serving and API proxying
- Exposed on port 80
- Includes health checks and automatic restarts

### Server Container
- Python Flask application
- Handles API requests and AI processing
- Exposed on port 6789
- Includes data persistence through Docker volumes:
  - `/app/data`: Stores telemetry data and AI analysis history
  - `/app/logs`: Stores application logs for debugging

### Data Persistence
The application maintains persistent storage for:
- Telemetry data (initial and validation datasets)
- AI analysis history and results
- System configuration settings

## Development Setup

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   pip install -r server/requirements.txt
   ```

2. Install Node.js dependencies:
   ```bash
   cd client
   npm install
   ```

3. Run the client in development mode:
   ```bash
   npm start
   ```

4. Run the server in development mode:
   ```bash
   cd ../server
   O1_API_KEY=your_api_key_here FLASK_ENV=development python app.py
   ```

## Environment Variables

- `O1_API_KEY`: Azure OpenAI API key for O1 Mini model
- `DEEPSEEK_API_KEY`: Deepseek API key for Deepseek Chat model
- `FLASK_ENV`: Set to 'development' or 'production'

## Key Parameters

### Fish Parameters
- pH: 6.5-7.5
- Temperature: 18-24°C
- Ammonia: <0.5ppm

### Spearmint Parameters
- Height: 20-60cm
- Growth Rate: 0.8-1.5cm/day
- EC: 1.2-2.0 mS/cm

## AI Analysis Features

### Ensemble Model Approach
The system uses an ensemble approach combining two AI models:
- **Deepseek R1**: Initial analysis of telemetry data
- **O1 Mini**: Validation and enhancement of analysis results

### Analysis Capabilities
- **Goldfish Health Predictions**:
  - pH trends and recommended actions
  - Ammonia risk probability and peak dates
  - Temperature fluctuation impact assessment

- **Spearmint Growth Analysis**:
  - Harvest readiness prediction with optimal dates
  - Nutrient deficit identification and remediation
  - Growth rate optimization recommendations

- **System Risk Assessment**:
  - pH-EC imbalance detection and impact analysis
  - Cross-dependency tracking between fish and plant parameters
  - Urgent alerts with actionable recommendations

### Data Processing
- Separate handling of fish and plant telemetry data
- Support for both initial (Mar-May 2024) and validation (Jun-Aug 2024) datasets
- CSV export functionality for further analysis
- Persistent storage of analysis history and results

### Error Handling
- Graceful degradation to mock responses when API keys are unavailable
- Retry logic for failed API requests
- JSON response parsing with fallback mechanisms
- Comprehensive error logging

## Docker Commands

### View Logs
```bash
# View all container logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f client
docker-compose logs -f server
```

### Container Management
```bash
# Stop containers
docker-compose down

# Rebuild and start containers
docker-compose up --build

# Start in detached mode
docker-compose up -d
```

### Health Checks
```bash
# Check client health
curl http://localhost/health

# Check server health
curl http://localhost:6789/health
```

## Publishing to Docker Hub

This project includes a script to build and publish Docker images to Docker Hub:

1. Make sure you're logged in to Docker Hub:
   ```bash
   docker login
   ```

2. Run the publishing script:
   ```bash
   ./docker-publish.sh
   ```

3. The script will:
   - Build the Docker images
   - Tag them with the appropriate version
   - Push them to Docker Hub
   - Create a `docker-compose.hub.yml` file for users

4. Users can then pull and run the images using the instructions in the "Pull from Docker Hub" section.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
