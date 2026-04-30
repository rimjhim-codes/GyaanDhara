import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('edugram_auth');
    const savedDevices = localStorage.getItem('edugram_devices');
    
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsLoggedIn(true);
    }
    
    if (savedDevices) {
      setDevices(JSON.parse(savedDevices));
    }
    
    setIsLoading(false);
  }, []);

  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simple validation (in production, this would call a backend API)
        if (email && password && email.includes('@')) {
          const userData = {
            id: Date.now().toString(),
            email,
            name: email.split('@')[0],
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          };
          
          const deviceInfo = {
            id: generateDeviceId(),
            name: getDeviceName(),
            type: getDeviceType(),
            lastSynced: new Date().toISOString(),
            isCurrentDevice: true
          };
          
          setUser(userData);
          setIsLoggedIn(true);
          setDevices([deviceInfo]);
          
          localStorage.setItem('edugram_auth', JSON.stringify(userData));
          localStorage.setItem('edugram_devices', JSON.stringify([deviceInfo]));
          localStorage.setItem('edugram_device_id', deviceInfo.id);
          
          resolve({ success: true, user: userData });
        } else {
          reject(new Error('Invalid email or password'));
        }
      }, 1000);
    });
  };

  const register = (email, password, name) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!email.includes('@') || password.length < 6) {
          reject(new Error('Invalid email or password (min 6 characters)'));
          return;
        }
        
        // Check if user already exists (simple check)
        const existingUser = localStorage.getItem(`edugram_user_${email}`);
        if (existingUser) {
          reject(new Error('Email already registered'));
          return;
        }
        
        const userData = {
          id: Date.now().toString(),
          email,
          name: name || email.split('@')[0],
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        const deviceInfo = {
          id: generateDeviceId(),
          name: getDeviceName(),
          type: getDeviceType(),
          lastSynced: new Date().toISOString(),
          isCurrentDevice: true
        };
        
        setUser(userData);
        setIsLoggedIn(true);
        setDevices([deviceInfo]);
        
        localStorage.setItem('edugram_auth', JSON.stringify(userData));
        localStorage.setItem('edugram_devices', JSON.stringify([deviceInfo]));
        localStorage.setItem('edugram_device_id', deviceInfo.id);
        localStorage.setItem(`edugram_user_${email}`, JSON.stringify(userData));
        
        resolve({ success: true, user: userData });
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('edugram_auth');
    localStorage.removeItem('edugram_device_id');
    // Keep devices logged but mark as not current
    const updatedDevices = devices.map(d => ({ ...d, isCurrentDevice: false }));
    setDevices(updatedDevices);
    localStorage.setItem('edugram_devices', JSON.stringify(updatedDevices));
  };

  const syncProgress = (progressData) => {
    if (!user) return;
    
    const deviceId = localStorage.getItem('edugram_device_id') || generateDeviceId();
    const updatedDevices = devices.map(d => 
      d.id === deviceId 
        ? { ...d, lastSynced: new Date().toISOString() }
        : d
    );
    
    setDevices(updatedDevices);
    localStorage.setItem('edugram_devices', JSON.stringify(updatedDevices));
    
    // Store synced progress
    localStorage.setItem(`edugram_progress_${user.id}`, JSON.stringify({
      ...progressData,
      lastSyncTime: new Date().toISOString(),
      syncedDevice: deviceId
    }));
  };

  const getDeviceList = () => {
    return devices;
  };

  const removeDevice = (deviceId) => {
    const updatedDevices = devices.filter(d => d.id !== deviceId);
    setDevices(updatedDevices);
    localStorage.setItem('edugram_devices', JSON.stringify(updatedDevices));
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn,
      isLoading,
      devices,
      login,
      register,
      logout,
      syncProgress,
      getDeviceList,
      removeDevice
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Helper functions
function generateDeviceId() {
  return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getDeviceName() {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Windows')) return 'Windows PC';
  if (userAgent.includes('Mac')) return 'Mac';
  if (userAgent.includes('iPhone')) return 'iPhone';
  if (userAgent.includes('iPad')) return 'iPad';
  if (userAgent.includes('Android')) return 'Android Device';
  return 'Web Browser';
}

function getDeviceType() {
  const userAgent = navigator.userAgent;
  if (/mobile|android|iphone|ipad/i.test(userAgent)) return 'mobile';
  return 'desktop';
}
