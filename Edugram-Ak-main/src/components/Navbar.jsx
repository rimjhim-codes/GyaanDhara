import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, User, Zap, LogOut, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <nav style={{
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid var(--color-border)',
      background: 'var(--color-bg-elevated)',
      backdropFilter: 'blur(10px)'
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
        <Zap color="var(--color-primary)" size={28} />
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 'bold' }}>Edugram</span>
      </Link>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={18} /> Dashboard
        </Link>
        <Link to="/setup" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
          New Topic
        </Link>

        {/* User Profile Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              background: 'rgba(124, 58, 237, 0.2)',
              border: 'none',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.2)'}
          >
            <User size={18} />
            <span style={{ fontSize: '0.9rem' }}>{user?.name || 'User'}</span>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                minWidth: '200px',
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
              }}
            >
              {/* User Info */}
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                <p style={{ margin: 0, fontWeight: 'bold', color: 'white' }}>{user?.name}</p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {user?.email}
                </p>
              </div>

              {/* Menu Items */}
              <Link
                to="/devices"
                onClick={() => setShowDropdown(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  color: 'var(--color-text-main)',
                  textDecoration: 'none',
                  borderBottom: '1px solid var(--color-border)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Smartphone size={16} /> Your Devices
              </Link>

              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  color: 'var(--color-accent)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
