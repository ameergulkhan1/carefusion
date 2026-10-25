import React from 'react';
import Input from '../../../components/common/Input/Input';
import Button from '../../../components/common/Button/Button';

const LoginForm = ({ onSubmit, formData, onChange }) => {
  return (
    <form onSubmit={onSubmit} className="login-form">
      <Input 
        label="Email" 
        type="email" 
        value={formData.email} 
        onChange={(e) => onChange('email', e.target.value)}
        required
      />
      <Input 
        label="Password" 
        type="password" 
        value={formData.password} 
        onChange={(e) => onChange('password', e.target.value)}
        required
      />
      <Button type="submit">Login</Button>
    </form>
  );
};

export default LoginForm;