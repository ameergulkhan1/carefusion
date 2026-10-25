import React, { useState } from 'react';
import Input from '../../../components/common/Input/Input';
import Button from '../../../components/common/Button/Button';

const OTPVerification = ({ onVerify, resendOTP }) => {
  const [otp, setOtp] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onVerify(otp);
  };

  return (
    <div className="otp-verification">
      <h3>Verify OTP</h3>
      <p>Enter the code sent to your phone</p>
      <form onSubmit={handleSubmit}>
        <Input label="OTP Code" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} />
        <Button type="submit">Verify</Button>
        <button type="button" onClick={resendOTP}>Resend OTP</button>
      </form>
    </div>
  );
};

export default OTPVerification;