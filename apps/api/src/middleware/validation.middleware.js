const validateClinicalNote = (req, res, next) => {
  next();
};

const validateAIRequest = (req, res, next) => {
  const { rawTranscript } = req.body || {};

  if (!rawTranscript || typeof rawTranscript !== 'string' || !rawTranscript.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Raw transcript is required'
    });
  }

  next();
};

module.exports = {
  validateClinicalNote,
  validateAIRequest
};
