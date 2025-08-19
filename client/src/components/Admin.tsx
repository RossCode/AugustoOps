import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Admin.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const Admin: React.FC = () => {
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [timeLoading, setTimeLoading] = useState(false);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [qbAccountsLoading, setQbAccountsLoading] = useState(false);
  const [qbInvoicesLoading, setQbInvoicesLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSync = async (type: 'projects' | 'clients' | 'time' | 'forecast' | 'quickbooks-accounts' | 'quickbooks-invoices') => {
    let setLoading;
    let displayName;
    
    switch (type) {
      case 'projects':
        setLoading = setProjectsLoading;
        displayName = 'Projects';
        break;
      case 'clients':
        setLoading = setClientsLoading;
        displayName = 'Clients';
        break;
      case 'time':
        setLoading = setTimeLoading;
        displayName = 'Harvest Time';
        break;
      case 'forecast':
        setLoading = setForecastLoading;
        displayName = 'Forecast Data';
        break;
      case 'quickbooks-accounts':
        setLoading = setQbAccountsLoading;
        displayName = 'QuickBooks Accounts';
        break;
      case 'quickbooks-invoices':
        setLoading = setQbInvoicesLoading;
        displayName = 'QuickBooks Invoices';
        break;
      default:
        return;
    }
    
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE}/api/sync/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `${displayName} sync triggered successfully. The sync process is now running in the background.`
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || `Failed to trigger ${type} sync`
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Network error: Could not trigger ${type} sync. Please check your connection and try again.`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <nav className="breadcrumb">
        <Link to="/">Home</Link> / Admin
      </nav>

      <header className="admin-header">
        <h1>Admin Utilities</h1>
        <p>System administration and data synchronization tools</p>
      </header>

      <main className="admin-content">
        <div className="utilities-section">
          <h2>Data Synchronization</h2>
          <p>Trigger manual synchronization with external systems</p>
          
          {message && (
            <div className={`message ${message.type}`}>
              <span className="message-icon">
                {message.type === 'success' ? '✅' : '❌'}
              </span>
              {message.text}
            </div>
          )}

          <div className="sync-utilities">
            <div className="sync-card">
              <div className="sync-icon">📋</div>
              <h3>Projects Sync</h3>
              <p>Synchronize project data from Harvest to update project information, budgets, and status</p>
              <button
                className={`sync-button ${projectsLoading ? 'loading' : ''}`}
                onClick={() => handleSync('projects')}
                disabled={projectsLoading || clientsLoading || timeLoading || forecastLoading || qbAccountsLoading || qbInvoicesLoading}
              >
                {projectsLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Syncing Projects...
                  </>
                ) : (
                  'Sync Projects'
                )}
              </button>
            </div>

            <div className="sync-card">
              <div className="sync-icon">🏢</div>
              <h3>Clients Sync</h3>
              <p>Synchronize client data from Harvest to update client information and contact details</p>
              <button
                className={`sync-button ${clientsLoading ? 'loading' : ''}`}
                onClick={() => handleSync('clients')}
                disabled={projectsLoading || clientsLoading || timeLoading || forecastLoading || qbAccountsLoading || qbInvoicesLoading}
              >
                {clientsLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Syncing Clients...
                  </>
                ) : (
                  'Sync Clients'
                )}
              </button>
            </div>

            <div className="sync-card">
              <div className="sync-icon">⏰</div>
              <h3>Harvest Time Sync</h3>
              <p>Synchronize time tracking data from Harvest to update billable hours and time entries</p>
              <button
                className={`sync-button ${timeLoading ? 'loading' : ''}`}
                onClick={() => handleSync('time')}
                disabled={projectsLoading || clientsLoading || timeLoading || forecastLoading || qbAccountsLoading || qbInvoicesLoading}
              >
                {timeLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Syncing Time...
                  </>
                ) : (
                  'Sync Harvest Time'
                )}
              </button>
            </div>

            <div className="sync-card">
              <div className="sync-icon">📊</div>
              <h3>Forecast Data Sync</h3>
              <p>Synchronize project forecasting and planning data to update resource allocation and schedules</p>
              <button
                className={`sync-button ${forecastLoading ? 'loading' : ''}`}
                onClick={() => handleSync('forecast')}
                disabled={projectsLoading || clientsLoading || timeLoading || forecastLoading || qbAccountsLoading || qbInvoicesLoading}
              >
                {forecastLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Syncing Forecast...
                  </>
                ) : (
                  'Sync Forecast Data'
                )}
              </button>
            </div>

            <div className="sync-card">
              <div className="sync-icon">🏦</div>
              <h3>QuickBooks Accounts</h3>
              <p>Synchronize chart of accounts and financial account data from QuickBooks</p>
              <button
                className={`sync-button ${qbAccountsLoading ? 'loading' : ''}`}
                onClick={() => handleSync('quickbooks-accounts')}
                disabled={projectsLoading || clientsLoading || timeLoading || forecastLoading || qbAccountsLoading || qbInvoicesLoading}
              >
                {qbAccountsLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Syncing Accounts...
                  </>
                ) : (
                  'Sync QB Accounts'
                )}
              </button>
            </div>

            <div className="sync-card">
              <div className="sync-icon">💰</div>
              <h3>QuickBooks Invoices</h3>
              <p>Synchronize invoice data and billing information from QuickBooks for financial reporting</p>
              <button
                className={`sync-button ${qbInvoicesLoading ? 'loading' : ''}`}
                onClick={() => handleSync('quickbooks-invoices')}
                disabled={projectsLoading || clientsLoading || timeLoading || forecastLoading || qbAccountsLoading || qbInvoicesLoading}
              >
                {qbInvoicesLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Syncing Invoices...
                  </>
                ) : (
                  'Sync QB Invoices'
                )}
              </button>
            </div>
          </div>

          <div className="sync-info">
            <h3>Important Information</h3>
            <ul>
              <li>Synchronization may take several minutes to complete</li>
              <li>The system will continue to function normally during sync</li>
              <li>Data changes will be reflected after sync completion</li>
              <li>If sync fails, check system logs or try again later</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;