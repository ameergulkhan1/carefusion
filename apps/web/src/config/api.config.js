export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

export const ENDPOINTS = {
  AUTH: '/auth',
  USERS: '/users',
  PATIENTS: '/patients',
  DOCTORS: '/doctors',
  APPOINTMENTS: '/appointments',
  PRESCRIPTIONS: '/prescriptions',
  LABORATORY: '/laboratory',
  PHARMACY: '/pharmacy',
  TELEMEDICINE: '/telemedicine',
  COMMUNICATION: '/communication',
  MESSAGING: '/messaging',
  COLLABORATION: '/collaboration',
  ADMIN: '/admin',
  ANALYTICS: '/analytics'
};

export default API_CONFIG;