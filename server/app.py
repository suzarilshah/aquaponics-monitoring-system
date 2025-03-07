"""
Main Flask application for the Aquaponics Monitoring System API.
"""
from flask import Flask, jsonify
from flask_cors import CORS
from routes.ai_analysis import ai_analysis_bp
from routes.chatbot import chatbot_bp
import os

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Register blueprints
app.register_blueprint(ai_analysis_bp, url_prefix='/api/ai')
app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')

# Default route
@app.route('/')
def index():
    return jsonify({
        "name": "Aquaponics Monitoring System API",
        "version": "1.0.0",
        "status": "running"
    })

# Health check endpoint
@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "timestamp": "2025-03-07T11:31:54+08:00"
    })

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({
        "error": "Not Found",
        "message": "The requested resource was not found"
    }), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({
        "error": "Internal Server Error",
        "message": "An unexpected error occurred"
    }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 6789))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
