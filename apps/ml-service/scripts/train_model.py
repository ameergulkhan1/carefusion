"""
ML Service - Train Disease Prediction Model
Uses datasets from archive (1) and archive (2) folders
"""

import pandas as pd
import numpy as np
import json
import os
import sys
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import joblib
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class DiseaseModelTrainer:
    def __init__(self, base_path=None):
        """Initialize trainer with paths to dataset folders"""
        # Get absolute path to script directory
        script_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Set base path to src directory (two levels up from scripts/)
        if base_path is None:
            # ml-service/scripts -> ml-service -> clinixsol-frontend -> src
            base_path = os.path.abspath(os.path.join(script_dir, '..', '..', 'src'))
        
        self.base_path = base_path
        self.archive1_path = os.path.join(base_path, 'archive (1)')
        self.archive2_path = os.path.join(base_path, 'archive (2)')
        self.model_dir = os.path.abspath(os.path.join(script_dir, '..', 'models'))
        self.data_dir = os.path.abspath(os.path.join(script_dir, '..', 'data'))
        
        # Create directories if they don't exist
        os.makedirs(self.model_dir, exist_ok=True)
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs('../logs', exist_ok=True)
        
        # Initialize model components
        self.model = None
        self.label_encoder = None
        self.symptom_columns = None
        self.symptom_mapping = {}
        self.disease_info = {}
        
    def load_datasets(self):
        """Load all datasets from archive folders"""
        print("📁 Loading datasets from archive folders...")
        print(f"📂 Looking for datasets in:")
        print(f"   Archive (1): {self.archive1_path}")
        print(f"   Archive (2): {self.archive2_path}")
        
        try:
            # Load Training and Testing data (archive 2)
            training_file = os.path.join(self.archive2_path, 'Training.csv')
            testing_file = os.path.join(self.archive2_path, 'Testing.csv')
            
            if os.path.exists(training_file) and os.path.exists(testing_file):
                self.train_data = pd.read_csv(training_file)
                self.test_data = pd.read_csv(testing_file)
                print(f"✅ Loaded Training data: {self.train_data.shape}")
                print(f"✅ Loaded Testing data: {self.test_data.shape}")
            else:
                print("⚠️  Training/Testing files not found, will use dataset.csv")
                return self.load_dataset_csv()
            
            # Load supporting data from archive (1)
            self.load_supporting_data()
            
            return True
            
        except Exception as e:
            print(f"❌ Error loading datasets: {str(e)}")
            return False
    
    def load_dataset_csv(self):
        """Fallback: Load from dataset.csv and split"""
        dataset_file = os.path.join(self.archive1_path, 'dataset.csv')
        
        if not os.path.exists(dataset_file):
            raise FileNotFoundError(f"Dataset file not found: {dataset_file}")
        
        print(f"📁 Loading dataset from: {dataset_file}")
        df = pd.read_csv(dataset_file)
        print(f"✅ Loaded dataset: {df.shape}")
        
        # Convert to binary format
        self.train_data, self.test_data = self.convert_dataset_to_binary(df)
        self.load_supporting_data()
        
        return True
    
    def convert_dataset_to_binary(self, df):
        """Convert disease-symptom dataset to binary format"""
        print("🔄 Converting dataset to binary format...")
        
        # Get all unique symptoms
        all_symptoms = set()
        for col in df.columns[1:]:  # Skip Disease column
            symptoms = df[col].dropna().unique()
            all_symptoms.update([s.strip() for s in symptoms if str(s).strip()])
        
        all_symptoms = sorted(list(all_symptoms))
        print(f"📊 Found {len(all_symptoms)} unique symptoms")
        
        # Create binary matrix
        binary_data = []
        
        for _, row in df.iterrows():
            disease = row['Disease']
            symptoms = [str(s).strip() for s in row[1:] if pd.notna(s)]
            
            # Create binary vector
            binary_row = [1 if symptom in symptoms else 0 for symptom in all_symptoms]
            binary_row.append(disease)
            binary_data.append(binary_row)
        
        # Create DataFrame
        columns = all_symptoms + ['prognosis']
        binary_df = pd.DataFrame(binary_data, columns=columns)
        
        # Split into train and test
        train_df, test_df = train_test_split(binary_df, test_size=0.2, random_state=42, stratify=binary_df['prognosis'])
        
        print(f"✅ Training set: {train_df.shape}")
        print(f"✅ Testing set: {test_df.shape}")
        
        return train_df, test_df
    
    def load_supporting_data(self):
        """Load symptom descriptions, precautions, and severity"""
        print("📚 Loading supporting data...")
        
        # Load symptom descriptions
        desc_file = os.path.join(self.archive1_path, 'symptom_Description.csv')
        if os.path.exists(desc_file):
            desc_df = pd.read_csv(desc_file)
            self.disease_descriptions = dict(zip(desc_df['Disease'], desc_df['Description']))
            print(f"✅ Loaded descriptions for {len(self.disease_descriptions)} diseases")
        
        # Load precautions
        precaution_file = os.path.join(self.archive1_path, 'symptom_precaution.csv')
        if os.path.exists(precaution_file):
            prec_df = pd.read_csv(precaution_file)
            self.disease_precautions = {}
            for _, row in prec_df.iterrows():
                precautions = [row[col] for col in prec_df.columns[1:] if pd.notna(row[col])]
                self.disease_precautions[row['Disease']] = precautions
            print(f"✅ Loaded precautions for {len(self.disease_precautions)} diseases")
        
        # Load symptom severity
        severity_file = os.path.join(self.archive1_path, 'Symptom-severity.csv')
        if os.path.exists(severity_file):
            sev_df = pd.read_csv(severity_file)
            self.symptom_severity = dict(zip(sev_df['Symptom'], sev_df['weight']))
            print(f"✅ Loaded severity for {len(self.symptom_severity)} symptoms")
    
    def prepare_data(self):
        """Prepare data for training"""
        print("🔧 Preparing data for training...")
        
        # Get column names
        all_columns = list(self.train_data.columns)
        
        # Find the prognosis/disease column (usually last column)
        possible_target_cols = ['prognosis', 'Disease', 'disease', 'label']
        target_col = None
        
        for col in possible_target_cols:
            if col in all_columns:
                target_col = col
                break
        
        if target_col is None:
            # Assume last column is target
            target_col = all_columns[-1]
        
        # Separate features and target
        feature_cols = [col for col in all_columns if col != target_col]
        
        self.X_train = self.train_data[feature_cols].values
        self.y_train = self.train_data[target_col].values
        
        # For test data, ensure same columns
        if target_col not in self.test_data.columns:
            # Try to find similar column
            test_cols = list(self.test_data.columns)
            target_col_test = test_cols[-1]  # Assume last column
        else:
            target_col_test = target_col
        
        # Ensure test data has same feature columns as training data
        test_feature_cols = [col for col in self.test_data.columns if col != target_col_test]
        
        # If columns don't match, align them
        if set(test_feature_cols) != set(feature_cols):
            print(f"⚠️  Aligning test data columns with training data...")
            # Add missing columns with 0 values
            for col in feature_cols:
                if col not in self.test_data.columns:
                    self.test_data[col] = 0
            # Remove extra columns
            test_feature_cols = [col for col in feature_cols if col in self.test_data.columns]
        
        self.X_test = self.test_data[feature_cols].values
        self.y_test = self.test_data[target_col_test].values
        
        # Store symptom columns
        self.symptom_columns = feature_cols
        
        # Create symptom mapping
        for idx, symptom in enumerate(self.symptom_columns):
            cleaned_symptom = symptom.replace('_', ' ').replace('  ', ' ').strip()
            self.symptom_mapping[idx] = {
                'id': symptom,
                'label': cleaned_symptom.title(),
                'description': f"Patient experiencing {cleaned_symptom}",
                'severity': self.symptom_severity.get(symptom, 3)  # Default severity 3
            }
        
        # Encode labels
        self.label_encoder = LabelEncoder()
        self.y_train_encoded = self.label_encoder.fit_transform(self.y_train)
        
        # For test data, only include diseases that were in training
        # This handles cases where test data might have unseen diseases
        unique_test_diseases = set(self.y_test)
        unique_train_diseases = set(self.label_encoder.classes_)
        unseen_diseases = unique_test_diseases - unique_train_diseases
        
        if unseen_diseases:
            print(f"⚠️  Test data contains {len(unseen_diseases)} diseases not in training data")
            # Filter test data to only include known diseases
            mask = np.isin(self.y_test, list(unique_train_diseases))
            self.X_test = self.X_test[mask]
            self.y_test = self.y_test[mask]
            print(f"   Filtered test set to {len(self.y_test)} samples")
        
        self.y_test_encoded = self.label_encoder.transform(self.y_test)
        
        print(f"✅ Training samples: {len(self.X_train)}")
        print(f"✅ Testing samples: {len(self.X_test)}")
        print(f"✅ Number of symptoms: {len(self.symptom_columns)}")
        print(f"✅ Number of diseases: {len(self.label_encoder.classes_)}")
        
    def train_model(self):
        """Train Random Forest model with improved parameters"""
        print("🚀 Training Random Forest model with improved parameters...")
        
        # Initialize Random Forest with better parameters for accuracy
        self.model = RandomForestClassifier(
            n_estimators=300,  # Increased from 200 for better accuracy
            max_depth=None,  # Remove depth limit to capture complex patterns
            min_samples_split=3,  # Reduced from 5 for better granularity
            min_samples_leaf=1,  # Reduced from 2 for better fitting
            max_features='sqrt',  # Use sqrt of features for better generalization
            bootstrap=True,
            oob_score=True,  # Enable out-of-bag score
            random_state=42,
            n_jobs=-1,
            verbose=1,
            class_weight='balanced'  # Handle class imbalance
        )
        
        # Train model
        print("⏳ Training in progress...")
        self.model.fit(self.X_train, self.y_train_encoded)
        print("✅ Model training completed!")
        
        # Print OOB score if available
        if hasattr(self.model, 'oob_score_'):
            print(f"   Out-of-Bag Score: {self.model.oob_score_ * 100:.2f}%")
        
    def evaluate_model(self):
        """Evaluate model performance"""
        print("\n📊 Evaluating model...")
        
        # Make predictions
        y_pred = self.model.predict(self.X_test)
        
        # Calculate accuracy
        accuracy = accuracy_score(self.y_test_encoded, y_pred)
        print(f"\n🎯 Model Accuracy: {accuracy * 100:.2f}%")
        
        # Classification report
        print("\n📈 Classification Report:")
        print(classification_report(
            self.y_test_encoded, 
            y_pred, 
            target_names=self.label_encoder.classes_,
            zero_division=0
        ))
        
        # Feature importance
        feature_importance = pd.DataFrame({
            'symptom': self.symptom_columns,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("\n🔝 Top 10 Important Symptoms:")
        print(feature_importance.head(10).to_string(index=False))
        
        return accuracy
    
    def save_model(self):
        """Save trained model and related files"""
        print("\n💾 Saving model and configurations...")
        
        # Save model
        model_path = os.path.join(self.model_dir, 'disease_model.pkl')
        joblib.dump(self.model, model_path)
        print(f"✅ Model saved: {model_path}")
        
        # Save label encoder
        encoder_path = os.path.join(self.model_dir, 'label_encoder.pkl')
        joblib.dump(self.label_encoder, encoder_path)
        print(f"✅ Label encoder saved: {encoder_path}")
        
        # Save symptom mapping
        mapping_path = os.path.join(self.model_dir, 'symptom_mapping.json')
        with open(mapping_path, 'w', encoding='utf-8') as f:
            json.dump(self.symptom_mapping, f, indent=2, ensure_ascii=False)
        print(f"✅ Symptom mapping saved: {mapping_path}")
        
        # Save disease information
        disease_info = {}
        for disease in self.label_encoder.classes_:
            disease_info[disease] = {
                'description': self.disease_descriptions.get(disease, f"{disease} requires medical attention."),
                'precautions': self.disease_precautions.get(disease, [
                    "Consult a healthcare professional",
                    "Follow prescribed treatment",
                    "Monitor symptoms regularly"
                ])
            }
        
        info_path = os.path.join(self.model_dir, 'disease_info.json')
        with open(info_path, 'w', encoding='utf-8') as f:
            json.dump(disease_info, f, indent=2, ensure_ascii=False)
        print(f"✅ Disease information saved: {info_path}")
        
        # Save training metadata
        metadata = {
            'trained_at': datetime.now().isoformat(),
            'n_symptoms': len(self.symptom_columns),
            'n_diseases': len(self.label_encoder.classes_),
            'n_training_samples': len(self.X_train),
            'n_testing_samples': len(self.X_test),
            'model_type': 'RandomForestClassifier',
            'model_params': {
                'n_estimators': 200,
                'max_depth': 20,
                'min_samples_split': 5
            }
        }
        
        metadata_path = os.path.join(self.model_dir, 'model_metadata.json')
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2)
        print(f"✅ Metadata saved: {metadata_path}")
    
    def generate_symptom_categories(self):
        """Generate categorized symptom list for frontend"""
        print("\n📋 Generating symptom categories...")
        
        categories = {
            'General': ['fever', 'high_fever', 'fatigue', 'weight_loss', 'weight_gain', 'lethargy', 'malaise', 'sweating', 'chills', 'shivering', 'dehydration'],
            'Respiratory': ['cough', 'breathlessness', 'chest_pain', 'continuous_sneezing', 'runny_nose', 'congestion', 'throat_irritation', 'phlegm', 'rusty_sputum', 'mucoid_sputum', 'blood_in_sputum'],
            'Digestive': ['nausea', 'vomiting', 'diarrhoea', 'stomach_pain', 'abdominal_pain', 'constipation', 'acidity', 'indigestion', 'loss_of_appetite', 'belly_pain', 'stomach_bleeding', 'distention_of_abdomen'],
            'Neurological': ['headache', 'dizziness', 'spinning_movements', 'loss_of_balance', 'unsteadiness', 'lack_of_concentration', 'altered_sensorium', 'slurred_speech', 'loss_of_smell', 'weakness_of_one_body_side'],
            'Skin': ['itching', 'skin_rash', 'nodal_skin_eruptions', 'yellowish_skin', 'patches_in_throat', 'pus_filled_pimples', 'blackheads', 'scurring', 'skin_peeling', 'blister', 'red_sore_around_nose', 'yellow_crust_ooze', 'dischromic _patches'],
            'Musculoskeletal': ['joint_pain', 'muscle_pain', 'back_pain', 'neck_pain', 'knee_pain', 'hip_joint_pain', 'muscle_weakness', 'stiff_neck', 'swelling_joints', 'movement_stiffness', 'muscle_wasting', 'painful_walking'],
            'Cardiovascular': ['palpitations', 'fast_heart_rate', 'chest_pain', 'breathlessness', 'prominent_veins_on_calf'],
            'Urinary': ['burning_micturition', 'spotting_ urination', 'bladder_discomfort', 'foul_smell_of urine', 'continuous_feel_of_urine', 'passage_of_gases', 'internal_itching'],
            'Eyes': ['redness_of_eyes', 'watering_from_eyes', 'blurred_and_distorted_vision', 'visual_disturbances', 'yellowing_of_eyes', 'sunken_eyes'],
            'Mental Health': ['anxiety', 'restlessness', 'depression', 'irritability', 'mood_swings'],
            'Other': []
        }
        
        categorized_symptoms = {cat: [] for cat in categories}
        uncategorized = []
        
        for symptom_id, symptom_data in self.symptom_mapping.items():
            symptom = symptom_data['id']
            found = False
            
            for category, symptom_list in categories.items():
                if symptom in symptom_list:
                    categorized_symptoms[category].append({
                        'id': symptom_data['id'],
                        'label': symptom_data['label'],
                        'description': symptom_data['description'],
                        'severity': symptom_data['severity']
                    })
                    found = True
                    break
            
            if not found:
                uncategorized.append({
                    'id': symptom_data['id'],
                    'label': symptom_data['label'],
                    'description': symptom_data['description'],
                    'severity': symptom_data['severity']
                })
        
        categorized_symptoms['Other'] = uncategorized
        
        # Remove empty categories
        categorized_symptoms = {k: v for k, v in categorized_symptoms.items() if v}
        
        # Save categorized symptoms
        output_path = os.path.join(self.data_dir, 'categorized_symptoms.json')
        output_structure = {
            'categories': [
                {'name': category, 'symptoms': symptoms}
                for category, symptoms in categorized_symptoms.items()
            ]
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_structure, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Categorized symptoms saved: {output_path}")
        print(f"📊 Total categories: {len(categorized_symptoms)}")
        for category, symptoms in categorized_symptoms.items():
            print(f"   - {category}: {len(symptoms)} symptoms")
    
    def run_complete_training(self):
        """Run complete training pipeline"""
        print("=" * 60)
        print("🏥 CLINIXSOL - Disease Prediction Model Training")
        print("=" * 60)
        print()
        
        # Load datasets
        if not self.load_datasets():
            print("❌ Failed to load datasets")
            return False
        
        # Prepare data
        self.prepare_data()
        
        # Train model
        self.train_model()
        
        # Evaluate model
        accuracy = self.evaluate_model()
        
        # Save everything
        self.save_model()
        
        # Generate symptom categories
        self.generate_symptom_categories()
        
        print("\n" + "=" * 60)
        print(f"✅ TRAINING COMPLETED SUCCESSFULLY!")
        print(f"🎯 Final Accuracy: {accuracy * 100:.2f}%")
        print("=" * 60)
        
        return True

if __name__ == '__main__':
    trainer = DiseaseModelTrainer()
    success = trainer.run_complete_training()
    
    if not success:
        print("\n❌ Training failed!")
        sys.exit(1)
    
    print("\n✅ Model is ready to use!")
    print("🚀 Start the ML service with: python app/main.py")
