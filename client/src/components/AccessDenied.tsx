import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AccessDenied: React.FC = () => {
  const { user } = useAuth();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '500px',
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ color: '#c33', marginBottom: '16px' }}>Access Denied</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          You don't have permission to access this page.
        </p>

        {user && user.roles && user.roles.length > 0 && (
          <div style={{
            background: '#f5f5f5',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>
              <strong>Your current roles:</strong>
            </p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center'
            }}>
              {user.roles.map(role => (
                <li key={role} style={{
                  background: '#667eea',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '13px'
                }}>
                  {role}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
          If you believe you should have access to this page, please contact an administrator.
        </p>

        <Link
          to="/"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#667eea',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600'
          }}
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default AccessDenied;
