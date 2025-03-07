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

# In-memory storage for analysis results (would be a database in production)
analysis_history = {}

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
        # Convert to list and sort by timestamp (newest first)
        history_list = list(analysis_history.values())
        history_list.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Return only metadata, not full results
        simplified_history = [{
            "id": item["id"],
            "timestamp": item["timestamp"],
            "modelUsed": item["modelUsed"]
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
        if analysis_id not in analysis_history:
            return jsonify({
                "error": "Analysis not found",
                "message": f"No analysis found with ID: {analysis_id}"
            }), 404
        
        return jsonify(analysis_history[analysis_id])
    
    except Exception as e:
        print(f"Error fetching analysis: {str(e)}")
        return jsonify({
            "error": str(e),
            "message": "Failed to fetch analysis"
        }), 500
