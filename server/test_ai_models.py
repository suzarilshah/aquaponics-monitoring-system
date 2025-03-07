#!/usr/bin/env python3
"""
Test script for AI models in the Aquaponics Monitoring System.
This script verifies that the AI models are properly configured and can generate responses.
"""
import json
import os
from pathlib import Path
from ai.models import deepseek_model, o1_model

def main():
    """Test AI models with sample data."""
    print("Testing Aquaponics AI Models")
    print("-" * 50)
    
    # Sample data for testing
    initial_data = {
        "fish": [
            {"date": "2024-03-15", "pH": 7.2, "temperature": 22.1, "ammonia": 0.2},
            {"date": "2024-04-15", "pH": 7.0, "temperature": 22.5, "ammonia": 0.3},
            {"date": "2024-05-15", "pH": 6.9, "temperature": 23.0, "ammonia": 0.4}
        ],
        "plant": [
            {"date": "2024-03-15", "height": 25, "growth_rate": 1.0, "ec": 1.5},
            {"date": "2024-04-15", "height": 35, "growth_rate": 1.2, "ec": 1.6},
            {"date": "2024-05-15", "height": 45, "growth_rate": 1.1, "ec": 1.7}
        ]
    }
    
    validation_data = {
        "fish": [
            {"date": "2024-06-15", "pH": 6.8, "temperature": 23.5, "ammonia": 0.45},
            {"date": "2024-07-15", "pH": 6.7, "temperature": 24.0, "ammonia": 0.5},
            {"date": "2024-08-15", "pH": 6.6, "temperature": 23.8, "ammonia": 0.48}
        ],
        "plant": [
            {"date": "2024-06-15", "height": 50, "growth_rate": 0.9, "ec": 1.8},
            {"date": "2024-07-15", "height": 55, "growth_rate": 0.8, "ec": 1.9},
            {"date": "2024-08-15", "height": 58, "growth_rate": 0.7, "ec": 2.0}
        ]
    }
    
    # Test environment variables
    print("Environment Variables:")
    print(f"O1_API_KEY: {'Set' if os.environ.get('O1_API_KEY') else 'Not Set'}")
    print(f"DEEPSEEK_API_KEY: {'Set' if os.environ.get('DEEPSEEK_API_KEY') else 'Not Set'}")
    print("-" * 50)
    
    # Test Deepseek model
    print("Testing Deepseek Model...")
    try:
        deepseek_results = deepseek_model.analyze_telemetry(initial_data, validation_data)
        print("Deepseek Model Test: SUCCESS")
        print(f"Result Keys: {', '.join(deepseek_results.keys())}")
    except Exception as e:
        print(f"Deepseek Model Test: FAILED - {str(e)}")
    print("-" * 50)
    
    # Test O1 model
    print("Testing O1 Model...")
    try:
        o1_results = o1_model.validate_analysis(initial_data, validation_data, deepseek_results)
        print("O1 Model Test: SUCCESS")
        print(f"Result Keys: {', '.join(o1_results.keys())}")
        print(f"Confidence Score: {o1_results.get('confidence_score', 'N/A')}")
    except Exception as e:
        print(f"O1 Model Test: FAILED - {str(e)}")
    print("-" * 50)
    
    # Test data persistence
    print("Testing Data Persistence...")
    data_dir = Path(__file__).parent / 'data'
    analysis_dir = data_dir / 'analysis'
    
    # Ensure directories exist
    analysis_dir.mkdir(parents=True, exist_ok=True)
    
    # Write test data
    test_file = analysis_dir / 'test_analysis.json'
    try:
        with open(test_file, 'w') as f:
            json.dump(o1_results, f, indent=2)
        print(f"Wrote test data to {test_file}")
        
        # Read test data back
        with open(test_file, 'r') as f:
            test_data = json.load(f)
        print(f"Read test data from {test_file}")
        print("Data Persistence Test: SUCCESS")
    except Exception as e:
        print(f"Data Persistence Test: FAILED - {str(e)}")
    
    print("-" * 50)
    print("AI Models Test Complete")

if __name__ == "__main__":
    main()
