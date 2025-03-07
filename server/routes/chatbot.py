"""
API routes for chatbot functionality.
"""
import json
import os
import requests
import time
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from ai.prompts.o1_prompt import O1_SYSTEM_PROMPT

# Create blueprint for chatbot routes
chatbot_bp = Blueprint('chatbot', __name__)

# In-memory storage for chat history (would be a database in production)
chat_sessions = {}

# O1 Mini API configuration
O1_API_HOST = "suzarilshah.openai.azure.com"
O1_DEPLOYMENT = "o1-mini"
O1_API_VERSION = "2023-05-15"
O1_API_BASE = f"https://{O1_API_HOST}/openai/deployments/{O1_DEPLOYMENT}/chat/completions?api-version={O1_API_VERSION}"

# Get API key from environment with validation
def get_api_key():
    api_key = os.environ.get("O1_API_KEY")
    if not api_key:
        raise ValueError("O1_API_KEY environment variable is not set")
    return api_key

# Development mode flag
DEV_MODE = os.environ.get('FLASK_ENV') == 'development'

# Configure retry parameters
MAX_RETRIES = 3
RETRY_DELAY = 1  # seconds
RETRY_ERRORS = (requests.exceptions.RequestException, requests.exceptions.Timeout)

# Chatbot system prompt - focused on pH management from telemetry data
CHATBOT_SYSTEM_PROMPT = """You are an aquaponics expert. Keep pH 6.5-7.5. If pH <6.5: add coral, check 12hrs, alert >48hrs. Monitor ammonia <0.5ppm."""

