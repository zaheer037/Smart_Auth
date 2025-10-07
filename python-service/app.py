from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from datetime import datetime, timedelta
import json
import os

app = Flask(__name__)
CORS(app)

# Simple anomaly detection based on location and time patterns
class AnomalyDetector:
    def __init__(self):
        self.risk_factors = {
            'new_location': 30,
            'impossible_travel': 70,
            'unusual_time': 20,
            'new_device': 25,
            'multiple_attempts': 40
        }
    
    def analyze_login(self, login_data):
        """
        Analyze login attempt for anomalies
        Returns risk score (0-100) and detected factors
        """
        risk_score = 0
        detected_factors = []
        
        # Extract data
        current_location = login_data.get('current_location', {})
        previous_logins = login_data.get('previous_logins', [])
        time_since_last = login_data.get('time_since_last_login', 0)  # in hours
        user_agent = login_data.get('user_agent', '')
        
        # Check for new location
        if previous_logins:
            last_location = previous_logins[0].get('location', {})
            if (current_location.get('country') != last_location.get('country')):
                risk_score += self.risk_factors['new_location']
                detected_factors.append({
                    'factor': 'new_location',
                    'description': f"Login from new country: {current_location.get('country')}",
                    'score': self.risk_factors['new_location']
                })
        
        # Check for impossible travel
        if previous_logins and time_since_last < 12:  # Less than 12 hours
            last_location = previous_logins[0].get('location', {})
            if (current_location.get('country') != last_location.get('country') and 
                time_since_last < 6):  # Different country in less than 6 hours
                risk_score += self.risk_factors['impossible_travel']
                detected_factors.append({
                    'factor': 'impossible_travel',
                    'description': f"Country change in {time_since_last:.1f} hours",
                    'score': self.risk_factors['impossible_travel']
                })
        
        # Check for unusual login time (very early morning)
        current_hour = datetime.now().hour
        if current_hour >= 2 and current_hour <= 5:
            risk_score += self.risk_factors['unusual_time']
            detected_factors.append({
                'factor': 'unusual_time',
                'description': f"Login at unusual hour: {current_hour}:00",
                'score': self.risk_factors['unusual_time']
            })
        
        # Check for multiple recent attempts
        recent_attempts = len([login for login in previous_logins 
                             if login.get('time_diff', 24) < 1])  # Last hour
        if recent_attempts > 3:
            risk_score += self.risk_factors['multiple_attempts']
            detected_factors.append({
                'factor': 'multiple_attempts',
                'description': f"{recent_attempts} attempts in last hour",
                'score': self.risk_factors['multiple_attempts']
            })
        
        # Determine status
        if risk_score >= 60:
            status = 'suspicious'
        elif risk_score >= 30:
            status = 'warning'
        else:
            status = 'safe'
        
        return {
            'risk_score': min(risk_score, 100),
            'status': status,
            'factors': detected_factors,
            'recommendation': self._get_recommendation(status, risk_score)
        }
    
    def _get_recommendation(self, status, risk_score):
        if status == 'suspicious':
            return 'Block login and require additional verification'
        elif status == 'warning':
            return 'Allow login but monitor closely'
        else:
            return 'Allow login normally'

# Initialize detector
detector = AnomalyDetector()

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'OK',
        'service': 'Smart Auth Hub - Anomaly Detection Service',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/analyze-login', methods=['POST'])
def analyze_login():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        # Analyze the login attempt
        analysis = detector.analyze_login(data)
        
        return jsonify({
            'success': True,
            'analysis': analysis
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Analysis error: {str(e)}'
        }), 500

@app.route('/train-model', methods=['POST'])
def train_model():
    """
    Placeholder for model training endpoint
    In a real implementation, this would train ML models on historical data
    """
    try:
        data = request.get_json()
        
        # Simulate model training
        training_data_size = len(data.get('training_data', []))
        
        return jsonify({
            'success': True,
            'message': f'Model trained on {training_data_size} samples',
            'model_version': '1.0.0',
            'accuracy': 0.85  # Simulated accuracy
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Training error: {str(e)}'
        }), 500

@app.route('/get-risk-factors', methods=['GET'])
def get_risk_factors():
    """
    Return current risk factors and their weights
    """
    return jsonify({
        'success': True,
        'risk_factors': detector.risk_factors,
        'thresholds': {
            'safe': '< 30',
            'warning': '30-59',
            'suspicious': '>= 60'
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"🐍 Starting Smart Auth Hub - Anomaly Detection Service")
    print(f"📍 Port: {port}")
    print(f"🔧 Debug: {debug}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
