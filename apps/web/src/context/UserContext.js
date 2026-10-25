import React, { createContext, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState({
    profile: null,
    preferences: {},
    notifications: []
  });

  const updateProfile = (newProfile) => {
    setUserData(prev => ({ ...prev, profile: newProfile }));
  };

  const updatePreferences = (newPreferences) => {
    setUserData(prev => ({ ...prev, preferences: { ...prev.preferences, ...newPreferences } }));
  };

  return (
    <UserContext.Provider value={{ userData, updateProfile, updatePreferences }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;