import React, { useState } from 'react';
import Card from '../../../../components/common/Card/Card';
import Button from '../../../../components/common/Button/Button';
import './SecuritySettings.css';

const SecuritySettings = () => {
  const [settings, setSettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90
  });

  const handleSave = () => {
    // Save security settings
  };

  return (
    <div className="security-settings">
      <Card title="Security Settings">
        <div className="setting-item">
          <label>
            <input 
              type="checkbox" 
              checked={settings.twoFactorAuth}
              onChange={(e) => setSettings({...settings, twoFactorAuth: e.target.checked})}
            />
            Enable Two-Factor Authentication
          </label>
        </div>
        <div className="setting-item">
          <label>Session Timeout (minutes):</label>
          <input type="number" value={settings.sessionTimeout} onChange={(e) => setSettings({...settings, sessionTimeout: e.target.value})} />
        </div>
        <Button onClick={handleSave}>Save Settings</Button>
      </Card>
    </div>
  );
};

export default SecuritySettings;