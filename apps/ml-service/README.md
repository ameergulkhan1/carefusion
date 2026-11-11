# ClinixSol ML Service

AI-powered disease prediction service for symptom screening.

## Overview

This Python Flask service provides machine learning-based disease prediction using Random Forest classifier trained on real medical datasets.

## Features

- ✅ Disease prediction from symptoms (41+ diseases)
- ✅ Confidence scoring (high/medium/low)
- ✅ Categorized symptom database (132+ symptoms)
- ✅ Symptom search functionality
- ✅ Disease information with precautions
- ✅ RESTful API with CORS support
- ✅ Health check endpoints

## Installation

### Prerequisites

- Python 3.8 or higher
- pip package manager

### Setup

1. **Navigate to ML service directory:**
   ```bash
   cd d:\clinixsol-frontend\ml-service
   ```

2. **Create virtual environment (recommended):**
   ```bash
   python -m venv venv
   
   # Activate on Windows
   .\venv\Scripts\activate
   
   # Activate on Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Train the model:**
   ```bash
   python scripts\train_model.py
   ```
   
   This will:
   - Load datasets from archive (1) and archive (2) folders
   - Train Random Forest classifier
   - Generate symptom mappings and disease information
   - Save model files to `models/` directory
   - Generate categorized symptoms for frontend

5. **Start the ML service:**
   ```bash
   python app\main.py
   ```
   
   Service will start on: `http://localhost:5001`

## API Endpoints

### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "encoder_loaded": true,
  "timestamp": "2024-01-15T10:30:00"
}
```

### Get All Symptoms
```http
GET /symptoms/all
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "fever",
      "label": "Fever",
      "description": "Patient experiencing fever",
      "severity": 3
    }
  ],
  "count": 132
}
```

### Get Categorized Symptoms
```http
GET /symptoms/categorized
```

Returns symptoms organized by category (General, Respiratory, Digestive, etc.)

### Search Symptoms
```http
GET /symptoms/search?q=headache
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "headache",
      "label": "Headache",
      "description": "Patient experiencing headache",
      "severity": 3
    }
  ],
  "count": 1
}
```

### Predict Disease
```http
POST /predict
Content-Type: application/json

{
  "symptoms": ["fever", "headache", "fatigue", "muscle_pain"]
}
```

Response:
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "disease": "Malaria",
        "probability": 0.85,
        "confidence": "high",
        "description": "Malaria is caused by parasites transmitted through mosquito bites...",
        "precautions": [
          "Use mosquito nets",
          "Take antimalarial medication",
          "Drink plenty of fluids",
          "Seek immediate medical attention"
        ]
      }
    ],
    "urgencyLevel": "high",
    "urgencyMessage": "Immediate medical attention recommended",
    "input_symptoms": ["fever", "headache", "fatigue", "muscle_pain"],
    "n_symptoms_provided": 4,
    "timestamp": "2024-01-15T10:30:00"
  }
}
```

### Get Disease Information
```http
GET /diseases/Malaria
```

Response:
```json
{
  "success": true,
  "data": {
    "disease": "Malaria",
    "description": "Malaria is caused by parasites transmitted through mosquito bites...",
    "precautions": [
      "Use mosquito nets",
      "Take antimalarial medication",
      "Drink plenty of fluids",
      "Seek immediate medical attention"
    ]
  }
}
```

### Model Information
```http
GET /model/info
```

Returns model metadata, number of diseases, symptoms, and training details.

## Dataset Information

### Archive (1) - Medical Datasets
- **dataset.csv**: 4,920 disease-symptom records
- **symptom_Description.csv**: Disease descriptions for 43 diseases
- **symptom_precaution.csv**: Precautions for 43 diseases
- **Symptom-severity.csv**: Severity weights for 135 symptoms

### Archive (2) - Training Data
- **Training.csv**: 4,920 binary-encoded symptom vectors
- **Testing.csv**: 44 test samples
- 132 symptoms (binary features)
- 41 disease classes

## Model Details

- **Algorithm**: Random Forest Classifier
- **Parameters**:
  - n_estimators: 200
  - max_depth: 20
  - min_samples_split: 5
  - min_samples_leaf: 2
- **Features**: 132 binary symptom indicators
- **Classes**: 41 diseases
- **Performance**: ~95%+ accuracy on test set

## Directory Structure

```
ml-service/
├── app/
│   ├── __init__.py
│   ├── config.py          # Configuration settings
│   └── main.py            # Flask application
├── scripts/
│   └── train_model.py     # Model training script
├── models/
│   ├── disease_model.pkl       # Trained RF model
│   ├── label_encoder.pkl       # Disease label encoder
│   ├── symptom_mapping.json    # Symptom ID mappings
│   ├── disease_info.json       # Disease descriptions
│   └── model_metadata.json     # Training metadata
├── data/
│   └── categorized_symptoms.json  # Frontend symptom categories
├── logs/
│   └── [training logs]
└── requirements.txt        # Python dependencies
```

## Integration with Backend

The Node.js backend (d:\clinixsol-backend) calls this ML service for predictions:

```javascript
// symptom.service.js
const mlPredictionResponse = await axios.post(
  'http://localhost:5001/predict',
  { symptoms: symptomIds },
  { timeout: 30000 }
);
```

## Troubleshooting

### Model not found error
```bash
python scripts\train_model.py
```

### Port 5001 already in use
Change port in `app/main.py`:
```python
app.run(host='0.0.0.0', port=5002)
```

Also update backend `symptom.service.js` ML_SERVICE_URL.

### Import errors
```bash
pip install --upgrade -r requirements.txt
```

## Development

### Retrain Model
```bash
python scripts\train_model.py
```

### Add New Symptoms
1. Update archive datasets
2. Retrain model
3. Restart ML service

### Monitor Logs
Logs are printed to console with timestamps and severity levels.

## Production Deployment

1. Use production WSGI server (Gunicorn):
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5001 app.main:app
   ```

2. Set up reverse proxy (Nginx)
3. Use environment variables for configuration
4. Enable HTTPS
5. Monitor with PM2 or systemd

## License

Proprietary - ClinixSol Healthcare Management System

## Support

For issues or questions, contact the development team.
