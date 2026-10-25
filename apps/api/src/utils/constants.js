// Application constants

module.exports = {
  // User roles
  ROLES: {
    PATIENT: 'patient',
    DOCTOR: 'doctor',
    LAB: 'lab',
    PHARMACY: 'pharmacy',
    ADMIN: 'admin'
  },

  // Appointment statuses
  APPOINTMENT_STATUS: {
    SCHEDULED: 'scheduled',
    CONFIRMED: 'confirmed',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no-show'
  },

  // Appointment types
  APPOINTMENT_TYPES: {
    IN_PERSON: 'in-person',
    VIDEO: 'video',
    PHONE: 'phone'
  },

  // Payment statuses
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
    REFUNDED: 'refunded',
    FAILED: 'failed'
  },

  // Order statuses
  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    OUT_FOR_DELIVERY: 'out-for-delivery',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
  },

  // Lab test statuses
  LAB_TEST_STATUS: {
    REQUESTED: 'requested',
    SAMPLE_COLLECTED: 'sample-collected',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  // Prescription statuses
  PRESCRIPTION_STATUS: {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired'
  },

  // Notification types
  NOTIFICATION_TYPES: {
    APPOINTMENT: 'appointment',
    PRESCRIPTION: 'prescription',
    LAB_RESULT: 'lab-result',
    MESSAGE: 'message',
    PAYMENT: 'payment',
    SYSTEM: 'system'
  },

  // File types
  FILE_TYPES: {
    PRESCRIPTION: 'prescription',
    LAB_REPORT: 'lab-report',
    MEDICAL_RECORD: 'medical-record',
    PROFILE_IMAGE: 'profile-image',
    DOCUMENT: 'document'
  },

  // Blood groups
  BLOOD_GROUPS: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],

  // Gender options
  GENDER: {
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other'
  },

  // Days of week
  DAYS: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],

  // Message statuses
  MESSAGE_STATUS: {
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read'
  },

  // Consultation statuses
  CONSULTATION_STATUS: {
    SCHEDULED: 'scheduled',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  },

  // Time constants
  TIME: {
    ONE_HOUR: 3600000,
    ONE_DAY: 86400000,
    ONE_WEEK: 604800000,
    ONE_MONTH: 2592000000
  }
};
