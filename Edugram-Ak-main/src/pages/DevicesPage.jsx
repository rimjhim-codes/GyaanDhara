import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Smartphone, Monitor, Trash2, CheckCircle, Clock } from 'lucide-react';

const DevicesPage = () => {
  const { isLoggedIn, devices, removeDevice } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/auth');
    }
  }, [isLoggedIn, navigate]);

  const getDeviceIcon = (type) => {
    return type === 'mobile' ? <Smartphone size={24} /> : <Monitor size={24} />;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Your Devices</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Manage your devices and view sync status
        </p>
      </div>

      {/* Devices List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {devices.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              No devices registered yet
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Sign in from other devices to sync your progress automatically
            </p>
          </div>
        ) : (
          devices.map((device) => (
            <div key={device.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              {/* Device Icon */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '60px',
                height: '60px',
                background: 'rgba(124, 58, 237, 0.2)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-primary)'
              }}>
                {getDeviceIcon(device.type)}
              </div>

              {/* Device Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0 }}>{device.name}</h3>
                  {device.isCurrentDevice && (
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      background: 'rgba(14, 165, 233, 0.2)',
                      color: 'var(--color-secondary)',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      Current Device
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={14} /> Last synced: {formatDate(device.lastSynced)}
                  </span>
                </div>
              </div>

              {/* Delete Button */}
              {!device.isCurrentDevice && (
                <button
                  onClick={() => removeDevice(device.id)}
                  style={{
                    background: 'rgba(244, 63, 94, 0.2)',
                    border: 'none',
                    color: 'var(--color-accent)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)'}
                  title="Remove this device"
                >
                  <Trash2 size={16} /> Remove
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Sync Info */}
      <div className="glass-panel" style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(124, 58, 237, 0.1)' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <CheckCircle size={24} color="var(--color-secondary)" style={{ marginTop: '0.25rem', flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-main)' }}>Automatic Sync</h4>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Your learning progress is automatically synced across all your devices when you sign in. Start learning on one device and continue seamlessly on another.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevicesPage;
