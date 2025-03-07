"""
Main Flask application for the Aquaponics Monitoring System API.
"""
import os
import time
from datetime import datetime
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
from routes.ai_analysis import ai_analysis_bp
from routes.chatbot import chatbot_bp
from routes.telemetry import telemetry_bp

# Ensure data directories exist
DATA_DIR = Path(__file__).parent / 'data'
TELEMETRY_DIR = DATA_DIR / 'telemetry'
CHAT_HISTORY_DIR = DATA_DIR / 'chat_history'

for directory in [DATA_DIR, TELEMETRY_DIR, CHAT_HISTORY_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Create Flask app
app = Flask(__name__)

# Configure CORS based on environment
if os.environ.get('FLASK_ENV') == 'development':
    CORS(app)  # Enable all origins in development
else:
    # In production, only allow our frontend origin
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost", "http://localhost:80"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type"]
        }
    })

# Register blueprints
app.register_blueprint(ai_analysis_bp, url_prefix='/api/ai')
app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')
app.register_blueprint(telemetry_bp, url_prefix='/api/telemetry')

# Default route
@app.route('/')
def index():
    return jsonify({
        "name": "Aquaponics Monitoring System API",
        "version": "1.0.0",
        "status": "running",
        "environment": os.environ.get('FLASK_ENV', 'production')
    })

# Health check endpoint
@app.route('/health')
def health():
    # Check data directories
    health_status = {
        "data_dir": DATA_DIR.exists(),
        "telemetry_dir": TELEMETRY_DIR.exists(),
        "chat_history_dir": CHAT_HISTORY_DIR.exists()
    }
    
    # Check API keys
    api_keys_status = {
        "o1_api_key": bool(os.environ.get('O1_API_KEY')),
        "deepseek_api_key": bool(os.environ.get('DEEPSEEK_API_KEY'))
    }
    
    # For health check, we consider the system healthy if at least one API key is available
    # since our models can fall back to mock responses
    any_api_key_available = any(api_keys_status.values())
    
    # Overall status
    is_healthy = all(health_status.values()) and any_api_key_available
    
    return jsonify({
        "status": "healthy" if is_healthy else "unhealthy",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {
            "data_directories": health_status,
            "api_keys": api_keys_status,
            "any_api_key_available": any_api_key_available
        }
    }), 200 if is_healthy else 503

# Rate limiting error handler
@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        "error": "Rate Limit Exceeded",
        "message": "Too many requests. Please try again later.",
        "retry_after": e.description
    }), 429

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({
        "error": "Not Found",
        "message": "The requested resource was not found",
        "path": request.path
    }), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({
        "error": "Internal Server Error",
        "message": "An unexpected error occurred",
        "request_id": request.headers.get('X-Request-ID')
    }), 500

if __name__ == '__main__':
    # Configure server
    port = int(os.environ.get('PORT', 6789))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    # Validate environment
    if not os.environ.get('O1_API_KEY'):
        print("Warning: O1_API_KEY not set. O1 model will use mock responses.")
        
    if not os.environ.get('DEEPSEEK_API_KEY'):
        print("Warning: DEEPSEEK_API_KEY not set. Deepseek model will use mock responses.")
        
    if not (os.environ.get('O1_API_KEY') or os.environ.get('DEEPSEEK_API_KEY')):
        print("Warning: No API keys set. All AI models will use mock responses.")
    
    # Start server
    app.run(host='0.0.0.0', port=port, debug=debug)
