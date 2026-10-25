export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout'
  },
  patients: '/patients',
  doctors: '/doctors',
  appointments: '/appointments',
  prescriptions: '/prescriptions',
  lab: '/laboratory',
  pharmacy: '/pharmacy'
};

export const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
  NURSE: 'nurse'
};

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};

export default { API_ENDPOINTS, USER_ROLES, APPOINTMENT_STATUS };