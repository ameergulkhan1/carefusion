"""
Clinical Notes API
API endpoints for AI-powered clinical note generation
"""

from flask import Blueprint, request, jsonify
import logging
from io import BytesIO
from datetime import datetime
try:
    from app.services.nlp_service import NLPService
except Exception:
    from services.nlp_service import NLPService

logger = logging.getLogger(__name__)

# Create blueprint
clinical_notes_bp = Blueprint('clinical_notes', __name__, url_prefix='/api/v1')

# Initialize NLP service
nlp_service = NLPService()


def _extract_text_from_pdf(file_storage):
    """Extract text from a PDF upload stream safely."""
    try:
        try:
            from PyPDF2 import PdfReader
        except ImportError:
            logger.error('PyPDF2 is not installed. Install dependencies from requirements.txt')
            return ''

        file_storage.stream.seek(0)
        pdf_bytes = file_storage.read()
        reader = PdfReader(BytesIO(pdf_bytes))
        extracted = []

        for page in reader.pages:
            page_text = page.extract_text() or ''
            if page_text.strip():
                extracted.append(page_text)

        return '\n'.join(extracted).strip()
    except Exception as exc:
        logger.warning(f"Failed to parse PDF {getattr(file_storage, 'filename', 'unknown')}: {str(exc)}")
        return ''


def _extract_text_from_image(file_storage):
    """Extract text from an image upload stream using OCR when available."""
    try:
        try:
            from PIL import Image
            import pytesseract
        except ImportError:
            logger.warning('Pillow/pytesseract not installed; image OCR unavailable')
            return ''

        file_storage.stream.seek(0)
        image_bytes = file_storage.read()
        image = Image.open(BytesIO(image_bytes))
        text = pytesseract.image_to_string(image)
        return (text or '').strip()
    except Exception as exc:
        logger.warning(f"Failed to OCR image {getattr(file_storage, 'filename', 'unknown')}: {str(exc)}")
        return ''


def _extract_text_from_document(file_storage):
    """Extract text from supported report documents (PDF or image)."""
    filename = (getattr(file_storage, 'filename', '') or '').lower()
    if filename.endswith('.pdf'):
        return _extract_text_from_pdf(file_storage)
    if filename.endswith(('.jpg', '.jpeg', '.png', '.webp')):
        return _extract_text_from_image(file_storage)
    return ''

@clinical_notes_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ML Clinical Notes Service',
        'version': '1.0.0',
        'model': nlp_service.get_model_info()
    }), 200


@clinical_notes_bp.route('/generate-clinical-note', methods=['POST'])
def generate_clinical_note():
    """
    Generate structured clinical note from transcript
    
    Expected request body:
    {
        "transcript": "Patient presents with...",
        "context": {
            "patientAge": 45,
            "patientGender": "Male",
            "pastMedicalHistory": ["Hypertension"],
            "currentMedications": ["Lisinopril"],
            "allergies": ["Penicillin"],
            "previousVisits": [...]
        }
    }
    """
    try:
        # Validate request
        data = request.get_json()
        
        if not data or 'transcript' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: transcript'
            }), 400
        
        transcript = data['transcript']
        context = data.get('context', {})
        
        # Validate transcript
        if not transcript or not isinstance(transcript, str) or len(transcript.strip()) < 10:
            return jsonify({
                'success': False,
                'error': 'Transcript must be a non-empty string with at least 10 characters'
            }), 400
        
        # Log request
        logger.info(f"Generating clinical note for transcript length: {len(transcript)}")
        
        # Process note generation
        generated_note = nlp_service.generate_note(transcript, context)
        
        # Check for contraindications
        warnings = nlp_service.check_contraindications(
            generated_note,
            context.get('allergies', []),
            context.get('currentMedications', [])
        )
        
        # Build response
        response = {
            'success': True,
            'generatedNote': {
                'chiefComplaint': generated_note['chiefComplaint'],
                'historyPresentIllness': generated_note['HPI'],
                'assessment': {
                    'diagnosis': generated_note['assessment']['diagnosis'],
                    'icd10': generated_note['assessment']['icd10'],
                    'differentialDiagnoses': generated_note['assessment'].get('differentialDiagnoses', [])
                },
                'plan': {
                    'medications': generated_note['plan'].get('medications', []),
                    'nonPharmacologic': generated_note['plan'].get('nonPharmacologic', []),
                    'labTests': generated_note['plan'].get('labTests', []),
                    'followUp': generated_note['plan'].get('followUp', ''),
                    'education': generated_note['plan'].get('education', [])
                },
                'confidence': generated_note.get('confidence', 0.85),
                'modelUsed': generated_note.get('modelUsed', 'Clinical-BERT'),
                'suggestions': generated_note.get('suggestions', [])
            },
            'warnings': warnings
        }
        
        logger.info("Clinical note generation successful")
        
        return jsonify(response), 200
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
        
    except Exception as e:
        logger.error(f"Error generating clinical note: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Internal server error while generating note'
        }), 500


