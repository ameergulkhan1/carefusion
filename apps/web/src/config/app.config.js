export const APP_CONFIG = {
  APP_NAME: 'CareFusion',
  VERSION: '1.0.0',
  ENVIRONMENT: process.env.NODE_ENV,
  DEFAULT_LANGUAGE: 'en',
  TIMEZONE: 'America/New_York',
  DATE_FORMAT: 'MM/DD/YYYY',
  TIME_FORMAT: 'hh:mm A',
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100]
  },
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
};

export default APP_CONFIG;