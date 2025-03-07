# Aquaponics Monitoring System

An AI-powered monitoring system for aquaponics, focusing on goldfish and spearmint growth parameters.

## Features

- Real-time monitoring of key parameters:
  - Fish: pH (6.5-7.5), Temperature (18-24°C), Ammonia (<0.5ppm)
  - Spearmint: Height (20-60cm), Growth Rate (0.8-1.5cm/day), EC (1.2-2.0 mS/cm)
- AI-powered chatbot for system management
- Cross-dependency tracking between parameters
- Data visualization and analysis
- Downloadable telemetry data in CSV format

## Docker Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/suzarilshah/aquaponics-monitoring-system.git
   cd aquaponics-monitoring-system
   ```

2. Create a `.env` file in the root directory with your Azure OpenAI API key:
   ```
   O1_API_KEY=your_api_key_here
   ```

3. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
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
- Includes data persistence through Docker volumes

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

- `O1_API_KEY`: Azure OpenAI API key
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

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