@clinical_notes_bp.route('/summarize-report-documents', methods=['POST'])
def summarize_report_documents():
    """
        Read uploaded report documents and generate concise AI clinical documentation summary.

    Form-data expected:
            - documents: one or multiple report files (PDF/JPG/JPEG/PNG/WEBP)
      - patientName (optional)
      - patientId (optional)
      - doctorName (optional)
      - documentType (optional)
    """
    try:
        uploaded_files = request.files.getlist('documents')
        if not uploaded_files:
            single_file = request.files.get('document')
            if single_file:
                uploaded_files = [single_file]

        if not uploaded_files:
            return jsonify({
                'success': False,
                'error': 'No report documents uploaded'
            }), 400

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
            text = _extract_text_from_document(file)
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

        summary = nlp_service.summarize_report_documents(document_texts, context)

        extraction_mode = 'metadata_fallback' if used_metadata_fallback else 'text_extraction'

        return jsonify({
            'success': True,
            'summary': summary,
            'filesProcessed': processed_files,
            'documentsCount': len(processed_files),
            'extractionMode': extraction_mode,
            'warning': 'OCR/manual review may be required for scanned PDFs.' if extraction_mode == 'metadata_fallback' else None
        }), 200

    except ValueError as exc:
        return jsonify({
            'success': False,
            'error': str(exc)
        }), 400
    except Exception as exc:
        logger.error(f"Error summarizing report documents: {str(exc)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to summarize uploaded report documents'
        }), 500


@clinical_notes_bp.route('/extract-entities', methods=['POST'])
def extract_entities():
    """
    Extract medical entities (symptoms, conditions, medications) from text
    
    Expected request body:
    {
        "text": "Patient has fever and cough, started yesterday..."
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: text'
            }), 400
        
        text = data['text']
        
        # Extract entities
        entities = nlp_service.extract_entities(text)
        
        return jsonify({
            'success': True,
            'entities': entities
        }), 200
        
    except Exception as e:
        logger.error(f"Error extracting entities: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to extract entities'
        }), 500


@clinical_notes_bp.route('/suggest-icd10', methods=['POST'])
def suggest_icd10():
    """
    Suggest ICD-10 codes based on diagnosis text
    
    Expected request body:
    {
        "diagnosis": "Type 2 diabetes mellitus"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'diagnosis' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: diagnosis'
            }), 400
        
        diagnosis = data['diagnosis']
        
        # Get ICD-10 suggestions
        suggestions = nlp_service.suggest_icd10(diagnosis)
        
        return jsonify({
            'success': True,
            'suggestions': suggestions
        }), 200
        
    except Exception as e:
        logger.error(f"Error suggesting ICD-10: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to suggest ICD-10 codes'
        }), 500


@clinical_notes_bp.route('/analyze-sentiment', methods=['POST'])
def analyze_sentiment():
    """
    Analyze sentiment of clinical text (useful for psychiatric notes)
    
    Expected request body:
    {
        "text": "Patient appears anxious and reports feeling depressed..."
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: text'
            }), 400
        
        text = data['text']
        
        # Analyze sentiment
        sentiment = nlp_service.analyze_sentiment(text)
        
        return jsonify({
            'success': True,
            'sentiment': sentiment
        }), 200
        
    except Exception as e:
        logger.error(f"Error analyzing sentiment: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to analyze sentiment'
        }), 500


@clinical_notes_bp.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@clinical_notes_bp.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500
