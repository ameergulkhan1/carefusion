// Notification service for real-time notifications

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  // Send notification to specific user
  async sendToUser(userId, notification) {
    try {
      if (this.io) {
        this.io.to(`user:${userId}`).emit('notification', notification);
      }
      
      // TODO: Save notification to database
      // await Notification.create({ userId, ...notification });
      
      return { success: true };
    } catch (error) {
      console.error('Send notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send notification to multiple users
  async sendToUsers(userIds, notification) {
    try {
      const promises = userIds.map(userId => this.sendToUser(userId, notification));
      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      console.error('Send bulk notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Appointment notification
  async notifyAppointment(userId, appointment, type) {
    const notification = {
      type: 'appointment',
      title: type === 'created' ? 'Appointment Scheduled' : 'Appointment Updated',
      message: `Your appointment on ${appointment.appointmentDate} at ${appointment.appointmentTime}`,
      data: appointment,
      timestamp: new Date()
    };
    return await this.sendToUser(userId, notification);
  }

  // Message notification
  async notifyNewMessage(userId, message) {
    const notification = {
      type: 'message',
      title: 'New Message',
      message: `You have a new message from ${message.senderName}`,
      data: message,
      timestamp: new Date()
    };
    return await this.sendToUser(userId, notification);
  }

  // Prescription notification
  async notifyPrescription(userId, prescription) {
    const notification = {
      type: 'prescription',
      title: 'New Prescription',
      message: 'You have received a new prescription',
      data: prescription,
      timestamp: new Date()
    };
    return await this.sendToUser(userId, notification);
  }

  // Lab result notification
  async notifyLabResult(userId, labResult) {
    const notification = {
      type: 'lab-result',
      title: 'Lab Results Ready',
      message: 'Your lab test results are now available',
      data: labResult,
      timestamp: new Date()
    };
    return await this.sendToUser(userId, notification);
  }

  // Payment notification
  async notifyPayment(userId, payment) {
    const notification = {
      type: 'payment',
      title: payment.status === 'paid' ? 'Payment Successful' : 'Payment Failed',
      message: `Payment of ${payment.amount} ${payment.status}`,
      data: payment,
      timestamp: new Date()
    };
    return await this.sendToUser(userId, notification);
  }
}

module.exports = NotificationService;
