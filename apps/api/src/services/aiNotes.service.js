/**
 * AI Notes Service
 * Interacts with Python ML service for AI-powered note generation
 */

const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000/api/v1';

class AINotesService {
  /**
   * Process note generation using ML service
   */
  async processNoteGeneration(context) {
    try {
      const response = await axios.post(
        `${ML_SERVICE_URL}/generate-clinical-note`,
        {
          transcript: context.transcript,
          context: {
            patientAge: context.patientAge,
            patientGender: context.patientGender,
            pastMedicalHistory: context.pastMedicalHistory,
            currentMedications: context.currentMedications,
            allergies: context.allergies,
            previousVisits: context.previousVisits
          }
        },
        {
          timeout: 30000, // 30 seconds timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.success) {
        throw new Error('ML service failed to generate note');
      }

      return {
        chiefComplaint: response.data.generatedNote.chiefComplaint,
        HPI: response.data.generatedNote.historyPresentIllness,
        assessment: {
          diagnosis: response.data.generatedNote.assessment.diagnosis,
          icd10: response.data.generatedNote.assessment.icd10,
          differentialDiagnoses: response.data.generatedNote.assessment.differentialDiagnoses || []
        },
        plan: {
          medications: response.data.generatedNote.plan.medications || [],
          nonPharmacologic: response.data.generatedNote.plan.nonPharmacologic || [],
          labTests: response.data.generatedNote.plan.labTests || [],
          followUp: response.data.generatedNote.plan.followUp,
          education: response.data.generatedNote.plan.education || []
        },
        confidence: response.data.generatedNote.confidence || 0,
        modelUsed: response.data.generatedNote.modelUsed || 'Clinical-BERT',
        suggestions: response.data.generatedNote.suggestions || []
      };
    } catch (error) {
      console.error('Error calling ML service:', error.message);

      // If ML service is unavailable, throw appropriate error
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new Error('ML service is currently unavailable. Please try again later.');
      }

      throw error;
    }
  }

  /**
   * Check for contraindications and generate warnings
   */
  async checkContraindications(generatedNote, allergies, currentMedications) {
    const warnings = [];

    // Check medication allergies
    if (generatedNote.plan?.medications && allergies?.length > 0) {
      generatedNote.plan.medications.forEach(med => {
        allergies.forEach(allergy => {
          if (med.toLowerCase().includes(allergy.toLowerCase())) {
            warnings.push(`⚠️ ALLERGY WARNING: Patient is allergic to ${allergy}`);
          }
        });
      });
    }

    // Check drug interactions (simplified - in production use drug interaction database)
    if (generatedNote.plan?.medications && currentMedications?.length > 0) {
      const knownInteractions = {
        'warfarin': ['aspirin', 'ibuprofen'],
        'metformin': ['alcohol'],
        'lisinopril': ['potassium']
      };

      generatedNote.plan.medications.forEach(newMed => {
        currentMedications.forEach(currentMed => {
          Object.entries(knownInteractions).forEach(([drug, interactions]) => {
            if (
              (newMed.toLowerCase().includes(drug) && interactions.some(i => currentMed.toLowerCase().includes(i))) ||
              (currentMed.toLowerCase().includes(drug) && interactions.some(i => newMed.toLowerCase().includes(i)))
            ) {
              warnings.push(`⚠️ INTERACTION: Potential interaction between ${newMed} and ${currentMed}`);
            }
          });
        });
      });
    }

    return warnings;
  }

  /**
   * Get AI model health status
   */
  async getMLServiceHealth() {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
      return response.data;
    } catch (error) {
      return {
        status: 'unavailable',
        message: 'ML service is not responding'
      };
    }
  }
}

module.exports = new AINotesService();