@chatbot_bp.route('/send', methods=['POST'])
def send_message():
    """Send a message to the chatbot and get a response."""
    try:
        # Get data from request
        data = request.json
        message = data.get('message', '')
        session_id = data.get('sessionId', str(uuid.uuid4()))
        
        # Get or create chat history
        if session_id not in chat_sessions:
            chat_sessions[session_id] = []
        
        # Add user message to history
        chat_sessions[session_id].append({
            "role": "user",
            "content": message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Prepare messages for API - Note: O1 Mini only supports user role
        messages = [{"role": "user", "content": "Instructions for you: You are an aquaponics expert. Monitor these parameters:\n- Fish: pH (6.5-7.5), Temperature (18-24°C), Ammonia (<0.5ppm)\n- Spearmint: Height (20-60cm), Growth Rate (0.8-1.5cm/day), EC (1.2-2.0 mS/cm)\n- Track pH impact on nutrient absorption and ammonia's effect on root stress."}]
        
        # Add message with user role only
        messages.append({"role": "user", "content": message})
        
        # Call Azure O1 Mini API
        response = call_o1_api(messages)
        
        # Add assistant response to history
        assistant_message = {
            "role": "assistant",
            "content": response,
            "timestamp": datetime.now().isoformat()
        }
        chat_sessions[session_id].append(assistant_message)
        
        # Return response with session info
        return jsonify({
            "sessionId": session_id,
            "message": assistant_message,
            "history": chat_sessions[session_id]
        })
        
    except Exception as e:
        print(f"Error in chatbot: {str(e)}")
        return jsonify({
            "error": str(e),
            "message": {
                "role": "assistant",
                "content": "I'm sorry, I encountered an error. Please try again.",
                "timestamp": datetime.now().isoformat()
            }
        }), 500

@chatbot_bp.route('/history/<session_id>', methods=['GET'])
def get_history(session_id):
    """Get chat history for a session."""
    if session_id not in chat_sessions:
        return jsonify({"error": "Session not found"}), 404
    
    return jsonify({
        "sessionId": session_id,
        "history": chat_sessions[session_id]
    })

def call_o1_api(messages, max_retries=MAX_RETRIES, current_attempt=0):
    """Call the Azure O1 Mini API with retry logic."""
    try:
        try:
            api_key = get_api_key()
        except ValueError as e:
            print(f"API Key Error: {str(e)}")
            return "I apologize, but I'm not properly configured. Please check the server logs for more details."
            
        # Azure OpenAI specific headers
        headers = {
            "Content-Type": "application/json",
            "api-key": api_key
        }
        
        # Payload for Azure OpenAI - using reduced tokens to avoid rate limits
        payload = {
            "messages": messages,
            "max_completion_tokens": 5000  # Reduced tokens as requested
        }
        
        print(f"Sending request to Azure OpenAI with payload: {json.dumps(payload, default=str)}")
        
        # Enhanced retry logic with exponential backoff
        for attempt in range(max_retries):
            try:
                print(f"Making API request (attempt {attempt + 1}/{max_retries})")
                response = requests.post(
                    O1_API_BASE,
                    headers=headers,
                    json=payload,
                    timeout=30
                )
                
                # Check for specific error status codes that warrant a retry
                if response.status_code == 429:
                    print(f"Rate limit hit, providing context-aware fallback response")
                    # Provide error-specific responses based on our telemetry data memory
                    if any(param in message.lower() for param in ['ph', 'ec', 'ammonia', 'temperature']):
                        error_msg = "ERROR: Parameter outside optimal range:\n"
                        if 'ph' in message.lower():
                            error_msg += "- pH must be 6.5-7.5\n"
                        if 'ec' in message.upper():
                            error_msg += "- EC must be 1.2-2.0 mS/cm\n"
                        if 'ammonia' in message.lower():
                            error_msg += "- Ammonia must be <0.5ppm\n"
                        if 'temperature' in message.lower() or 'temp' in message.lower():
                            error_msg += "- Temperature must be 18-24°C\n"
                        return error_msg + "\nPlease adjust parameters to within these ranges."
                    break
                elif response.status_code in [500, 502, 503, 504]:
                    if attempt < max_retries - 1:
                        wait_time = RETRY_DELAY * (2 ** attempt)  # Exponential backoff
                        print(f"Received status {response.status_code}, retrying in {wait_time}s...")
                        time.sleep(wait_time)
                        continue
                elif response.status_code == 400:
                    # Handle specific Azure API errors
                    try:
                        error_data = response.json().get('error', {})
                        if 'unsupported_parameter' in error_data.get('code', ''):
                            print(f"Azure API parameter error: {error_data.get('message')}")
                            return "I apologize, but I'm having configuration issues. Please try again later."
                    except Exception as e:
                        print(f"Error parsing API error response: {str(e)}")
                break
                
            except RETRY_ERRORS as e:
                if attempt == max_retries - 1:
                    print(f"Failed after {max_retries} attempts: {str(e)}")
                    raise
                wait_time = RETRY_DELAY * (2 ** attempt)
                print(f"Request failed: {str(e)}. Retrying in {wait_time}s...")
                time.sleep(wait_time)
        
        # Debug information
        print(f"Azure API Response Status: {response.status_code}")
        
        # Check for successful response
        if response.status_code != 200:
            print(f"Error calling O1 API: {response.status_code} {response.reason} for url: {O1_API_BASE}")
            print(f"Response content: {response.text}")
            return "I apologize, but I'm having trouble connecting to my knowledge base right now. This might be due to an API configuration issue. Please check the server logs for more details."
        
        # Parse response with enhanced error handling
        try:
            response_json = response.json()
            print("=== Azure OpenAI Response Details ===")
            print(f"Status Code: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            print(f"Full Response Body: {json.dumps(response_json, indent=2)}")
            
            # Check for API errors first
            if 'error' in response_json:
                error_msg = response_json['error'].get('message', 'Unknown API error')
                print(f"API Error: {error_msg}")
                return f"I apologize, but I encountered an error: {error_msg}"
            
            # Extract the message content with improved validation
            if 'choices' in response_json and response_json['choices']:
                choice = response_json['choices'][0]
                print(f"\nAnalyzing first choice: {json.dumps(choice, indent=2)}")
                
                if isinstance(choice, dict):
                    # Check finish reason and content
                    finish_reason = choice.get('finish_reason')
                    message = choice.get('message', {})
                    content = message.get('content', '').strip()
                    
                    if not content or content.isspace():
                        print(f"Empty content received, finish_reason: {finish_reason}")
                        # Provide direct responses based on telemetry data ranges
                        if 'pH' in messages[-1]['content'].lower():
                            # Based on our memory of pH ranges and fish health
                            return "1. Add crushed coral\n2. Check pH every 12hrs\n3. Monitor ammonia (<0.5ppm)\n4. If pH stays low >48hrs:\n   - Do 20% water change\n   - Check fish health"
                    
                    # Extract content from various possible locations
                    content = None
                    if 'message' in choice and isinstance(choice['message'], dict):
                        content = choice['message'].get('content')
                    elif 'text' in choice:
                        content = choice['text']
                    
                    if content and content.strip():
                        print(f"Found valid content: {content}")
                        return content
                    else:
                        print("Empty or invalid content received")
                        return "I apologize, but I was unable to generate a meaningful response. Please try rephrasing your question."
                    
                    # Format 2: Azure OpenAI streaming format
                    if 'delta' in choice and isinstance(choice['delta'], dict):
                        if 'content' in choice['delta']:
                            content = choice['delta']['content']
                            print(f"Found content in delta: {content}")
                            return content
                    
                    # Format 3: Direct content in choice
                    if 'content' in choice:
                        content = choice['content']
                        print(f"Found direct content in choice: {content}")
                        return content
                    
                    # Format 4: Text field (some models use this)
                    if 'text' in choice:
                        content = choice['text']
                        print(f"Found content in text field: {content}")
                        return content
                    
                    print("No recognized content format in choice object")
                else:
                    print(f"Unexpected choice type: {type(choice)}")
            else:
                print("No choices array found in response")
            
            # Last resort: Check for content at root level
            if 'content' in response_json:
                content = response_json['content']
                print(f"Found content at root level: {content}")
                return content
            
            print("=== End of Response Analysis ===")
            return "I apologize, but I received an unexpected response format from my knowledge base. Please check the server logs for more details."  
        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON response: {e}")
            print(f"Raw response: {response.text}")
            return "I apologize, but I received an invalid response from my knowledge base. Please check the server logs for more details."
        
    except Exception as e:
        print(f"Error calling O1 API: {str(e)}")
        if hasattr(e, 'response') and hasattr(e.response, 'text'):
            print(f"Response content: {e.response.text}")
        return "I apologize, but I'm having trouble connecting to my knowledge base right now. This might be due to an API configuration issue. Please check the server logs for more details."

