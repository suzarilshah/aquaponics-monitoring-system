"""
Telemetry data routes for the Aquaponics Monitoring System.
"""
from datetime import datetime
import json
from pathlib import Path
from flask import Blueprint, jsonify, request, send_file
import pandas as pd

telemetry_bp = Blueprint('telemetry', __name__)

# Constants from our memory about key parameters
FISH_PARAMS = {
    'pH': {'min': 6.5, 'max': 7.5},
    'temperature': {'min': 18, 'max': 24},  # °C
    'ammonia': {'min': 0, 'max': 0.5}  # ppm
}

PLANT_PARAMS = {
    'height': {'min': 20, 'max': 60},  # cm
    'growth_rate': {'min': 0.8, 'max': 1.5},  # cm/day
    'ec': {'min': 1.2, 'max': 2.0}  # mS/cm
}

def get_data_file_path(dataset_type):
    """Get the path to a telemetry data file."""
    data_dir = Path(__file__).parent.parent / 'data' / 'telemetry'
    return data_dir / f'{dataset_type}.csv'

@telemetry_bp.route('/latest', methods=['GET'])
def get_latest_telemetry():
    """Get the latest telemetry data."""
    try:
        # Read the latest data from both datasets
        initial_data = pd.read_csv(get_data_file_path('initial'))
        validation_data = pd.read_csv(get_data_file_path('validation'))
        
        # Get the latest row from each dataset
        latest_initial = initial_data.iloc[-1].to_dict() if not initial_data.empty else {}
        latest_validation = validation_data.iloc[-1].to_dict() if not validation_data.empty else {}
        
        return jsonify({
            'initial': latest_initial,
            'validation': latest_validation,
            'parameters': {
                'fish': FISH_PARAMS,
                'plant': PLANT_PARAMS
            }
        })
    except Exception as e:
        return jsonify({
            'error': 'Failed to fetch latest telemetry',
            'message': str(e)
        }), 500

@telemetry_bp.route('/download/<dataset_type>', methods=['GET'])
def download_dataset(dataset_type):
    """Download a specific dataset as CSV."""
    if dataset_type not in ['initial', 'validation']:
        return jsonify({
            'error': 'Invalid dataset type',
            'message': 'Dataset type must be either "initial" or "validation"'
        }), 400
    
    try:
        file_path = get_data_file_path(dataset_type)
        if not file_path.exists():
            return jsonify({
                'error': 'Dataset not found',
                'message': f'No data available for {dataset_type} dataset'
            }), 404
            
        return send_file(
            file_path,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'aquaponics_{dataset_type}_data.csv'
        )
    except Exception as e:
        return jsonify({
            'error': 'Failed to download dataset',
            'message': str(e)
        }), 500

@telemetry_bp.route('/stats', methods=['GET'])
def get_telemetry_stats():
    """Get statistical analysis of telemetry data."""
    try:
        stats = {}
        for dataset_type in ['initial', 'validation']:
            file_path = get_data_file_path(dataset_type)
            if file_path.exists():
                df = pd.read_csv(file_path)
                
                # Calculate statistics for fish parameters
                fish_stats = {
                    'pH': df['pH'].describe().to_dict(),
                    'temperature': df['temperature'].describe().to_dict(),
                    'ammonia': df['ammonia'].describe().to_dict()
                }
                
                # Calculate statistics for plant parameters
                plant_stats = {
                    'height': df['height'].describe().to_dict(),
                    'growth_rate': df['growth_rate'].describe().to_dict(),
                    'ec': df['ec'].describe().to_dict()
                }
                
                stats[dataset_type] = {
                    'fish': fish_stats,
                    'plant': plant_stats,
                    'sample_size': len(df),
                    'date_range': {
                        'start': df['timestamp'].iloc[0],
                        'end': df['timestamp'].iloc[-1]
                    }
                }
        
        return jsonify({
            'statistics': stats,
            'parameters': {
                'fish': FISH_PARAMS,
                'plant': PLANT_PARAMS
            }
        })
    except Exception as e:
        return jsonify({
            'error': 'Failed to calculate statistics',
            'message': str(e)
        }), 500

@telemetry_bp.route('/alerts', methods=['GET'])
def get_system_alerts():
    """Get system alerts based on latest telemetry data."""
    try:
        # Read latest data
        latest_data = pd.read_csv(get_data_file_path('validation')).iloc[-1]
        
        alerts = []
        
        # Check fish parameters
        if not (FISH_PARAMS['pH']['min'] <= latest_data['pH'] <= FISH_PARAMS['pH']['max']):
            alerts.append({
                'type': 'warning',
                'parameter': 'pH',
                'message': f'pH level ({latest_data["pH"]}) is outside optimal range ({FISH_PARAMS["pH"]["min"]}-{FISH_PARAMS["pH"]["max"]})',
                'component': 'fish'
            })
            
        if not (FISH_PARAMS['temperature']['min'] <= latest_data['temperature'] <= FISH_PARAMS['temperature']['max']):
            alerts.append({
                'type': 'warning',
                'parameter': 'temperature',
                'message': f'Temperature ({latest_data["temperature"]}°C) is outside optimal range ({FISH_PARAMS["temperature"]["min"]}-{FISH_PARAMS["temperature"]["max"]}°C)',
                'component': 'fish'
            })
            
        if latest_data['ammonia'] > FISH_PARAMS['ammonia']['max']:
            alerts.append({
                'type': 'critical',
                'parameter': 'ammonia',
                'message': f'Ammonia level ({latest_data["ammonia"]}ppm) is above safe limit ({FISH_PARAMS["ammonia"]["max"]}ppm)',
                'component': 'fish'
            })
        
        # Check plant parameters
        if not (PLANT_PARAMS['ec']['min'] <= latest_data['ec'] <= PLANT_PARAMS['ec']['max']):
            alerts.append({
                'type': 'warning',
                'parameter': 'ec',
                'message': f'EC ({latest_data["ec"]} mS/cm) is outside optimal range ({PLANT_PARAMS["ec"]["min"]}-{PLANT_PARAMS["ec"]["max"]} mS/cm)',
                'component': 'plant'
            })
            
        if not (PLANT_PARAMS['growth_rate']['min'] <= latest_data['growth_rate'] <= PLANT_PARAMS['growth_rate']['max']):
            alerts.append({
                'type': 'warning',
                'parameter': 'growth_rate',
                'message': f'Growth rate ({latest_data["growth_rate"]} cm/day) is outside optimal range ({PLANT_PARAMS["growth_rate"]["min"]}-{PLANT_PARAMS["growth_rate"]["max"]} cm/day)',
                'component': 'plant'
            })
        
        return jsonify({
            'alerts': alerts,
            'timestamp': latest_data['timestamp'],
            'total_alerts': len(alerts)
        })
    except Exception as e:
        return jsonify({
            'error': 'Failed to generate alerts',
            'message': str(e)
        }), 500
