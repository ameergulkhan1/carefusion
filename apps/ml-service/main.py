"""
ML Service - Flask API for Disease Prediction
Serves trained ML model predictions
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json
import numpy as np
import os
import io
import requests
from datetime import datetime
import logging

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==========================================
# SUPABASE CONFIGURATION (FILES ARE FLAT)
# ==========================================
# ⚠️ CHANGE THIS: Replace YOUR_PROJECT_ID with your actual Supabase project ID
SUPABASE_URL = "https://pmadwxcdutkjomeokzol.supabase.co/storage/v1/object/public/ml-data"
# Model URLs (You will upload these .pkl files after training)
MODEL_URL = f"{SUPABASE_URL}/disease_model.pkl"
ENCODER_URL = f"{SUPABASE_URL}/label_encoder.pkl"
MAPPING_URL = f"{SUPABASE_URL}/symptom_mapping.json"
INFO_URL = f"{SUPABASE_URL}/disease_info.json"
CATEGORIES_URL = f"{SUPABASE_URL}/categorized_symptoms.json"

# Import and register clinical notes blueprint
try:
    from app.api.clinical_notes import clinical_notes_bp
    app.register_blueprint(clinical_notes_bp)
    logging.info("✅ Clinical Notes API registered successfully")
except Exception:
    try:
        from api.clinical_notes import clinical_notes_bp
        app.register_blueprint(clinical_notes_bp)
        logging.info("✅ Clinical Notes API registered successfully (script mode)")
    except Exception as e:
        logging.warning(f"⚠️ Could not register Clinical Notes API: {str(e)}")

try:
    from app.services.nlp_service import NLPService
except Exception:
    from services.nlp_service import NLPService

nlp_service_fallback = NLPService()

# Global variables for model and data
model = None
label_encoder = None
symptom_mapping = {}
disease_info = {}
categorized_symptoms = {}
model_metadata = {}

def load_model_files():
    """Download all model files from Supabase on startup"""
    global model, label_encoder, symptom_mapping, disease_info, categorized_symptoms, model_metadata
    
    logger.info("Downloading ML model and related files from Supabase...")
    
    try:
        # Download Model
        res_model = requests.get(MODEL_URL)
        res_model.raise_for_status()
        model = joblib.load(io.BytesIO(res_model.content))
        logger.info("✅ Model loaded successfully")
        
        # Download Label Encoder
        res_encoder = requests.get(ENCODER_URL)
        res_encoder.raise_for_status()
        label_encoder = joblib.load(io.BytesIO(res_encoder.content))
        logger.info(f"✅ Label encoder loaded: {len(label_encoder.classes_)} diseases")
        
        # Download JSONs
        res_mapping = requests.get(MAPPING_URL)
        res_mapping.raise_for_status()
        symptom_mapping = res_mapping.json()
        logger.info(f"✅ Symptom mapping loaded: {len(symptom_mapping)} symptoms")
        
        res_info = requests.get(INFO_URL)
        res_info.raise_for_status()
        disease_info = res_info.json()
        logger.info(f"✅ Disease information loaded: {len(disease_info)} diseases")
        
        res_cat = requests.get(CATEGORIES_URL)
        res_cat.raise_for_status()
        categorized_symptoms = res_cat.json()
        logger.info(f"✅ Categorized symptoms loaded")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error loading model files from Supabase: {str(e)}")
        return False

# Load models immediately when the app starts
load_model_files()

def create_symptom_vector(symptoms):
    """Create binary symptom vector from symptom IDs"""
    n_symptoms = len(symptom_mapping)
    vector = np.zeros(n_symptoms)
    
    # Map symptom IDs to indices
    symptom_id_to_index = {data['id']: int(idx) for idx, data in symptom_mapping.items()}
    
    for symptom in symptoms:
        if symptom in symptom_id_to_index:
            vector[symptom_id_to_index[symptom]] = 1
            
    return vector.reshape(1, -1)

def calculate_confidence_score(probabilities):
    """Calculate confidence score from prediction probabilities"""
    max_prob = np.max(probabilities)
    if max_prob >= 0.70:
        return 'high'
    elif max_prob >= 0.40:
        return 'medium'
    else:
        return 'low'

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    is_ready = model is not None and label_encoder is not None
    return jsonify({
        'status': 'healthy' if is_ready else 'not ready',
        'model_loaded': model is not None,
        'encoder_loaded': label_encoder is not None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/summarize-report-documents', methods=['POST'])
def summarize_report_documents_fallback():
    """Fallback endpoint for AI report summarization"""
    try:
        def extract_text_from_pdf(file_storage):
            try:
                from PyPDF2 import PdfReader
            except ImportError:
                logger.error('PyPDF2 dependency is missing on ML service')
                return ''
            try:
                file_storage.stream.seek(0)
                pdf_bytes = file_storage.read()
                reader = PdfReader(io.BytesIO(pdf_bytes))
                extracted = []
                for page in reader.pages:
                    page_text = page.extract_text() or ''
                    if page_text.strip():
                        extracted.append(page_text)
                return '\n'.join(extracted).strip()
            except Exception:
                return ''

        def extract_text_from_image(file_storage):
            try:
                from PIL import Image
                import pytesseract
            except ImportError:
                logger.warning('Pillow/pytesseract not installed; image OCR unavailable')
                return ''
            try:
                file_storage.stream.seek(0)
                image_bytes = file_storage.read()
                image = Image.open(io.BytesIO(image_bytes))
                text = pytesseract.image_to_string(image)
                return (text or '').strip()
            except Exception:
                return ''

        def extract_text_from_document(file_storage):
            filename = (getattr(file_storage, 'filename', '') or '').lower()
            if filename.endswith('.pdf'):
                return extract_text_from_pdf(file_storage)
            if filename.endswith(('.jpg', '.jpeg', '.png', '.webp')):
                return extract_text_from_image(file_storage)
            return ''

        uploaded_files = request.files.getlist('documents')
        if not uploaded_files:
            single_file = request.files.get('document')
            if single_file:
                uploaded_files = [single_file]

        if not uploaded_files:
            return jsonify({'success': False, 'error': 'No report documents uploaded'}), 400

        allowed_extensions = ('.pdf', '.jpg', '.jpeg', '.png', '.webp')
        invalid_files = [
            f.filename for f in uploaded_files
            if not (f.filename or '').lower().endswith(allowed_extensions)
        ]
        if invalid_files:
            return jsonify({
                'success': False,
                'error': 'Only PDF or image documents are supported',
                'invalidFiles': invalid_files
            }), 400

        document_texts = []
        processed_files = []
        used_metadata_fallback = False

        for file in uploaded_files:
            processed_files.append(file.filename)
            text = extract_text_from_document(file)
            if text:
                document_texts.append(text)

        if not document_texts:
            used_metadata_fallback = True
            fallback_text = (
                f"Uploaded clinical report files: {', '.join([name for name in processed_files if name])}. "
                "The documents appear to be scanned/image-based with no machine-readable text. "
                "Generate a concise clinical intake summary with follow-up recommendations "
                "and mark that OCR/manual review is required."
            )
            document_texts = [fallback_text]

        context = {
            'patientName': request.form.get('patientName', ''),
            'patientId': request.form.get('patientId', ''),
            'doctorName': request.form.get('doctorName', ''),
            'documentType': request.form.get('documentType', ''),
            'generatedAt': datetime.utcnow().isoformat() + 'Z'
        }

        summary = nlp_service_fallback.summarize_report_documents(document_texts, context)
        extraction_mode = 'metadata_fallback' if used_metadata_fallback else 'text_extraction'

        return jsonify({
            'success': True,
            'summary': summary,
            'filesProcessed': processed_files,
            'documentsCount': len(processed_files),
            'extractionMode': extraction_mode,
            'warning': 'OCR/manual review may be required for scanned PDFs.' if extraction_mode == 'metadata_fallback' else None
        }), 200

    except Exception as e:
        logger.error(f"Error in fallback summarize endpoint: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to summarize uploaded report documents'}), 500

@app.route('/model/info', methods=['GET'])
def model_info():
    """Get model information"""
    return jsonify({
        'success': True,
        'data': {
            'metadata': model_metadata,
            'n_diseases': len(label_encoder.classes_) if label_encoder else 0,
            'n_symptoms': len(symptom_mapping),
            'diseases': list(label_encoder.classes_) if label_encoder else []
        }
    })

@app.route('/symptoms/all', methods=['GET'])
def get_all_symptoms():
    """Get all available symptoms"""
    try:
        symptoms = [
            {
                'id': data['id'],
                'label': data['label'],
                'description': data.get('description', ''),
                'severity': data.get('severity', 3)
            }
            for idx, data in symptom_mapping.items()
        ]
        symptoms.sort(key=lambda x: x['label'])
        return jsonify({'success': True, 'data': symptoms, 'count': len(symptoms)})
    except Exception as e:
        logger.error(f"Error getting symptoms: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/symptoms/categorized', methods=['GET'])
def get_categorized_symptoms():
    """Get symptoms organized by category"""
    try:
        if not categorized_symptoms:
            return jsonify({'success': False, 'error': 'Categorized symptoms not loaded'}), 404
        return jsonify({'success': True, 'data': categorized_symptoms})
    except Exception as e:
        logger.error(f"Error getting categorized symptoms: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/symptoms/search', methods=['GET'])
def search_symptoms():
    """Search symptoms by keyword"""
    try:
        query = request.args.get('q', '').lower()
        if not query or len(query) < 2:
            return jsonify({'success': False, 'error': 'Search query must be at least 2 characters'}), 400
        
        results = []
        for idx, data in symptom_mapping.items():
            label_lower = data['label'].lower()
            desc_lower = data.get('description', '').lower()
            if query in label_lower or query in desc_lower:
                results.append({
                    'id': data['id'],
                    'label': data['label'],
                    'description': data.get('description', ''),
                    'severity': data.get('severity', 3)
                })
        
        results.sort(key=lambda x: (0 if x['label'].lower().startswith(query) else 1, x['label']))
        return jsonify({'success': True, 'data': results, 'count': len(results)})
    except Exception as e:
        logger.error(f"Error searching symptoms: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict_disease():
    """Main prediction endpoint with improved accuracy"""
    try:
        if model is None:
            return jsonify({'success': False, 'error': 'Model is still loading or failed to load. Please try again.'}), 503

        data = request.get_json()
        if not data or 'symptoms' not in data:
            return jsonify({'success': False, 'error': 'Symptoms array is required'}), 400
        
        symptoms = data['symptoms']
        if not isinstance(symptoms, list) or len(symptoms) < 2:
            return jsonify({'success': False, 'error': 'At least 2 symptoms required for accurate prediction'}), 400
        
        X = create_symptom_vector(symptoms)
        probabilities = model.predict_proba(X)[0]
        top_indices = np.argsort(probabilities)[-10:][::-1]
        
        predictions = []
        max_probability = probabilities[top_indices[0]]
        
        for idx in top_indices:
            disease = label_encoder.classes_[idx]
            probability = float(probabilities[idx])
            
            if max_probability >= 0.6:
                threshold = 0.10
            elif max_probability >= 0.3:
                threshold = 0.05
            else:
                threshold = 0.02
            
            if probability < threshold:
                continue
            
            symptom_ids = set(symptoms)
            predictions.append({
                'disease': disease,
                'probability': probability,
                'matchingSymptoms': symptoms,
                'symptomCount': len(symptom_ids),
                'confidence': calculate_confidence_score([probability]),
                'description': disease_info.get(disease, {}).get('description', ''),
                'precautions': disease_info.get(disease, {}).get('precautions', [])
            })
            
            if len(predictions) >= 5:
                break
        
        if not predictions and len(top_indices) > 0:
            idx = top_indices[0]
            disease = label_encoder.classes_[idx]
            probability = float(probabilities[idx])
            predictions.append({
                'disease': disease,
                'probability': probability,
                'matchingSymptoms': symptoms,
                'symptomCount': len(symptoms),
                'confidence': 'low',
                'description': disease_info.get(disease, {}).get('description', 'Consult a doctor for proper diagnosis.'),
                'precautions': disease_info.get(disease, {}).get('precautions', ['Seek medical attention'])
            })
        
        max_prob = predictions[0]['probability'] if predictions else 0
        
        if max_prob >= 0.75:
            urgency_level, urgency_message = 'high', 'Strong indication - seek medical attention soon'
        elif max_prob >= 0.50:
            urgency_level, urgency_message = 'medium', 'Possible condition - consult a doctor'
        elif max_prob >= 0.25:
            urgency_level, urgency_message = 'low', 'Low confidence - monitor symptoms and consult if they persist'
        else:
            urgency_level, urgency_message = 'low', 'Multiple possibilities - more symptoms needed for accurate diagnosis'
        
        if max_prob < 0.30:
            urgency_message += '. Consider providing more symptoms for better accuracy.'
        
        logger.info(f"Prediction: {predictions[0]['disease']} ({max_prob:.2%}) from {len(symptoms)} symptoms")
        
        return jsonify({
            'success': True,
            'data': {
                'predictions': predictions,
                'urgencyLevel': urgency_level,
                'urgencyMessage': urgency_message,
                'input_symptoms': symptoms,
                'n_symptoms_provided': len(symptoms),
                'timestamp': datetime.now().isoformat()
            }
        })
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error during prediction', 'details': str(e)}), 500

@app.route('/diseases/<disease_name>', methods=['GET'])
def get_disease_info(disease_name):
    """Get detailed information about a specific disease"""
    try:
        if disease_name not in disease_info:
            return jsonify({'success': False, 'error': 'Disease not found'}), 404
        
        info = disease_info[disease_name]
        return jsonify({
            'success': True,
            'data': {
                'disease': disease_name,
                'description': info.get('description', ''),
                'precautions': info.get('precautions', [])
            }
        })
    except Exception as e:
        logger.error(f"Error getting disease info: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal error: {str(error)}")
    return jsonify({'success': False, 'error': 'Internal server error'}), 500

if __name__ == '__main__':
    if model is None:
        print("\n❌ Failed to load model files from Supabase!")
        print("🔧 Please check your SUPABASE_URL and internet connection.")
        exit(1)
    
    print("\n✅ ML Service ready!")
    print("=" * 60)
    
    # Start Flask server locally
    app.run(host='0.0.0.0', port=5001, debug=False)