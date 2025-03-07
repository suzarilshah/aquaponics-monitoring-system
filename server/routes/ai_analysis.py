"""
API routes for AI analysis functionality.
"""
import json
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
import sys
import os

# Use absolute imports instead of relative imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ai.models import deepseek_model, o1_model

# Create blueprint for AI analysis routes
ai_analysis_bp = Blueprint('ai_analysis', __name__)

# Models are already initialized in their respective modules

# File-based storage for analysis history
from pathlib import Path

# Ensure data directory exists
DATA_DIR = Path(__file__).parent.parent / 'data'
ANALYSIS_DIR = DATA_DIR / 'analysis'
ANALYSIS_DIR.mkdir(parents=True, exist_ok=True)
ANALYSIS_HISTORY_FILE = ANALYSIS_DIR / 'history.json'

# Initialize analysis history from file or create empty if not exists
def load_analysis_history():
    try:
        if ANALYSIS_HISTORY_FILE.exists():
            with open(ANALYSIS_HISTORY_FILE, 'r') as f:
                return json.load(f)
        return {}
    except Exception as e:
        print(f"Error loading analysis history: {str(e)}")
        return {}

def save_analysis_history(history):
    try:
        with open(ANALYSIS_HISTORY_FILE, 'w') as f:
            json.dump(history, f, indent=2)
    except Exception as e:
        print(f"Error saving analysis history: {str(e)}")

# Load history at startup
analysis_history = load_analysis_history()

@ai_analysis_bp.route('/predict', methods=['POST'])
def predict():
    """Run AI analysis on telemetry data."""
    try:
        # Get data from request
        data = request.json
        initial_data = data.get('initialData', {})
        validation_data = data.get('validationData', {})
        system_config = data.get('systemConfig', {})
        model_type = data.get('modelType', 'ensemble')
        
        # Import prompt templates
        from ai.prompts.deepseek_prompt import DEEPSEEK_SYSTEM_PROMPT
        from ai.prompts.o1_prompt import O1_SYSTEM_PROMPT
        
        # Select model based on request
        if model_type == 'deepseek-r1':
            # Use only Deepseek model
            final_results = deepseek_model.analyze_telemetry(initial_data, validation_data)
            model_used = "Deepseek R1"
            confidence_score = 0.78  # Base confidence for single model
            prompt_template = DEEPSEEK_SYSTEM_PROMPT
        elif model_type == 'o1-mini':
            # Use only O1 model for direct analysis
            deepseek_results = deepseek_model.analyze_telemetry(initial_data, validation_data)
            final_results = o1_model.validate_analysis(initial_data, validation_data, deepseek_results)
            model_used = "O1 Mini"
            confidence_score = 0.82  # Base confidence for O1
            prompt_template = O1_SYSTEM_PROMPT
        else:
            # Default: use ensemble (both models)
            deepseek_results = deepseek_model.analyze_telemetry(initial_data, validation_data)
            final_results = o1_model.validate_analysis(initial_data, validation_data, deepseek_results)
            model_used = "Deepseek R1 + Claude Opus"
            confidence_score = 0.87  # Higher confidence for ensemble
            prompt_template = "Ensemble model using both:\n\n1. Deepseek Prompt:\n" + DEEPSEEK_SYSTEM_PROMPT + "\n\n2. O1 Prompt:\n" + O1_SYSTEM_PROMPT
        
        # Add metadata
        analysis_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        complete_results = {
            "id": analysis_id,
            "timestamp": timestamp,
            "modelUsed": model_used,
            "systemConfig": system_config,
            "results": final_results,
            "confidence_score": confidence_score,
            "prompt_template": prompt_template
        }
        
        # Store in history
        analysis_history[analysis_id] = complete_results
        save_analysis_history(analysis_history)
        
        # Save individual analysis to its own file for better persistence
        analysis_file = ANALYSIS_DIR / f"{analysis_id}.json"
        try:
            with open(analysis_file, 'w') as f:
                json.dump(complete_results, f, indent=2)
        except Exception as e:
            print(f"Error saving individual analysis: {str(e)}")
        
        return jsonify(complete_results)
    
    except Exception as e:
        print(f"Error in AI analysis: {str(e)}")
        return jsonify({
            "error": str(e),
            "message": "Failed to complete AI analysis"
        }), 500

@ai_analysis_bp.route('/history', methods=['GET'])
def get_history():
    """Get history of AI analyses."""
    try:
        # Reload history to ensure we have the latest data
        current_history = load_analysis_history()
        
        # Convert to list and sort by timestamp (newest first)
        history_list = list(current_history.values())
        history_list.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Return only metadata, not full results
        simplified_history = [{
            "id": item["id"],
            "timestamp": item["timestamp"],
            "modelUsed": item["modelUsed"],
            "confidence_score": item.get("confidence_score", 0.0)
        } for item in history_list]
        
        return jsonify(simplified_history)
    
    except Exception as e:
        print(f"Error fetching analysis history: {str(e)}")
        return jsonify({
            "error": str(e),
            "message": "Failed to fetch analysis history"
        }), 500

@ai_analysis_bp.route('/<analysis_id>', methods=['GET'])
def get_analysis(analysis_id):
    """Get a specific analysis by ID."""
    try:
        # First try to load from individual file (more reliable)
        analysis_file = ANALYSIS_DIR / f"{analysis_id}.json"
        if analysis_file.exists():
            with open(analysis_file, 'r') as f:
                return jsonify(json.load(f))
        
        # Fall back to in-memory history
        current_history = load_analysis_history()
        if analysis_id not in current_history:
            return jsonify({
                "error": "Analysis not found",
                "message": f"No analysis found with ID: {analysis_id}"
            }), 404
        
        return jsonify(current_history[analysis_id])
    
    except Exception as e:
        print(f"Error fetching analysis: {str(e)}")
        return jsonify({
            "error": str(e),
            "message": "Failed to fetch analysis"
        }), 500
