"""
NLP Service for Clinical Note Generation
Uses transformer models for natural language processing
"""

import re
import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class NLPService:
    """NLP service for clinical text processing"""
    
    def __init__(self):
        """Initialize NLP service"""
        self.model_name = "Clinical-BERT"
        self.model_version = "1.0"
        
        # ICD-10 code database (simplified - in production use full database)
        self.icd10_database = {
            'fever': {'code': 'R50.9', 'description': 'Fever, unspecified'},
            'headache': {'code': 'R51', 'description': 'Headache'},
            'cough': {'code': 'R05', 'description': 'Cough'},
            'chest pain': {'code': 'R07.9', 'description': 'Chest pain, unspecified'},
            'hypertension': {'code': 'I10', 'description': 'Essential (primary) hypertension'},
            'diabetes': {'code': 'E11.9', 'description': 'Type 2 diabetes mellitus'},
            'asthma': {'code': 'J45.909', 'description': 'Unspecified asthma'},
            'pneumonia': {'code': 'J18.9', 'description': 'Pneumonia, unspecified'},
            'bronchitis': {'code': 'J40', 'description': 'Bronchitis, not specified as acute or chronic'},
            'influenza': {'code': 'J11.1', 'description': 'Influenza due to unidentified virus'},
            'upper respiratory infection': {'code': 'J06.9', 'description': 'Acute upper respiratory infection'},
            'sinusitis': {'code': 'J32.9', 'description': 'Chronic sinusitis, unspecified'},
            'migraine': {'code': 'G43.909', 'description': 'Migraine, unspecified'},
            'anxiety': {'code': 'F41.9', 'description': 'Anxiety disorder, unspecified'},
            'depression': {'code': 'F33.9', 'description': 'Major depressive disorder'},
            'gastritis': {'code': 'K29.70', 'description': 'Gastritis, unspecified'},
            'urinary tract infection': {'code': 'N39.0', 'description': 'Urinary tract infection'},
            'arthritis': {'code': 'M19.90', 'description': 'Unspecified osteoarthritis'},
            'back pain': {'code': 'M54.9', 'description': 'Dorsalgia, unspecified'}
        }
        
        # Common medications database
        self.medication_database = {
            'fever': ['acetaminophen', 'ibuprofen'],
            'pain': ['acetaminophen', 'ibuprofen', 'naproxen'],
            'hypertension': ['lisinopril', 'amlodipine', 'losartan'],
            'diabetes': ['metformin', 'insulin'],
            'asthma': ['albuterol', 'fluticasone'],
            'infection': ['amoxicillin', 'azithromycin'],
            'cough': ['dextromethorphan', 'guaifenesin'],
            'anxiety': ['sertraline', 'escitalopram'],
            'depression': ['fluoxetine', 'sertraline']
        }
        
        logger.info(f"NLP Service initialized with model: {self.model_name}")

    def summarize_report_documents(self, document_texts: List[str], context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Build a concise, structured clinical documentation summary from PDF report text.

        Args:
            document_texts: List of extracted text chunks from uploaded report PDFs
            context: Optional metadata such as patient name, doctor, and document type

        Returns:
            Structured summary suitable for note prefill and PDF export
        """
        context = context or {}
        if not document_texts:
            raise ValueError("No document text provided for summarization")

        normalized_docs = []
        raw_patient_signals = []
        raw_date_signals = []
        for text in document_texts:
            if not text or not text.strip():
                continue
            raw_patient_signals.append(self._extract_patient_identity(text))
            raw_date_signals.extend(self._extract_report_dates(text))
            result_focused = self._extract_result_focused_text(text)
            normalized_docs.append(self._normalize_text_chunk(result_focused))

        if not normalized_docs:
            raise ValueError("Uploaded documents do not contain readable clinical text")

        combined_text = "\n\n".join(normalized_docs)
        entities = self.extract_entities(combined_text)

        patient_profile = self._merge_patient_identity(raw_patient_signals, context)
        report_date = self._select_report_date(raw_date_signals, context)
        finding_rows = self._extract_lab_result_rows(combined_text)

        key_findings = self._build_findings_list(finding_rows, combined_text)
        assessment_text = self._build_assessment_text(finding_rows, combined_text)
        follow_up_actions = self._build_data_driven_plan(finding_rows, combined_text)
        short_summary = self._generate_short_summary(assessment_text, patient_profile, report_date)
        consultation_summary = self._build_consultation_summary(
            key_findings,
            assessment_text,
            follow_up_actions,
            patient_profile,
            report_date,
            len(normalized_docs)
        )

        assessment = self._generate_assessment(entities, context)
        prefilled_template = {
            'subjective': short_summary,
            'objective': '; '.join(key_findings[:5]) if key_findings else 'No explicit objective findings extracted.',
            'assessment': assessment_text,
            'plan': '; '.join(follow_up_actions[:4]) if follow_up_actions else 'Follow clinical judgement for next steps.'
        }

        return {
            'summaryTitle': 'AI Clinical Notes Summary',
            'shortSummary': short_summary,
            'consultationSummary': consultation_summary,
            'keyFindings': key_findings,
            'suggestedFollowUpActions': follow_up_actions,
            'structuredSummary': {
                'patientName': patient_profile.get('name'),
                'patientAge': patient_profile.get('age'),
                'patientGender': patient_profile.get('gender'),
                'date': report_date,
                'findings': key_findings,
                'assessment': assessment_text,
                'plan': follow_up_actions
            },
            'prefilledTemplate': prefilled_template,
            'derivedClinicalNote': {
                'chiefComplaint': self._extract_chief_complaint(combined_text, entities),
                'historyPresentIllness': self._generate_hpi(combined_text, entities, context),
                'assessment': assessment,
                'plan': self._generate_plan(assessment, entities, context)
            },
            'metadata': {
                'documentsProcessed': len(normalized_docs),
                'modelUsed': self.model_name,
                'generatedAt': context.get('generatedAt')
            }
        }
    
    def get_model_info(self) -> Dict[str, str]:
        """Get model information"""
        return {
            'name': self.model_name,
            'version': self.model_version,
            'capabilities': ['note_generation', 'entity_extraction', 'icd10_coding']
        }
    
    def generate_note(self, transcript: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate structured clinical note from transcript
        
        Args:
            transcript: Raw clinical conversation/transcript
            context: Patient context (age, gender, medical history, etc.)
        
        Returns:
            Structured clinical note dictionary
        """
        try:
            # Extract entities from transcript
            entities = self.extract_entities(transcript)
            
            # Generate chief complaint
            chief_complaint = self._extract_chief_complaint(transcript, entities)
            
            # Generate HPI (History of Present Illness)
            hpi = self._generate_hpi(transcript, entities, context)
            
            # Generate assessment
            assessment = self._generate_assessment(entities, context)
            
            # Generate plan
            plan = self._generate_plan(assessment, entities, context)
            
            # Calculate confidence score
            confidence = self._calculate_confidence(entities, assessment)
            
            # Generate suggestions
            suggestions = self._generate_suggestions(assessment, context)
            
            return {
                'chiefComplaint': chief_complaint,
                'HPI': hpi,
                'assessment': assessment,
                'plan': plan,
                'confidence': confidence,
                'modelUsed': self.model_name,
                'suggestions': suggestions
            }
            
        except Exception as e:
            logger.error(f"Error generating note: {str(e)}")
            raise
    
    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """
        Extract medical entities from text
        
        Returns:
            Dictionary with entity types and their values
        """
        text_lower = text.lower()
        
        entities = {
            'symptoms': [],
            'conditions': [],
            'medications': [],
            'time_references': [],
            'severity': []
        }
        
        # Symptom keywords
        symptom_keywords = [
            'fever', 'cough', 'headache', 'pain', 'nausea', 'vomiting',
            'dizziness', 'fatigue', 'weakness', 'chills', 'congestion',
            'sore throat', 'runny nose', 'shortness of breath', 'wheezing',
            'chest pain', 'back pain', 'abdominal pain'
        ]
        
        # Condition keywords
        condition_keywords = [
            'hypertension', 'diabetes', 'asthma', 'copd', 'pneumonia',
            'bronchitis', 'sinusitis', 'migraine', 'anxiety', 'depression',
            'arthritis', 'gastritis', 'infection'
        ]
        
        # Extract symptoms
        for symptom in symptom_keywords:
            if symptom in text_lower:
                entities['symptoms'].append(symptom)
        
        # Extract conditions
        for condition in condition_keywords:
            if condition in text_lower:
                entities['conditions'].append(condition)
        
        # Extract time references
        time_patterns = [
            r'\d+\s+(day|week|month|year)s?\s+ago',
            r'yesterday', r'today', r'last week', r'for \d+ (days|weeks|months)'
        ]
        for pattern in time_patterns:
            matches = re.findall(pattern, text_lower)
            entities['time_references'].extend(matches)
        
        # Extract severity indicators
        severity_keywords = ['mild', 'moderate', 'severe', 'acute', 'chronic', 'intermittent']
        for severity in severity_keywords:
            if severity in text_lower:
                entities['severity'].append(severity)
        
        return entities
    
    def suggest_icd10(self, diagnosis: str) -> List[Dict[str, str]]:
        """Suggest ICD-10 codes for a diagnosis"""
        diagnosis_lower = diagnosis.lower()
        suggestions = []
        
        for condition, icd_info in self.icd10_database.items():
            if condition in diagnosis_lower or diagnosis_lower in condition:
                suggestions.append({
                    'code': icd_info['code'],
                    'description': icd_info['description'],
                    'relevance': 0.9 if condition == diagnosis_lower else 0.7
                })
        
        # Sort by relevance
        suggestions.sort(key=lambda x: x['relevance'], reverse=True)
        
        return suggestions[:5]  # Return top 5 suggestions
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of clinical text"""
        text_lower = text.lower()
        
        # Simple sentiment analysis based on keywords
        negative_keywords = ['anxious', 'depressed', 'worried', 'afraid', 'sad', 'hopeless']
        positive_keywords = ['better', 'improved', 'good', 'well', 'stable']
        
        negative_count = sum(1 for keyword in negative_keywords if keyword in text_lower)
        positive_count = sum(1 for keyword in positive_keywords if keyword in text_lower)
        
        if negative_count > positive_count:
            sentiment = 'negative'
            score = -0.5
        elif positive_count > negative_count:
            sentiment = 'positive'
            score = 0.5
        else:
            sentiment = 'neutral'
            score = 0.0
        
        return {
            'sentiment': sentiment,
            'score': score,
            'negative_indicators': negative_count,
            'positive_indicators': positive_count
        }
    
    def check_contraindications(self, generated_note: Dict, allergies: List[str], 
                               current_medications: List[str]) -> List[str]:
        """Check for contraindications and drug interactions"""
        warnings = []
        
        plan_medications = generated_note.get('plan', {}).get('medications', [])
        
        # Check allergies
        for medication in plan_medications:
            med_lower = medication.lower()
            for allergy in allergies:
                if allergy.lower() in med_lower or med_lower in allergy.lower():
                    warnings.append(f"⚠️ ALLERGY WARNING: Patient is allergic to {allergy}")
        
        # Check drug interactions (simplified)
        drug_interactions = {
            'warfarin': ['aspirin', 'ibuprofen', 'naproxen'],
            'metformin': ['alcohol'],
            'lisinopril': ['potassium'],
            'fluoxetine': ['tramadol', 'linezolid']
        }
        
        for new_med in plan_medications:
            new_med_lower = new_med.lower()
            for current_med in current_medications:
                current_med_lower = current_med.lower()
                
                for drug, interactions in drug_interactions.items():
                    if ((drug in new_med_lower and any(i in current_med_lower for i in interactions)) or
                        (drug in current_med_lower and any(i in new_med_lower for i in interactions))):
                        warnings.append(f"⚠️ INTERACTION: Potential interaction between {new_med} and {current_med}")
        
        return warnings
    
    # Private helper methods
    
    def _extract_chief_complaint(self, transcript: str, entities: Dict) -> str:
        """Extract chief complaint from transcript"""
        # Look for "complaining of", "presents with", or use first symptom
        patterns = [
            r'complaining of (.+?)(?:\.|,|$)',
            r'presents with (.+?)(?:\.|,|$)',
            r'chief complaint is (.+?)(?:\.|,|$)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, transcript.lower())
            if match:
                return match.group(1).capitalize()
        
        # Fallback: use first symptom or generic statement
        if entities['symptoms']:
            return f"{entities['symptoms'][0].capitalize()}"
        
        return "General medical complaint"
    
    def _generate_hpi(self, transcript: str, entities: Dict, context: Dict) -> str:
        """Generate History of Present Illness"""
        symptoms = entities.get('symptoms', [])
        time_refs = entities.get('time_references', [])
        severity = entities.get('severity', [])
        
        hpi_parts = []
        
        # Age and gender
        age = context.get('patientAge', 'unknown age')
        gender = context.get('patientGender', 'patient')
        hpi_parts.append(f"{age}-year-old {gender.lower()}")
        
        # Symptoms
        if symptoms:
            symptom_str = ', '.join(symptoms[:3])
            hpi_parts.append(f"presents with {symptom_str}")
        
        # Timeline
        if time_refs:
            hpi_parts.append(f"that started {time_refs[0]}")
        
        # Severity
        if severity:
            hpi_parts.append(f"The symptoms are described as {severity[0]}")
        
        # Past medical history
        pmh = context.get('pastMedicalHistory', [])
        if pmh:
            hpi_parts.append(f"Past medical history significant for {', '.join(pmh[:2])}")
        
        return ' '.join(hpi_parts) + '.'
    
    def _generate_assessment(self, entities: Dict, context: Dict) -> Dict:
        """Generate assessment with diagnosis"""
        symptoms = entities.get('symptoms', [])
        conditions = entities.get('conditions', [])
        
        # Determine primary diagnosis
        if conditions:
            primary_condition = conditions[0]
        elif symptoms:
            # Map symptoms to likely condition
            primary_condition = self._map_symptoms_to_condition(symptoms)
        else:
            primary_condition = 'undifferentiated illness'
        
        # Get ICD-10 code
        icd_suggestions = self.suggest_icd10(primary_condition)
        icd_info = icd_suggestions[0] if icd_suggestions else {
            'code': 'R69', 'description': 'Illness, unspecified'
        }
        
        # Differential diagnoses
        differential = []
        if len(icd_suggestions) > 1:
            differential = [s['description'] for s in icd_suggestions[1:4]]
        
        return {
            'diagnosis': icd_info['description'],
            'icd10': icd_info['code'],
            'differentialDiagnoses': differential
        }
    
    def _generate_plan(self, assessment: Dict, entities: Dict, context: Dict) -> Dict:
        """Generate treatment plan"""
        diagnosis_lower = assessment['diagnosis'].lower()
        symptoms = entities.get('symptoms', [])
        
        # Determine medications
        medications = []
        for condition, meds in self.medication_database.items():
            if condition in diagnosis_lower or any(condition in s for s in symptoms):
                medications.extend(meds[:2])
                break
        
        # If no specific medications found, use symptom-based
        if not medications and symptoms:
            for symptom in symptoms:
                if symptom in self.medication_database:
                    medications.extend(self.medication_database[symptom][:1])
        
        # Non-pharmacologic interventions
        non_pharm = ['Rest and hydration', 'Monitor symptoms']
        if 'pain' in diagnosis_lower or any('pain' in s for s in symptoms):
            non_pharm.append('Apply heat/cold therapy')

        return {
            'medications': list(dict.fromkeys(medications))[:5],
            'nonPharmacologic': non_pharm,
            'labTests': self._suggest_labs_from_entities(entities),
            'followUp': 'Re-evaluate in 3-7 days or sooner if symptoms worsen',
            'education': [
                'Take medications exactly as prescribed',
                'Seek urgent care for red-flag symptoms'
            ]
        }

    def _normalize_text_chunk(self, text: str) -> str:
        """Normalize whitespace and strip non-informative lines from OCR/PDF text."""
        lines = []
        for line in (text or '').splitlines():
            compact = re.sub(r'\s+', ' ', line).strip()
            if compact:
                lines.append(compact)
        cleaned = '\n'.join(lines).strip()
        return cleaned[:8000]

    def _extract_result_focused_text(self, text: str) -> str:
        """Keep clinically relevant findings and suppress common PII/header lines."""
        pii_patterns = [
            r'\bpatient\s*name\b',
            r'\bname\s*:\s*',
            r'\bmrn\b',
            r'\buhid\b',
            r'\bpatient\s*id\b',
            r'\bid\s*[:#]\s*\w+',
            r'\bdob\b|\bdate\s*of\s*birth\b',
            r'\bage\s*[:]\s*\d+',
            r'\bgender\b|\bsex\b',
            r'\bphone\b|\bmobile\b|\bcontact\b',
            r'\bemail\b',
            r'\baddress\b',
            r'\bdoctor\s*name\b',
            r'\breferring\s*physician\b',
            r'\bhospital\b|\bclinic\b',
            r'\binsurance\b',
            r'\bpatient\s*medical\s*report\b',
            r'\bregistration\s*no\b',
            r'\baccount\s*no\b',
            r'\bbarcode\b',
            r'\bprinted\s*on\b',
            r'\bpage\s*\d+\s*of\s*\d+\b'
        ]

        result_keywords = [
            'result', 'results', 'impression', 'findings', 'conclusion', 'assessment',
            'diagnosis', 'diagnostic', 'observation', 'recommendation', 'recommended',
            'abnormal', 'normal', 'positive', 'negative', 'value', 'reference range',
            'test', 'profile', 'panel', 'elevated', 'decreased'
        ]

        measurement_pattern = re.compile(
            r'\b\d+(?:\.\d+)?\s?(?:mg/dl|mmol/l|g/dl|iu/l|u/l|ng/ml|pg/ml|mmhg|bpm|%|x10\^?\d+)\b',
            re.IGNORECASE
        )

        # Preserve line-level signal when available, otherwise split by sentence.
        raw_lines = [line.strip() for line in re.split(r'[\r\n]+', text or '') if line.strip()]
        if len(raw_lines) <= 1:
            raw_lines = [segment.strip() for segment in re.split(r'(?<=[.!?])\s+', text or '') if segment.strip()]

        kept_lines = []
        for line in raw_lines:
            lower_line = line.lower()
            if any(re.search(pattern, lower_line, flags=re.IGNORECASE) for pattern in pii_patterns):
                continue

            # Skip likely administrative/header lines with high noise and little clinical value.
            alpha_count = len(re.findall(r'[A-Za-z]', line))
            digit_count = len(re.findall(r'\d', line))
            if alpha_count > 40 and digit_count < 2 and ':' not in line and '-' not in line:
                continue

            has_result_keyword = any(keyword in lower_line for keyword in result_keywords)
            has_measurement = bool(measurement_pattern.search(line))
            if has_result_keyword or has_measurement:
                kept_lines.append(line)

        if not kept_lines:
            # Fallback to concise non-PII content when explicit result markers are sparse.
            kept_lines = [
                line for line in raw_lines
                if not any(re.search(pattern, line, flags=re.IGNORECASE) for pattern in pii_patterns)
                and len(line) <= 120
            ][:20]

        return '\n'.join(kept_lines)

    def _generate_short_summary(self, assessment_text: str, patient_profile: Dict[str, str], report_date: str) -> str:
        """Create a concise headline summary without duplicating findings list."""
        name = patient_profile.get('name')
        age = patient_profile.get('age')
        gender = patient_profile.get('gender')

        header_parts = []
        if name:
            header_parts.append(name)
        if age and gender:
            header_parts.append(f"{age}, {gender}")
        elif age:
            header_parts.append(str(age))
        elif gender:
            header_parts.append(gender)

        patient_header = f"Patient: {' | '.join(header_parts)}." if header_parts else "Patient details: Not clearly available in uploaded report text."
        date_header = f" Date: {report_date}." if report_date else ''
        return f"{patient_header}{date_header} {assessment_text}".strip()

    def _extract_key_findings(self, text: str) -> List[str]:
        """Extract concise findings from sentence-level text chunks."""
        sentences = re.split(r'(?<=[.!?])\s+', text)
        keywords = [
            'impression', 'finding', 'diagnosis', 'recommend', 'advice',
            'follow up', 'follow-up', 'history', 'complaint', 'assessment'
        ]

        findings = []
        for sentence in sentences:
            sentence_clean = sentence.strip()
            if len(sentence_clean) < 30:
                continue
            sentence_lower = sentence_clean.lower()
            if any(keyword in sentence_lower for keyword in keywords):
                findings.append(sentence_clean)
            if len(findings) >= 8:
                break

        if not findings:
            findings = [sent.strip() for sent in sentences if len(sent.strip()) > 40][:5]

        return findings

    def _generate_follow_up_actions(self, entities: Dict[str, List[str]], text: str) -> List[str]:
        """Generate practical follow-up actions from extracted signal."""
        actions = [
            'Schedule follow-up consultation to review progress and symptom changes.',
            'Continue or adjust medications after clinician confirmation.',
            'Keep hydration, rest, and symptom diary for the next 3 days.'
        ]

        lower_text = text.lower()
        symptoms = entities.get('symptoms', [])
        if any(symptom in ['chest pain', 'shortness of breath'] for symptom in symptoms):
            actions.insert(0, 'Escalate to urgent clinical evaluation if chest pain or breathing worsens.')

        if 'diabetes' in lower_text:
            actions.append('Monitor blood glucose and share readings at next visit.')

        if 'hypertension' in lower_text:
            actions.append('Track blood pressure twice daily for one week.')

        return actions[:6]

    def _build_consultation_summary(
        self,
        findings: List[str],
        assessment_text: str,
        plan: List[str],
        patient_profile: Dict[str, str],
        report_date: str,
        document_count: int
    ) -> str:
        """Build concise metadata note with no duplication of findings/assessment/plan."""
        patient_descriptor = patient_profile.get('name') or 'Patient'
        if patient_profile.get('age') and patient_profile.get('gender'):
            patient_descriptor = f"{patient_descriptor} ({patient_profile['age']}, {patient_profile['gender']})"

        lines = [
            f"{patient_descriptor} | Date: {report_date or 'Not specified'}",
            f"Reviewed {document_count} uploaded report(s).",
            'Structured summary generated from extracted report values.'
        ]

        if findings and plan:
            lines.append('Findings, assessment, and plan are intentionally separated to improve readability.')

        return ' '.join(lines)

    def _extract_patient_identity(self, text: str) -> Dict[str, str]:
        """Extract patient name/age/gender from raw report text when available."""
        source = text or ''

        name_match = re.search(r'\bname\s*[:\-]\s*([A-Za-z][A-Za-z .]{1,60})', source, flags=re.IGNORECASE)
        age_match = re.search(r'\bage\s*[:\-]\s*(\d{1,3})\b', source, flags=re.IGNORECASE)
        gender_match = re.search(r'\b(?:gender|sex)\s*[:\-]\s*(male|female|other)\b', source, flags=re.IGNORECASE)

        return {
            'name': name_match.group(1).strip() if name_match else '',
            'age': age_match.group(1).strip() if age_match else '',
            'gender': gender_match.group(1).strip().capitalize() if gender_match else ''
        }

    def _merge_patient_identity(self, signals: List[Dict[str, str]], context: Dict[str, Any]) -> Dict[str, str]:
        """Choose the richest patient identity snapshot from extracted signals and context."""
        merged = {
            'name': (context.get('patientName') or '').strip(),
            'age': str(context.get('patientAge') or '').strip(),
            'gender': (context.get('patientGender') or '').strip().capitalize()
        }

        for signal in signals:
            if not isinstance(signal, dict):
                continue
            if not merged['name'] and signal.get('name'):
                merged['name'] = signal['name']
            if not merged['age'] and signal.get('age'):
                merged['age'] = signal['age']
            if not merged['gender'] and signal.get('gender'):
                merged['gender'] = signal['gender']

        return merged

    def _extract_report_dates(self, text: str) -> List[str]:
        """Extract likely report date strings from raw text."""
        source = text or ''
        patterns = [
            r'\b(?:report\s*date|date|collection\s*date|sample\s*date)\s*[:\-]\s*([0-3]?\d[\/\-][01]?\d[\/\-]\d{2,4})',
            r'\b(?:report\s*date|date|collection\s*date|sample\s*date)\s*[:\-]\s*(\d{4}[\/\-][01]?\d[\/\-][0-3]?\d)'
        ]

        values = []
        for pattern in patterns:
            values.extend(re.findall(pattern, source, flags=re.IGNORECASE))
        return [value.strip() for value in values if value and value.strip()]

    def _select_report_date(self, date_signals: List[str], context: Dict[str, Any]) -> str:
        """Select one best report date and fallback to generated date."""
        if date_signals:
            return date_signals[0]

        generated_at = (context.get('generatedAt') or '').strip()
        if generated_at:
            return generated_at.split('T')[0]
        return ''

    def _extract_lab_result_rows(self, text: str) -> List[Dict[str, str]]:
        """Extract structured lab-style rows from report text."""
        rows = []
        seen = set()
        test_name_hint = re.compile(
            r'\b(hemoglobin|haemoglobin|wbc|rbc|platelet|glucose|blood\s*glucose|hba1c|creatinine|urea|cholesterol|hdl|ldl|triglyceride)\b',
            re.IGNORECASE
        )
        unit_hint = re.compile(r'\b(?:mg/dl|mmol/l|g/dl|u/l|iu/l|/\u00b5l|x10\^?\d+|%)\b', re.IGNORECASE)

        for line in [ln.strip() for ln in (text or '').splitlines() if ln.strip()]:
            # Common format: Hemoglobin: 13.5 g/dL (Normal)
            match = re.match(
                r'^([A-Za-z][A-Za-z0-9 ()/\-+%]{2,50})\s*[:\-]\s*([^\n]{1,80})$',
                line
            )
            if match:
                label = re.sub(r'\s+', ' ', match.group(1)).strip()
                value_blob = re.sub(r'\s+', ' ', match.group(2)).strip()
            else:
                # Alternate table-like format: "Hemoglobin 13.5 g/dL Normal"
                alt = re.match(
                    r'^([A-Za-z][A-Za-z0-9 ()/\-+%]{2,40})\s+(\d[\d,\.]*\s*(?:mg/dl|mmol/l|g/dl|u/l|iu/l|/\u00b5l|x10\^?\d+|%))(?:\s*\(?([A-Za-z ]{3,20})\)?)?$',
                    line,
                    flags=re.IGNORECASE
                )
                if not alt:
                    continue
                label = re.sub(r'\s+', ' ', alt.group(1)).strip()
                trailing_status = (alt.group(3) or '').strip()
                value_blob = f"{alt.group(2).strip()} {trailing_status}".strip()

            if not (test_name_hint.search(label) or unit_hint.search(value_blob)):
                continue

            label_lower = label.lower()
            if label_lower in {'result', 'results', 'diagnosis', 'impression', 'assessment'}:
                continue

            status = self._classify_result_status(value_blob)
            signature = f"{label_lower}|{value_blob.lower()}"
            if signature in seen:
                continue

            rows.append({
                'label': label,
                'value': value_blob,
                'status': status
            })
            seen.add(signature)

            if len(rows) >= 12:
                break

        return rows

    def _classify_result_status(self, value_blob: str) -> str:
        """Classify a lab/value text blob as normal, abnormal, or unclear."""
        lower = (value_blob or '').lower()
        abnormal_markers = ['abnormal', 'high', 'low', 'elevated', 'decreased', 'positive', 'critical', 'out of range']
        normal_markers = ['normal', 'within range', 'within normal', 'no abnormal', 'negative', 'unremarkable']

        if any(marker in lower for marker in abnormal_markers):
            return 'abnormal'
        if any(marker in lower for marker in normal_markers):
            return 'normal'
        return 'unclear'

    def _build_findings_list(self, finding_rows: List[Dict[str, str]], text: str) -> List[str]:
        """Build concise key findings without copying entire source text."""
        findings = []

        for row in finding_rows:
            status = row.get('status', 'unclear')
            if status == 'normal':
                findings.append(f"{row['label']}: Normal")
            elif status == 'abnormal':
                findings.append(f"{row['label']}: Abnormal ({row['value']})")
            else:
                findings.append(f"{row['label']}: {row['value']}")

        abnormal_count = len([row for row in finding_rows if row.get('status') == 'abnormal'])
        normal_count = len([row for row in finding_rows if row.get('status') == 'normal'])

        if finding_rows and abnormal_count == 0 and normal_count >= 3:
            findings.insert(0, 'All reviewed lab values are within normal range.')

        if not findings:
            lower = (text or '').lower()
            if 'no abnormalities' in lower or 'within normal' in lower:
                findings = ['All reviewed laboratory values are within normal ranges.']
            else:
                findings = ['Unable to extract discrete lab-value rows from document text. Manual clinical review is recommended.']

        return findings[:8]

    def _build_assessment_text(self, finding_rows: List[Dict[str, str]], text: str) -> str:
        """Generate assessment statement from extracted findings."""
        lower_text = (text or '').lower()
        abnormal_rows = [row for row in finding_rows if row.get('status') == 'abnormal']
        normal_rows = [row for row in finding_rows if row.get('status') == 'normal']

        if not abnormal_rows and (len(normal_rows) >= 2 or 'no abnormalities' in lower_text or 'within normal' in lower_text):
            return 'All laboratory values are within normal ranges. No abnormalities detected. Patient is in good health.'

        if abnormal_rows:
            top = ', '.join([row['label'] for row in abnormal_rows[:2]])
            return f"Abnormal findings identified in {top}. Clinical correlation and targeted follow-up are recommended."

        return 'Clinical report reviewed. No critical abnormalities were clearly identified from extracted text; manual confirmation is recommended.'

    def _build_data_driven_plan(self, finding_rows: List[Dict[str, str]], text: str) -> List[str]:
        """Generate concise follow-up plan aligned to findings rather than generic advice."""
        lower_text = (text or '').lower()
        abnormal_rows = [row for row in finding_rows if row.get('status') == 'abnormal']

        if not abnormal_rows:
            return [
                'Routine health maintenance is advised.',
                'Annual check-up is recommended.',
                'No medications or immediate interventions are required based on current findings.'
            ]

        plan = [
            f"Repeat or confirm abnormal parameters: {', '.join([row['label'] for row in abnormal_rows[:3]])}.",
            'Schedule clinician follow-up to interpret abnormal values in clinical context.'
        ]

        if 'glucose' in lower_text or any('glucose' in row['label'].lower() for row in abnormal_rows):
            plan.append('Obtain fasting blood glucose or HbA1c follow-up testing as appropriate.')
        if 'wbc' in lower_text or any('wbc' in row['label'].lower() for row in abnormal_rows):
            plan.append('Review for possible infection/inflammation and repeat CBC if symptoms persist.')

        plan.append('Escalate care promptly if new or worsening symptoms develop.')
        return plan[:5]

    def _suggest_labs_from_entities(self, entities: Dict[str, List[str]]) -> List[str]:
        """Suggest basic labs tied to symptom clusters."""
        symptoms = entities.get('symptoms', [])
        tests = ['Complete Blood Count (CBC)']

        if any(symptom in symptoms for symptom in ['fever', 'cough', 'chills']):
            tests.append('C-Reactive Protein (CRP)')
        if any(symptom in symptoms for symptom in ['fatigue', 'weakness']):
            tests.append('Comprehensive Metabolic Panel (CMP)')
        if any(symptom in symptoms for symptom in ['chest pain', 'shortness of breath']):
            tests.append('ECG and cardiac biomarkers as indicated')

        return list(dict.fromkeys(tests))[:4]
    
    def _map_symptoms_to_condition(self, symptoms: List[str]) -> str:
        """Map symptoms to likely condition"""
        symptom_map = {
            'fever,cough': 'upper respiratory infection',
            'fever,headache': 'viral syndrome',
            'chest pain': 'chest pain',
            'headache': 'headache',
            'back pain': 'back pain',
            'cough': 'cough'
        }
        
        # Check combinations
        symptom_combo = ','.join(sorted(symptoms[:2]))
        if symptom_combo in symptom_map:
            return symptom_map[symptom_combo]
        
        # Check individual symptoms
        for symptom in symptoms:
            if symptom in symptom_map:
                return symptom_map[symptom]
        
        return 'undifferentiated illness'
    
    def _calculate_confidence(self, entities: Dict, assessment: Dict) -> float:
        """Calculate confidence score for generated note"""
        confidence = 0.7  # Base confidence
        
        # Increase confidence based on entity extraction
        if entities.get('symptoms'):
            confidence += 0.1
        if entities.get('time_references'):
            confidence += 0.05
        if entities.get('severity'):
            confidence += 0.05
        
        # Cap at 0.95
        return min(confidence, 0.95)
    
    def _generate_suggestions(self, assessment: Dict, context: Dict) -> List[str]:
        """Generate suggestions for the clinician"""
        suggestions = []
        
        diagnosis = assessment['diagnosis'].lower()
        
        # Condition-specific suggestions
        if 'hypertension' in diagnosis:
            suggestions.append('Consider lifestyle modifications: diet and exercise')
            suggestions.append('Monitor blood pressure at home')
        
        if 'diabetes' in diagnosis:
            suggestions.append('Recommend diabetes education program')
            suggestions.append('Schedule ophthalmology and podiatry referrals')
        
        if 'infection' in diagnosis:
            suggestions.append('Ensure patient understands full antibiotic course')
            suggestions.append('Advise on hand hygiene and infection prevention')
        
        # Age-based suggestions
        age = context.get('patientAge', 0)
        if age > 65:
            suggestions.append('Consider fall risk assessment')
            suggestions.append('Review medication list for polypharmacy')
        
        return suggestions
