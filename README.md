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

4. Access the application at `http://localhost:6789`

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

3. Build the client:
   ```bash
   npm run build
   ```

4. Run the server:
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

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
