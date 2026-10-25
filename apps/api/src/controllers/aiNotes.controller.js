/**
 * AI Notes Controller
 * Handles AI-powered clinical note generation
 */

const aiNotesService = require('../services/aiNotes.service');
const clinicalNotesService = require('../services/clinicalNotes.service');

const getAuthenticatedUserId = (req) => req.user?.userId || req.user?._id;

class AINotesController {
  /**
   * Generate AI-powered clinical note
   */
  async generateAINote(req, res, next) {
    try {
      const doctorId = getAuthenticatedUserId(req);
      const { patient, rawTranscript, previousNotes, patientHistory } = req.body;

      if (!rawTranscript || rawTranscript.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Raw transcript is required'
        });
      }

      // Fetch patient data
      const patientData = await clinicalNotesService.getPatientData(patient);

      // Prepare context for AI
      const context = {
        transcript: rawTranscript,
        patientAge: patientData.age,
        patientGender: patientData.gender,
        pastMedicalHistory: patientHistory?.pastConditions || patientData.medicalHistory || [],
        currentMedications: patientHistory?.currentMedications || patientData.currentMedications || [],
        allergies: patientHistory?.allergies || patientData.allergies || [],
        previousVisits: []
      };

      // Fetch previous notes if provided
      if (previousNotes && previousNotes.length > 0) {
        const prevNotes = await clinicalNotesService.getNotesByIds(previousNotes);
        context.previousVisits = prevNotes.map(note => ({
          date: note.visitDate,
          chiefComplaint: note.subjective?.chiefComplaint,
          diagnosis: note.assessment?.primaryDiagnosis?.description
        }));
      }

      // Call ML service to generate note
      const generatedNote = await aiNotesService.processNoteGeneration(context);

      // Check for contraindications and warnings
      const warnings = await aiNotesService.checkContraindications(
        generatedNote,
        context.allergies,
        context.currentMedications
      );

      generatedNote.warnings = warnings;

      return res.status(200).json({
        success: true,
        message: 'AI note generated successfully',
        data: { generatedNote }
      });
    } catch (error) {
      console.error('Error generating AI note:', error);
      next(error);
    }
  }
}

module.exports = new AINotesController();
