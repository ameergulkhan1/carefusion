const cron = require('node-cron');
const { addHours } = require('../utils/dateHelper');
const emailService = require('../services/emailService');
const { logger } = require('../middleware/logger');

// Send appointment reminders 24 hours before appointment
const sendAppointmentReminders = async () => {
  try {
    logger.info('Running appointment reminder job...');

    // TODO: Replace with actual database query
    // const tomorrow = addHours(new Date(), 24);
    // const upcomingAppointments = await Appointment.find({
    //   appointmentDate: {
    //     $gte: tomorrow,
    //     $lt: addHours(tomorrow, 1)
    //   },
    //   status: 'scheduled'
    // }).populate('patientId doctorId');

    // for (const appointment of upcomingAppointments) {
    //   await emailService.sendAppointmentReminder(
    //     appointment,
    //     appointment.patientId,
    //     appointment.doctorId
    //   );
    // }

    logger.info('Appointment reminder job completed');
  } catch (error) {
    logger.error('Appointment reminder job error:', error);
  }
};

// Schedule job to run every hour
const scheduleAppointmentReminders = () => {
  cron.schedule('0 * * * *', sendAppointmentReminders);
  logger.info('Appointment reminder job scheduled (hourly)');
};

module.exports = {
  sendAppointmentReminders,
  scheduleAppointmentReminders
};
