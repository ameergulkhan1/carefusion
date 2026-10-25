import React, { useState } from 'react';

const TwoFactorAuth = ({ onEnable, onDisable, isEnabled }) => {
  const [code, setCode] = useState('');

  const handleVerify = () => {
    // Verify 2FA code
    onEnable();
  };

  return (
    <div className="two-factor-auth">
      <h3>Two-Factor Authentication</h3>
      {!isEnabled ? (
        <div>
          <p>Scan this QR code with your authenticator app</p>
          <div className="qr-placeholder">[QR Code]</div>
          <input 
            type="text" 
            placeholder="Enter verification code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button onClick={handleVerify}>Enable 2FA</button>
        </div>
      ) : (
        <div>
          <p>✓ Two-Factor Authentication is enabled</p>
          <button onClick={onDisable}>Disable 2FA</button>
        </div>
      )}
    </div>
  );
};

export default TwoFactorAuth;