const nodemailer = require('nodemailer');

const isEmailEnabled = process.env.EMAIL_ENABLED === 'true';
const hasEmailConfig = Boolean(
  process.env.EMAIL_HOST &&
  process.env.EMAIL_PORT &&
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASSWORD &&
  process.env.EMAIL_FROM
);

let transporter = null;

if (isEmailEnabled && hasEmailConfig) {
  // Create transporter
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // Verify connection
  transporter.verify((error) => {
    if (error) {
      console.error('❌ Email service error:', error.message);
    } else {
      console.log('✅ Email service ready');
    }
  });
} else {
  console.log('ℹ️ Email service disabled. Set EMAIL_ENABLED=true with valid SMTP config to enable emails.');
}

// Supports both signatures:
// 1) sendEmail({ to, subject, html, text })
// 2) sendEmail(to, templateName, templateData)
const sendEmail = async (payloadOrTo, templateName, templateData = {}) => {
  let to;
  let subject;
  let html;
  let text;

  if (typeof payloadOrTo === 'object' && payloadOrTo !== null) {
    ({ to, subject, html, text } = payloadOrTo);
  } else {
    to = payloadOrTo;
    const template = emailTemplates[templateName];

    if (!template) {
      throw new Error(`Unknown email template: ${templateName}`);
    }

    let templatePayload = {};
    if (templateName === 'welcome') {
      templatePayload = template(templateData.name || 'User');
    } else if (templateName === 'passwordReset') {
      templatePayload = template(templateData.name || 'User', templateData.resetUrl || '');
    } else if (templateName === 'appointmentConfirmation') {
      templatePayload = template(
        templateData.patientName,
        templateData.doctorName,
        templateData.appointmentDate,
        templateData.appointmentTime
      );
    } else if (templateName === 'appointmentReminder') {
      templatePayload = template(
        templateData.patientName,
        templateData.doctorName,
        templateData.appointmentTime
      );
    } else if (templateName === 'labResultsReady') {
      templatePayload = template(templateData.patientName, templateData.testName);
    } else if (templateName === 'prescriptionReady') {
      templatePayload = template(templateData.patientName, templateData.pharmacyName);
    }

    subject = templatePayload.subject;
    html = templatePayload.html;
    text = templatePayload.text;
  }

  if (!transporter) {
    console.log(`ℹ️ Skipping email to ${to} because email service is disabled.`);
    return { success: false, skipped: true };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html
    });

    console.log('📧 Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    throw error;
  }
};

// Email templates
const emailTemplates = {
  // Welcome email
  welcome: (name) => ({
    subject: 'Welcome to ClinixSol',
    html: `
      <h1>Welcome to ClinixSol, ${name}!</h1>
      <p>Thank you for joining our healthcare platform.</p>
      <p>You can now access all features including telemedicine, appointments, and more.</p>
    `
  }),

  // Password reset
  passwordReset: (name, resetLink) => ({
    subject: 'Reset Your Password',
    html: `
      <h1>Password Reset Request</h1>
      <p>Hi ${name},</p>
      <p>You requested to reset your password. Click the link below:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  }),

  // Appointment confirmation
  appointmentConfirmation: (patientName, doctorName, appointmentDate, appointmentTime) => ({
    subject: 'Appointment Confirmed',
    html: `
      <h1>Appointment Confirmed</h1>
      <p>Hi ${patientName},</p>
      <p>Your appointment has been confirmed:</p>
      <ul>
        <li><strong>Doctor:</strong> ${doctorName}</li>
        <li><strong>Date:</strong> ${appointmentDate}</li>
        <li><strong>Time:</strong> ${appointmentTime}</li>
      </ul>
      <p>Please arrive 10 minutes early.</p>
    `
  }),

  // Appointment reminder
  appointmentReminder: (patientName, doctorName, appointmentTime) => ({
    subject: 'Appointment Reminder',
    html: `
      <h1>Appointment Reminder</h1>
      <p>Hi ${patientName},</p>
      <p>This is a reminder about your upcoming appointment:</p>
      <p><strong>Doctor:</strong> ${doctorName}</p>
      <p><strong>Time:</strong> ${appointmentTime}</p>
      <p>See you soon!</p>
    `
  }),

  // Lab results ready
  labResultsReady: (patientName, testName) => ({
    subject: 'Your Lab Results Are Ready',
    html: `
      <h1>Lab Results Ready</h1>
      <p>Hi ${patientName},</p>
      <p>Your lab results for <strong>${testName}</strong> are now available.</p>
      <p>Log in to your ClinixSol account to view them.</p>
    `
  }),

  // Prescription ready
  prescriptionReady: (patientName, pharmacyName) => ({
    subject: 'Your Prescription Is Ready',
    html: `
      <h1>Prescription Ready</h1>
      <p>Hi ${patientName},</p>
      <p>Your prescription at ${pharmacyName} is ready for pickup.</p>
      <p>Please bring a valid ID.</p>
    `
  })
};

module.exports = {
  transporter,
  sendEmail,
  emailTemplates
};
