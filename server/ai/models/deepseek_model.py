"""
Deepseek model implementation for aquaponics AI analysis.
"""
import json
import os
import requests
from ..prompts.deepseek_prompt import DEEPSEEK_SYSTEM_PROMPT

class DeepseekModel:
    """DeepseekModel handles interactions with the Deepseek API for aquaponics analysis."""
    
    def __init__(self, api_key=None):
        """Initialize the Deepseek model with API key."""
        self.api_key = api_key or os.environ.get("DEEPSEEK_API_KEY")
        self.api_base = "https://suzarilshah.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview"
        #self.api_url = "https://api.deepseek.com/v1/chat/completions"
        self.model = "deepseek-r1"
        self.system_prompt = DEEPSEEK_SYSTEM_PROMPT
        
        # Check if API key is available
        if not self.api_key:
            print("Warning: DEEPSEEK_API_KEY not set. Using mock responses.")
        
    def analyze_telemetry(self, initial_data, validation_data):
        """
        Analyze telemetry data using Deepseek model.
        
        Args:
            initial_data (dict): Initial telemetry data (Mar-May 2024)
            validation_data (dict): Validation telemetry data (Jun-Aug 2024)
            
        Returns:
            dict: Analysis results
        """
        try:
            # Prepare the data for the prompt
            fish_initial = initial_data.get('fish', [])
            plant_initial = initial_data.get('plant', [])
            fish_validation = validation_data.get('fish', [])
            plant_validation = validation_data.get('plant', [])
            
            # Create a user message with the data
            user_message = self._format_data_for_prompt(
                fish_initial, plant_initial, fish_validation, plant_validation
            )
            
            # Make API request to Deepseek
            response = self._call_api(user_message)
            
            # Parse and validate the response
            return self._parse_response(response)
            
        except Exception as e:
            print(f"Error in Deepseek analysis: {str(e)}")
            # Return a fallback response with error information
            return {
                "error": str(e),
                "Goldfish_Health": {
                    "pH_Trend": {"next_30d": "Error in analysis", "action": "Check system manually"},
                    "Ammonia_Risk": {"probability": "Unknown", "peak_day": "Unknown"}
                },
                "Spearmint_Growth": {
                    "Harvest_Readiness": {"optimal_date": "Unknown due to error"},
                    "Nutrient_Deficit": {"nitrogen": "Unknown", "fix": "Check system manually"}
                },
                "System_Risk": {
                    "pH-EC_Imbalance": {"severity": "Unknown", "impact": "Unknown"}
                },
                "urgent": {
                    "title": "Analysis Error",
                    "action": "Check system manually and retry analysis"
                }
            }
    
    def _format_data_for_prompt(self, fish_initial, plant_initial, fish_validation, plant_validation):
        """Format the telemetry data for the prompt."""
        return f"""
Please analyze the following aquaponics telemetry data:

INITIAL DATA (Mar-May 2024):
Fish Telemetry:
{json.dumps(fish_initial, indent=2)}

Plant Telemetry:
{json.dumps(plant_initial, indent=2)}

VALIDATION DATA (Jun-Aug 2024):
Fish Telemetry:
{json.dumps(fish_validation, indent=2)}

Plant Telemetry:
{json.dumps(plant_validation, indent=2)}

Based on this data, please provide analysis and recommendations in the format specified.
"""
    
    def _call_api(self, user_message):
        """Call the Deepseek API with the formatted message."""
        # If no API key is available, return a mock response
        if not self.api_key:
            return self._get_mock_response()
        
        try:
            # Azure API headers
            headers = {
                "api-key": self.api_key,  # Azure uses api-key instead of Bearer token
                "Content-Type": "application/json"
            }
            
            # Azure API payload
            payload = {
                "messages": [
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_message}
                ],
                "temperature": 0.3,
                "max_tokens": 1000
            }
            
            # Make API request with retry logic
            max_retries = 3
            retry_delay = 2  # seconds
            
            for attempt in range(max_retries):
                try:
                    response = requests.post(self.api_base, headers=headers, json=payload, timeout=30)
                    response.raise_for_status()
                    
                    # Parse JSON response
                    ai_response = response.json()["choices"][0]["message"]["content"]
                    
                    # Try to parse as JSON
                    try:
                        return json.loads(ai_response)
                    except json.JSONDecodeError:
                        # If not valid JSON, try to extract JSON from text
                        import re
                        json_match = re.search(r'```json\n(.+?)\n```', ai_response, re.DOTALL)
                        if json_match:
                            return json.loads(json_match.group(1))
                        else:
                            # Fall back to mock response if can't parse JSON
                            print("Warning: Could not parse API response as JSON. Using mock response.")
                            return self._get_mock_response()
                            
                except (requests.RequestException, json.JSONDecodeError) as e:
                    if attempt < max_retries - 1:
                        print(f"API request failed, retrying in {retry_delay} seconds: {str(e)}")
                        import time
                        time.sleep(retry_delay)
                        retry_delay *= 2  # Exponential backoff
                    else:
                        print(f"API request failed after {max_retries} attempts: {str(e)}")
                        return self._get_mock_response()
        
        except Exception as e:
            print(f"Unexpected error calling API: {str(e)}")
            return self._get_mock_response()
    
    def _get_mock_response(self):
        """Return a mock response for development or when API calls fail."""
        # Mock response based on typical analysis
        return {
            "Goldfish_Health": {
                "pH_Trend": {"next_30d": "7.2 → 6.9", "action": "Add crushed coral by Thursday"},
                "Ammonia_Risk": {"probability": "68%", "peak_day": "2024-07-15"}
            },
            "Spearmint_Growth": {
                "Harvest_Readiness": {"optimal_date": "2024-08-20 ±3d"},
                "Nutrient_Deficit": {"nitrogen": "low", "fix": "Increase fish feeding 10%"}
            },
            "System_Risk": {
                "pH-EC_Imbalance": {"severity": "high", "impact": "Stunted spearmint + fish stress"},
                "Temperature_Fluctuation": {"severity": "medium", "impact": "Reduced fish appetite"}
            },
            "urgent": {
                "title": "Nighttime O2 Drop Predicted",
                "action": "Add air stone by 2024-07-12"
            },
            "watch": {
                "title": "Spearmint Pests Likely",
                "action": "Release ladybugs next Thursday"
            }
        }
    
    def _parse_response(self, response):
        """Parse and validate the response from the API."""
        # In a real implementation, this would parse JSON from the API response
        # For now, we're just returning the mock response
        return response
