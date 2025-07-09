import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>AugustoOps</h1>
        <p>Business Operations Management Tools</p>
      </header>

      <main className="home-content">
        <div className="tools-grid">
          <div className="tool-card">
            <div className="tool-icon">👥</div>
            <h3>Team Manager</h3>
            <p>Manage team member cost rates, internal rates, weekly capacity, and service lines</p>
            <Link to="/team-members" className="tool-link">
              Manage Team Members
            </Link>
          </div>

          <div className="tool-card">
            <div className="tool-icon">🏢</div>
            <h3>Service Lines</h3>
            <p>Create and manage service line categories and classifications</p>
            <Link to="/service-lines" className="tool-link">
              Manage Service Lines
            </Link>
          </div>

          <div className="tool-card coming-soon">
            <div className="tool-icon">📊</div>
            <h3>Project Analytics</h3>
            <p>View project performance metrics and team utilization reports</p>
            <div className="coming-soon-badge">Coming Soon</div>
          </div>

          <div className="tool-card coming-soon">
            <div className="tool-icon">💰</div>
            <h3>Financial Reports</h3>
            <p>Generate cost analysis and billing reports for projects</p>
            <div className="coming-soon-badge">Coming Soon</div>
          </div>
        </div>
      </main>

      <footer className="home-footer">
        <p>&copy; 2024 AugustoOps - Business Operations Management</p>
      </footer>
    </div>
  );
};

export default Home;