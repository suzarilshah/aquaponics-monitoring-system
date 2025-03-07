# Aquaponics Monitoring System - Server

This is the backend server for the Aquaponics Monitoring System, providing AI analysis capabilities for goldfish and spearmint plant monitoring.

## Features

- AI analysis using Deepseek and Claude models
- RESTful API for telemetry data analysis
- Historical analysis storage and retrieval
- Cross-dependency tracking between fish and plant parameters

## Setup

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Set environment variables (optional):
   ```
   export DEEPSEEK_API_KEY=your_deepseek_api_key
   export ANTHROPIC_API_KEY=your_anthropic_api_key
   export FLASK_ENV=development  # For debug mode
   export PORT=6789  # Default port
   ```

3. Run the server:
   ```
   python app.py
   ```

## API Endpoints

- `GET /api/ai/history` - Get history of AI analyses
- `GET /api/ai/{analysis_id}` - Get a specific analysis by ID
- `POST /api/ai/predict` - Run AI analysis on telemetry data

## Example Request

```json
POST /api/ai/predict
{
  "initialData": {
    "fish": [...],
    "plant": [...]
  },
  "validationData": {
    "fish": [...],
    "plant": [...]
  },
  "systemConfig": {
    "fishCount": 200,
    "tankVolume": 1000,
    "plantType": "spearmint",
    "growthSystem": "raft"
  }
}
```

## Example Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-03-07T11:31:54+08:00",
  "modelUsed": "Deepseek R1 + Claude Opus",
  "results": {
    "Goldfish_Health": {
      "pH_Trend": {"next_30d": "7.2 → 6.9", "action": "Add crushed coral by Thursday"},
      "Ammonia_Risk": {"probability": "68%", "peak_day": "2024-07-15"}
    },
    "Spearmint_Growth": {
      "Harvest_Readiness": {"optimal_date": "2024-08-20 ±3d"},
      "Nutrient_Deficit": {"nitrogen": "low", "fix": "Increase fish feeding 10%"}
    },
    "System_Risk": {
      "pH-EC_Imbalance": {"severity": "high", "impact": "Stunted spearmint + fish stress"}
    }
  }
}
```
