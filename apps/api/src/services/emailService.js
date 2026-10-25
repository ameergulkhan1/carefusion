const { sendEmail: sendEmailConfig } = require('../config/email');

// Email service for sending various types of emails
class EmailService {
  async sendWelcomeEmail(user) {
    try {
      await sendEmailConfig(user.email, 'welcome', {
        name: user.fullName
      });
      return { success: true };
    } catch (error) {
      console.error('Welcome email error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetEmail(user, resetUrl) {
    try {
      await sendEmailConfig(user.email, 'passwordReset', {
        name: user.fullName,
        resetUrl,
        validHours: 1
      });
      return { success: true };
    } catch (error) {
      console.error('Password reset email error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendAppointmentConfirmation(appointment, patient, doctor) {
    try {
      await sendEmailConfig(patient.email, 'appointmentConfirmation', {
        patientName: patient.fullName,
        doctorName: doctor.fullName,
        date: appointment.appointmentDate,
        time: appointment.appointmentTime,
        type: appointment.type
      });
      return { success: true };
    } catch (error) {
      console.error('Appointment confirmation email error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendAppointmentReminder(appointment, patient, doctor) {
    try {
      await sendEmailConfig(patient.email, 'appointmentReminder', {
        patientName: patient.fullName,
        doctorName: doctor.fullName,
        date: appointment.appointmentDate,
        time: appointment.appointmentTime
      });
      return { success: true };
    } catch (error) {
      console.error('Appointment reminder email error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendLabResultsReady(patient, testName) {
    try {
      await sendEmailConfig(patient.email, 'labResultsReady', {
        patientName: patient.fullName,
        testName
      });
      return { success: true };
    } catch (error) {
      console.error('Lab results email error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPrescriptionReady(patient, pharmacyName) {
    try {
      await sendEmailConfig(patient.email, 'prescriptionReady', {
        patientName: patient.fullName,
        pharmacyName
      });
      return { success: true };
    } catch (error) {
      console.error('Prescription ready email error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendCustomEmail(to, subject, htmlContent) {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html: htmlContent
      });

      return { success: true };
    } catch (error) {
      console.error('Custom email error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
