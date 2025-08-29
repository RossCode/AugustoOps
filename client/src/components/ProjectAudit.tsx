import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ProjectAudit.css';

interface AuditProject {
  code: string;
  project_name: string;
  client_name: string;
  is_active: number;
  is_fixed_fee: number;
  billable: number;
  revenue_type: string | null;
  account_owner: string | null;
  billing_type: string | null;
  missing_revenue_type: number;
  missing_account_owner: number;
  missing_billing_type: number;
}

interface AuditSummary {
  total_projects_with_issues: number;
  missing_revenue_type: number;
  missing_account_owner: number;
  missing_billing_type: number;
}

interface AuditData {
  projects: AuditProject[];
  summary: AuditSummary;
}

interface AllTeamMember {
  id: number;
  full_name: string;
  role: string;
  default_cost_rate: string;
  service_line_id: string;
  is_active: number;
}

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const ProjectAudit: React.FC = () => {
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [allTeamMembers, setAllTeamMembers] = useState<AllTeamMember[]>([]);
  const [filterBy, setFilterBy] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [editingField, setEditingField] = useState<{projectCode: string, fieldType: string} | null>(null);
  const [editValue, setEditValue] = useState('');

  // Field type constants - same as Projects component
  const FIELD_TYPES = {
    REVENUE_TYPE: 'Revenue Type',
    ACCOUNT_OWNER: 'Account Owner', 
    BILLING_TYPE: 'Billing Type'
  };
  
  const REVENUE_TYPE_OPTIONS = ['New', 'Extension', 'Recurring'];
  const BILLING_TYPE_OPTIONS = ['Up Front', 'Bi-Weekly Journal Entry', 'Bi-Weekly Invoice', 'Monthly'];

  useEffect(() => {
    fetchAuditData();
    fetchAllTeamMembers();
  }, []);

  const fetchAuditData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/projects/audit`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAuditData(data);
    } catch (error) {
      console.error('Error fetching audit data:', error);
      setAuditData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTeamMembers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/team-members`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Filter to only active team members for Account Owner dropdown
      setAllTeamMembers(data.filter((member: AllTeamMember) => member.is_active));
    } catch (error) {
      console.error('Error fetching all team members:', error);
      setAllTeamMembers([]);
    }
  };

  const handleEditField = (projectCode: string, fieldType: string, currentValue: string | null) => {
    setEditingField({ projectCode, fieldType });
    setEditValue(currentValue || '');
  };

  const handleSaveField = async () => {
    if (!editingField || !editValue) return;

    try {
      const response = await fetch(`${API_BASE}/api/projects/${editingField.projectCode}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingField.fieldType,
          value: editValue
        })
      });

      if (response.ok) {
        // Refresh audit data
        await fetchAuditData();
        setEditingField(null);
        setEditValue('');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to save field'}`);
      }
    } catch (error) {
      console.error('Error saving field:', error);
      alert('Error saving field');
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  // Filter projects based on search and filter criteria
  const getFilteredProjects = () => {
    if (!auditData) return [];

    let filtered = auditData.projects.filter(project => {
      // Search filter
      if (searchFilter) {
        const searchTerm = searchFilter.toLowerCase();
        if (!project.project_name.toLowerCase().includes(searchTerm) && 
            !project.client_name.toLowerCase().includes(searchTerm) &&
            !project.code.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      // Field filter
      if (filterBy !== 'all') {
        switch (filterBy) {
          case 'revenue_type':
            return project.missing_revenue_type === 1;
          case 'account_owner':
            return project.missing_account_owner === 1;
          case 'billing_type':
            return project.missing_billing_type === 1;
          default:
            return true;
        }
      }

      return true;
    });

    return filtered;
  };

  const renderFieldValue = (project: AuditProject, fieldType: string, currentValue: string | null, isMissing: boolean) => {
    const isEditing = editingField?.projectCode === project.code && editingField?.fieldType === fieldType;

    if (isEditing) {
      // Render edit input based on field type
      if (fieldType === FIELD_TYPES.REVENUE_TYPE) {
        return (
          <div className="inline-edit">
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="edit-select"
            >
              <option value="">Select revenue type</option>
              {REVENUE_TYPE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <button onClick={handleSaveField} className="save-btn">Save</button>
            <button onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
          </div>
        );
      } else if (fieldType === FIELD_TYPES.ACCOUNT_OWNER) {
        return (
          <div className="inline-edit">
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="edit-select"
            >
              <option value="">Select account owner</option>
              {allTeamMembers.map(member => (
                <option key={member.id} value={member.full_name}>{member.full_name}</option>
              ))}
            </select>
            <button onClick={handleSaveField} className="save-btn">Save</button>
            <button onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
          </div>
        );
      } else if (fieldType === FIELD_TYPES.BILLING_TYPE) {
        return (
          <div className="inline-edit">
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="edit-select"
            >
              <option value="">Select billing type</option>
              {BILLING_TYPE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <button onClick={handleSaveField} className="save-btn">Save</button>
            <button onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
          </div>
        );
      }
    }

    if (isMissing) {
      return (
        <div className="missing-field">
          <span className="missing-indicator">Missing</span>
          <button 
            onClick={() => handleEditField(project.code, fieldType, currentValue)}
            className="add-btn"
          >
            Add
          </button>
        </div>
      );
    }

    return (
      <div className="field-value">
        <span>{currentValue}</span>
        <button 
          onClick={() => handleEditField(project.code, fieldType, currentValue)}
          className="edit-btn-small"
        >
          Edit
        </button>
      </div>
    );
  };

  const filteredProjects = getFilteredProjects();

  if (loading) return <div className="loading">Loading audit data...</div>;

  if (!auditData) {
    return <div className="error">Failed to load audit data.</div>;
  }

  return (
    <div className="audit-container">
      <nav className="breadcrumb">
        <Link to="/">Home</Link> / Project Data Audit
      </nav>

      <header className="audit-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Project Data Audit</h1>
            <p>Identify and complete missing project data for active projects</p>
          </div>
          <div className="summary-stats">
            <div className="stat-card">
              <div className="stat-number">{auditData.summary.total_projects_with_issues}</div>
              <div className="stat-label">Projects with Issues</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{auditData.summary.missing_revenue_type}</div>
              <div className="stat-label">Missing Revenue Type</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{auditData.summary.missing_account_owner}</div>
              <div className="stat-label">Missing Account Owner</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{auditData.summary.missing_billing_type}</div>
              <div className="stat-label">Missing Billing Type</div>
            </div>
          </div>
        </div>
      </header>

      <main className="audit-content">
        <div className="audit-controls">
          <div className="filter-controls">
            <div className="filter-group">
              <label htmlFor="audit-search-filter">Search projects:</label>
              <input
                id="audit-search-filter"
                type="text"
                placeholder="Search by project name, code, or client..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-group">
              <label htmlFor="field-filter">Filter by missing field:</label>
              <select
                id="field-filter"
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Issues</option>
                <option value="revenue_type">Missing Revenue Type</option>
                <option value="account_owner">Missing Account Owner</option>
                <option value="billing_type">Missing Billing Type</option>
              </select>
            </div>
          </div>
          <div className="results-summary">
            <span className="results-count">
              {filteredProjects.length} of {auditData.projects.length} projects
              {searchFilter && ` (filtered by "${searchFilter}")`}
            </span>
          </div>
        </div>

        {filteredProjects.length > 0 ? (
          <div className="audit-table">
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Code</th>
                  <th>Revenue Type</th>
                  <th>Account Owner</th>
                  <th>Billing Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr key={project.code}>
                    <td className="project-name">{project.project_name}</td>
                    <td className="client-name">{project.client_name}</td>
                    <td className="project-code">{project.code}</td>
                    <td>
                      {renderFieldValue(
                        project, 
                        FIELD_TYPES.REVENUE_TYPE, 
                        project.revenue_type, 
                        project.missing_revenue_type === 1
                      )}
                    </td>
                    <td>
                      {renderFieldValue(
                        project, 
                        FIELD_TYPES.ACCOUNT_OWNER, 
                        project.account_owner, 
                        project.missing_account_owner === 1
                      )}
                    </td>
                    <td>
                      {renderFieldValue(
                        project, 
                        FIELD_TYPES.BILLING_TYPE, 
                        project.billing_type, 
                        project.missing_billing_type === 1
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data">
            {auditData.projects.length === 0 ? (
              "No projects with missing data found. All active projects have complete data!"
            ) : (
              `No projects match the current filter "${searchFilter}".`
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectAudit;