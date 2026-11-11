"""
Configuration for ML Service
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
    DEBUG = os.getenv('DEBUG', 'False') == 'True'
    
    # API Configuration
    API_VERSION = 'v1'
    API_PREFIX = f'/api/{API_VERSION}'
    
    # Model Paths
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    MODEL_DIR = os.path.join(BASE_DIR, 'models')
    DATA_DIR = os.path.join(BASE_DIR, 'data')
    
    MODEL_PATH = os.path.join(MODEL_DIR, 'disease_model.pkl')
    LABEL_ENCODER_PATH = os.path.join(MODEL_DIR, 'label_encoder.pkl')
    SYMPTOM_MAPPING_PATH = os.path.join(MODEL_DIR, 'symptom_mapping.json')
    DISEASE_INFO_PATH = os.path.join(MODEL_DIR, 'disease_info.json')
    
    # CORS Configuration
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3001').split(',')
    
    # Rate Limiting
    RATELIMIT_ENABLED = True
    RATELIMIT_DEFAULT = "100 per hour"
    RATELIMIT_STORAGE_URL = "memory://"
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.path.join(BASE_DIR, 'logs', 'ml_service.log')
    
    # Prediction Configuration
    MIN_SYMPTOMS = 2
    MAX_SYMPTOMS = 20
    TOP_PREDICTIONS = 5
    MIN_PROBABILITY_THRESHOLD = 0.05  # 5%
    HIGH_URGENCY_THRESHOLD = 0.70  # 70%
    MEDIUM_URGENCY_THRESHOLD = 0.40  # 40%
    
    # Server Configuration
    HOST = os.getenv('ML_SERVICE_HOST', '0.0.0.0')
    PORT = int(os.getenv('ML_SERVICE_PORT', 5000))


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False
    RATELIMIT_DEFAULT = "50 per hour"


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
