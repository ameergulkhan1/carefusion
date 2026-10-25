import React, { useState } from 'react';
import Input from '../../../../components/common/Input/Input';
import Button from '../../../../components/common/Button/Button';
import './ResetPassword.css';

const ResetPassword = () => {
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Reset password logic
  };

  return (
    <div className="reset-password-page">
      <h2>Set New Password</h2>
      <form onSubmit={handleSubmit}>
        <Input label="New Password" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
        <Input label="Confirm Password" type="password" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} />
        <Button type="submit">Reset Password</Button>
      </form>
    </div>
  );
};

export default ResetPassword;