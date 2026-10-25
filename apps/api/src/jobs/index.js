const { scheduleAppointmentReminders } = require('./appointmentReminder');
const { scheduleCleanupJobs } = require('./cleanup');
const { logger } = require('../middleware/logger');

// Initialize all background jobs
const initializeJobs = () => {
  logger.info('Initializing background jobs...');

  try {
    // Schedule appointment reminders
    scheduleAppointmentReminders();

    // Schedule cleanup jobs
    scheduleCleanupJobs();

    logger.info('All background jobs initialized successfully');
  } catch (error) {
    logger.error('Error initializing background jobs:', error);
  }
};

module.exports = { initializeJobs };
