export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[\d\s\-\+\(\)]+$/;
  return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const validatePassword = (password) => {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
};

export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

export const validateForm = (formData, rules) => {
  const errors = {};
  Object.keys(rules).forEach(field => {
    if (!rules[field](formData[field])) {
      errors[field] = `Invalid ${field}`;
    }
  });
  return { isValid: Object.keys(errors).length === 0, errors };
};

export default { validateEmail, validatePhone, validatePassword, validateRequired, validateForm };