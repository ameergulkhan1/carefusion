/**
 * Clinical Notes Service
 * Business logic for clinical notes operations
 */

const ClinicalNote = require('../models/ClinicalNote.model');
const Patient = require('../models/Patient.model');
const Doctor = require('../models/Doctor');
const PDFDocument = require('pdfkit');

class ClinicalNotesService {
  /**
   * Create a new clinical note
   */
  async createClinicalNote(doctorId, noteData) {
    try {
      // Verify patient exists
      const patient = await Patient.findById(noteData.patient);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Auto-populate patient data if not provided
      if (!noteData.subjective?.pastMedicalHistory) {
        noteData.subjective = {
          ...noteData.subjective,
          pastMedicalHistory: patient.medicalHistory || [],
          currentMedications: patient.currentMedications || [],
          allergies: patient.allergies || []
        };
      }

      // Create note
      const note = await ClinicalNote.create({
        ...noteData,
        doctor: doctorId,
        createdBy: doctorId,
        lastModifiedBy: doctorId,
        version: 1
      });

      // Populate references
      await note.populate([
        { path: 'patient', select: 'name age gender' },
        { path: 'doctor', select: 'name specialization' }
      ]);

      return note;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get clinical notes with pagination and filters
   */
  async getNotes(filters, options) {
    try {
      const { page, limit } = options;
      const skip = (page - 1) * limit;

      const [notes, total] = await Promise.all([
        ClinicalNote.find({ ...filters, status: { $ne: 'deleted' } })
          .populate('patient', 'name age gender')
          .populate('doctor', 'name')
          .sort({ visitDate: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ClinicalNote.countDocuments({ ...filters, status: { $ne: 'deleted' } })
      ]);

      return {
        notes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a note by ID
   */
  async getNoteById(noteId) {
    try {
      const note = await ClinicalNote.findById(noteId)
        .populate('patient', 'name age gender medicalHistory allergies currentMedications')
        .populate('doctor', 'name specialization')
        .lean();

      return note;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a clinical note
   */
  async updateNote(noteId, doctorId, updateData) {
    try {
      const note = await ClinicalNote.findById(noteId);

      if (!note) {
        throw new Error('Clinical note not found');
      }

      // Check ownership
      if (note.doctor.toString() !== doctorId.toString()) {
        throw new Error('Access denied');
      }

      // Check if note is editable
      if (!note.isEditable) {
        throw new Error('This note cannot be edited as it has been finalized');
      }

      // Update note
      Object.assign(note, updateData);
      note.lastModifiedBy = doctorId;
      note.version += 1;

      await note.save();
      await note.populate([
        { path: 'patient', select: 'name age gender' },
        { path: 'doctor', select: 'name' }
      ]);

      return note;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a note (soft delete)
   */
  async deleteNote(noteId, doctorId) {
    try {
      const note = await ClinicalNote.findById(noteId);

      if (!note) {
        throw new Error('Clinical note not found');
      }

      // Check ownership
      if (note.doctor.toString() !== doctorId.toString()) {
        throw new Error('Access denied');
      }

      // Only drafts can be deleted
      if (note.status !== 'draft') {
        throw new Error('Only draft notes can be deleted');
      }

      note.status = 'deleted';
      await note.save();

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get notes for a specific patient
   */
  async getPatientNotes(patientId, limit = 10) {
    try {
      const notes = await ClinicalNote.find({
        patient: patientId,
        status: { $in: ['completed', 'reviewed'] }
      })
        .populate('doctor', 'name specialization')
        .sort({ visitDate: -1 })
        .limit(limit)
        .lean();

      return notes;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Finalize a clinical note
   */
  async finalizeNote(noteId, doctorId) {
    try {
      const note = await ClinicalNote.findById(noteId);

      if (!note) {
        throw new Error('Clinical note not found');
      }

      if (note.doctor.toString() !== doctorId.toString()) {
        throw new Error('Access denied');
      }

      if (note.status !== 'draft') {
        throw new Error('Only draft notes can be finalized');
      }

      // Validate required fields
      if (!note.subjective?.chiefComplaint) {
        throw new Error('Chief complaint is required');
      }

      if (!note.assessment?.primaryDiagnosis?.code) {
        throw new Error('Primary diagnosis is required');
      }

      note.status = 'completed';
      note.finalizedAt = new Date();
      note.finalizedBy = doctorId;
      note.isEditable = false;

      await note.save();
      await note.populate('patient', 'name');

      return note;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate PDF of clinical note
   */
  async generatePDF(noteId) {
    try {
      const note = await this.getNoteById(noteId);

      if (!note) {
        throw new Error('Clinical note not found');
      }

      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).text('Clinical Note', { align: 'center' });
        doc.moveDown();

        // Patient Info
        doc.fontSize(14).text(`Patient: ${note.patient.name}`);
        doc.fontSize(12).text(`Age: ${note.patient.age} | Gender: ${note.patient.gender}`);
        doc.text(`Date: ${new Date(note.visitDate).toLocaleDateString()}`);
        doc.moveDown();

        // Subjective
        doc.fontSize(14).text('Chief Complaint:', { underline: true });
        doc.fontSize(12).text(note.subjective?.chiefComplaint || 'N/A');
        doc.moveDown();

        if (note.subjective?.historyPresentIllness) {
          doc.fontSize(14).text('History of Present Illness:', { underline: true });
          doc.fontSize(12).text(note.subjective.historyPresentIllness);
          doc.moveDown();
        }

        // Objective
        if (note.objective?.vitalSigns) {
          doc.fontSize(14).text('Vital Signs:', { underline: true });
          const vitals = note.objective.vitalSigns;
          doc.fontSize(12).text(`BP: ${vitals.bloodPressure || 'N/A'}, HR: ${vitals.heartRate || 'N/A'}, Temp: ${vitals.temperature || 'N/A'}°F`);
          doc.moveDown();
        }

        // Assessment
        doc.fontSize(14).text('Assessment:', { underline: true });
        doc.fontSize(12).text(`Primary Diagnosis: ${note.assessment?.primaryDiagnosis?.description || 'N/A'} (${note.assessment?.primaryDiagnosis?.code || 'N/A'})`);
        doc.moveDown();

        // Plan
        doc.fontSize(14).text('Plan:', { underline: true });
        doc.fontSize(12).text(note.plan?.treatment || 'N/A');
        doc.moveDown();

        // Footer
        doc.fontSize(10).text(`Doctor: ${note.doctor.name}`, { align: 'right' });
        doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });

        doc.end();
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Transcribe audio to text
   */
  async transcribeAudio(audioFile) {
    try {
      // In production, use external STT service like Google Cloud Speech-to-Text
      // For now, return mock transcription
      return {
        transcription: 'Mock transcription: Patient presents with headache',
        confidence: 0.95
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get statistics for doctor dashboard
   */
  async getStatistics(doctorId) {
    try {
      const now = new Date();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

      const [totalNotes, pendingReviews, aiGeneratedNotes] = await Promise.all([
        ClinicalNote.countDocuments({
          doctor: doctorId,
          visitDate: { $gte: weekStart },
          status: { $ne: 'deleted' }
        }),
        ClinicalNote.countDocuments({
          doctor: doctorId,
          status: 'draft'
        }),
        ClinicalNote.countDocuments({
          doctor: doctorId,
          isAIGenerated: true,
          visitDate: { $gte: weekStart }
        })
      ]);

      // Calculate average time saved (mock calculation)
      const avgTimeSaved = aiGeneratedNotes > 0 ? Math.round(aiGeneratedNotes * 8.5) : 0;

      return {
        totalNotes,
        pendingReviews,
        aiGeneratedNotes,
        avgTimeSaved
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark note as viewed by patient
   */
  async markAsViewed(noteId) {
    try {
      await ClinicalNote.findByIdAndUpdate(noteId, {
        patientViewed: true,
        patientViewedAt: new Date()
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get patient data
   */
  async getPatientData(patientId) {
    try {
      const patient = await Patient.findById(patientId).lean();
      if (!patient) {
        throw new Error('Patient not found');
      }
      return patient;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get notes by IDs
   */
  async getNotesByIds(noteIds) {
    try {
      const notes = await ClinicalNote.find({
        _id: { $in: noteIds }
      }).lean();
      return notes;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ClinicalNotesService();
