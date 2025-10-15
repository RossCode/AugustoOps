import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <Link to="/" className="header-logo">
            <h1>AugustoOps</h1>
          </Link>
          <nav className="header-nav">
            <Link to="/">Home</Link>
            <Link to="/projects">Projects</Link>
            {user.roles?.includes('Operations Leader') || user.roles?.includes('Admin') ? (
              <Link to="/audit">Audit</Link>
            ) : null}
            {user.roles?.includes('Service Line Leader') || user.roles?.includes('Operations Leader') || user.roles?.includes('Admin') ? (
              <>
                <Link to="/team-members">Team</Link>
                <Link to="/service-lines">Service Lines</Link>
                <Link to="/roles">Roles</Link>
              </>
            ) : null}
            {user.roles?.includes('Admin') ? (
              <Link to="/admin">Admin</Link>
            ) : null}
          </nav>
        </div>

        <div className="header-right">
          <div
            className="user-menu"
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <div className="user-button">
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={user.full_name}
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar-placeholder">
                  {user.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="user-info">
                <span className="user-name">{user.full_name}</span>
                <span className="user-email">{user.email}</span>
              </div>
              <svg className="dropdown-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 6l4 4 4-4"/>
              </svg>
            </div>

            {showDropdown && (
              <div className="user-dropdown">
                <div className="dropdown-section">
                  <div className="dropdown-label">Your Roles</div>
                  <div className="user-roles">
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map(role => (
                        <span key={role} className="role-badge">{role}</span>
                      ))
                    ) : (
                      <span className="no-roles">No roles assigned</span>
                    )}
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="logout-button">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M11 8a.5.5 0 0 1-.5.5H6.707l1.647 1.646a.5.5 0 0 1-.708.708l-2.5-2.5a.5.5 0 0 1 0-.708l2.5-2.5a.5.5 0 1 1 .708.708L6.707 7.5H10.5A.5.5 0 0 1 11 8z"/>
                    <path fillRule="evenodd" d="M3.5 0a.5.5 0 0 0-.5.5V15a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V.5a.5.5 0 0 0-.5-.5h-9zM4 1h8v14H4V1z"/>
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
