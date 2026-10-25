import React from 'react';
import Input from '../../../components/common/Input/Input';
import Button from '../../../components/common/Button/Button';

const RegisterForm = ({ onSubmit, formData, onChange }) => {
  return (
    <form onSubmit={onSubmit} className="register-form">
      <Input label="Full Name" value={formData.fullName} onChange={(e) => onChange('fullName', e.target.value)} required />
      <Input label="Email" type="email" value={formData.email} onChange={(e) => onChange('email', e.target.value)} required />
      <Input label="Phone" type="tel" value={formData.phone} onChange={(e) => onChange('phone', e.target.value)} required />
      <Input label="Password" type="password" value={formData.password} onChange={(e) => onChange('password', e.target.value)} required />
      <Input label="Confirm Password" type="password" value={formData.confirmPassword} onChange={(e) => onChange('confirmPassword', e.target.value)} required />
      <Button type="submit">Register</Button>
    </form>
  );
};

export default RegisterForm;