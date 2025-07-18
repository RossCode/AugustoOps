import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Projects.css';

interface Project {
  id: number;
  name: string;
  code: string;
  client_name?: string;
  active: number;
  is_active: number;
  billable: number;
  is_fixed_fee: number;
  budget?: number;
  fee?: number;
  budget_hours?: number;
  starts_on?: string;
  ends_on?: string;
  created_at: string;
  updated_at: string;
  team_member_count: number;
  project_data_count: number;
}

interface TeamMember {
  augusto_team_member_id: number;
  project_code: string;
  cost_rate: string;
  sow_hours?: number;
  full_name: string;
  role: string;
  service_line_id: string;
}

interface ProjectData {
  id: number;
  project_code: string;
  name: string;
  value?: string;
}

interface ProjectDetails {
  project: any;
  team_members: TeamMember[];
  project_data: ProjectData[];
}

interface AvailableTeamMember {
  id: number;
  full_name: string;
  role: string;
  default_cost_rate: string;
  service_line_id: string;
}

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [availableTeamMembers, setAvailableTeamMembers] = useState<AvailableTeamMember[]>([]);
  const [showAddDataForm, setShowAddDataForm] = useState(false);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ name: '', value: '' });
  const [newTeamMember, setNewTeamMember] = useState({ augusto_team_member_id: '', cost_rate: '', sow_hours: '' });

  useEffect(() => {
    fetchProjects();
  }, [showInactive]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/projects?show_inactive=${showInactive}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetails = async (projectCode: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectCode}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSelectedProject(data);
      setShowDetails(true);
      
      // Fetch available team members for assignment
      fetchAvailableTeamMembers(projectCode);
    } catch (error) {
      console.error('Error fetching project details:', error);
      alert('Error loading project details');
    }
  };

  const fetchAvailableTeamMembers = async (projectCode: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/team-members-for-assignment/${projectCode}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAvailableTeamMembers(data);
    } catch (error) {
      console.error('Error fetching available team members:', error);
      setAvailableTeamMembers([]);
    }
  };

  const handleAddProjectData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newProjectData.name) return;

    try {
      const response = await fetch(`${API_BASE}/api/projects/${selectedProject.project.code}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProjectData)
      });

      if (response.ok) {
        setNewProjectData({ name: '', value: '' });
        setShowAddDataForm(false);
        // Refresh project details
        fetchProjectDetails(selectedProject.project.code);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to add project data'}`);
      }
    } catch (error) {
      console.error('Error adding project data:', error);
      alert('Error adding project data');
    }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newTeamMember.augusto_team_member_id || !newTeamMember.cost_rate) return;

    try {
      const response = await fetch(`${API_BASE}/api/projects/${selectedProject.project.code}/team-members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          augusto_team_member_id: parseInt(newTeamMember.augusto_team_member_id),
          cost_rate: parseFloat(newTeamMember.cost_rate),
          sow_hours: newTeamMember.sow_hours ? parseInt(newTeamMember.sow_hours) : null
        })
      });

      if (response.ok) {
        setNewTeamMember({ augusto_team_member_id: '', cost_rate: '', sow_hours: '' });
        setShowAddMemberForm(false);
        // Refresh project details and available team members
        fetchProjectDetails(selectedProject.project.code);
        fetchAvailableTeamMembers(selectedProject.project.code);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to assign team member'}`);
      }
    } catch (error) {
      console.error('Error assigning team member:', error);
      alert('Error assigning team member');
    }
  };

  const handleDeleteProjectData = async (dataId: number) => {
    if (!selectedProject || !window.confirm('Are you sure you want to delete this project data?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/projects/${selectedProject.project.code}/data/${dataId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Refresh project details
        fetchProjectDetails(selectedProject.project.code);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to delete project data'}`);
      }
    } catch (error) {
      console.error('Error deleting project data:', error);
      alert('Error deleting project data');
    }
  };

  const handleRemoveTeamMember = async (memberId: number) => {
    if (!selectedProject || !window.confirm('Are you sure you want to remove this team member from the project?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/projects/${selectedProject.project.code}/team-members/${memberId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Refresh project details and available team members
        fetchProjectDetails(selectedProject.project.code);
        fetchAvailableTeamMembers(selectedProject.project.code);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to remove team member'}`);
      }
    } catch (error) {
      console.error('Error removing team member:', error);
      alert('Error removing team member');
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Group projects by client
  const groupedProjects = projects.reduce((groups: { [key: string]: Project[] }, project) => {
    const clientName = project.client_name || 'Unknown Client';
    if (!groups[clientName]) {
      groups[clientName] = [];
    }
    groups[clientName].push(project);
    return groups;
  }, {});

  // Sort client names
  const sortedClientNames = Object.keys(groupedProjects).sort();

  if (loading) return <div className="loading">Loading projects...</div>;

  return (
    <div className="projects-container">
      <nav className="breadcrumb">
        <Link to="/">Home</Link> / Projects
      </nav>

      <header className="projects-header">
        <h1>Projects Dashboard</h1>
        <p>Manage project data and team assignments for client projects (300XXX codes only) • Organized by client</p>
      </header>

      <main className="projects-content">
        <div className="projects-controls">
          <div className="filter-controls">
            <label className="toggle-control">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              Show inactive projects
            </label>
          </div>
          <div className="projects-summary">
            <span className="project-count">{projects.length} projects</span>
          </div>
        </div>

        <div className="projects-by-client">
          {sortedClientNames.map((clientName) => (
            <div key={clientName} className="client-group">
              <div className="client-header">
                <h2>{clientName}</h2>
                <span className="project-count-badge">
                  {groupedProjects[clientName].length} project{groupedProjects[clientName].length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="projects-grid">
                {groupedProjects[clientName].map((project) => (
                  <div key={project.id} className="project-card">
                    <div className="project-header">
                      <h3>{project.name}</h3>
                      <div className="project-code">{project.code}</div>
                    </div>
                    
                    <div className="project-info">
                      <div className="project-details">
                        <div className="project-status">
                          <span className={`status-badge ${project.is_active ? 'active' : 'inactive'}`}>
                            {project.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {project.billable ? (
                            <span className="billable-badge">Billable</span>
                          ) : (
                            <span className="non-billable-badge">Non-billable</span>
                          )}
                          {project.is_fixed_fee ? (
                            <span className="fee-badge">Fixed Fee</span>
                          ) : (
                            <span className="hourly-badge">Hourly</span>
                          )}
                        </div>
                        
                        <div className="project-budget">
                          {project.is_fixed_fee ? (
                            <div>Fee: {formatCurrency(project.fee)}</div>
                          ) : (
                            <div>Budget: {formatCurrency(project.budget)}</div>
                          )}
                          {project.budget_hours && (
                            <div>Hours: {project.budget_hours}</div>
                          )}
                        </div>
                        
                        <div className="project-team">
                          <div>Team Members: {project.team_member_count}</div>
                          <div>Project Data: {project.project_data_count}</div>
                        </div>
                        
                        <div className="project-dates">
                          <div>Updated: {formatDate(project.updated_at)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="project-actions">
                      <button 
                        className="details-button"
                        onClick={() => fetchProjectDetails(project.code)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="no-data">
            No projects found.
          </div>
        )}
      </main>

      {/* Project Details Modal */}
      {showDetails && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedProject.project.name}</h2>
              <button className="close-button" onClick={() => setShowDetails(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="project-overview">
                <h3>Project Overview</h3>
                <div className="overview-grid">
                  <div className="overview-item">
                    <strong>Code:</strong> {selectedProject.project.code}
                  </div>
                  <div className="overview-item">
                    <strong>Client:</strong> {selectedProject.project.resolved_client_name || selectedProject.project.client_name || 'N/A'}
                  </div>
                  <div className="overview-item">
                    <strong>Status:</strong> {selectedProject.project.is_active ? 'Active' : 'Inactive'}
                  </div>
                  <div className="overview-item">
                    <strong>Type:</strong> {selectedProject.project.is_fixed_fee ? 'Fixed Fee' : 'Hourly'}
                  </div>
                  <div className="overview-item">
                    <strong>Cost Budget:</strong> {formatCurrency(selectedProject.project.cost_budget)}
                  </div>
                  <div className="overview-item">
                    <strong>Budget Hours:</strong> {selectedProject.project.budget_hours || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="team-members-section">
                <div className="section-header-with-action">
                  <h3>Team Members ({selectedProject.team_members.length})</h3>
                  <button 
                    className="add-button"
                    onClick={() => setShowAddMemberForm(!showAddMemberForm)}
                  >
                    {showAddMemberForm ? 'Cancel' : 'Add Team Member'}
                  </button>
                </div>
                
                {showAddMemberForm && (
                  <div className="add-form">
                    <h4>Add Team Member</h4>
                    <form onSubmit={handleAddTeamMember}>
                      <div className="form-group">
                        <label>Team Member:</label>
                        <select
                          value={newTeamMember.augusto_team_member_id}
                          onChange={(e) => {
                            const memberId = e.target.value;
                            const member = availableTeamMembers.find(m => m.id.toString() === memberId);
                            setNewTeamMember({
                              ...newTeamMember, 
                              augusto_team_member_id: memberId,
                              cost_rate: member ? member.default_cost_rate : ''
                            });
                          }}
                          required
                        >
                          <option value="">Select a team member</option>
                          {availableTeamMembers.map(member => (
                            <option key={member.id} value={member.id}>
                              {member.full_name} - {member.role}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Cost Rate ($):</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newTeamMember.cost_rate}
                          onChange={(e) => setNewTeamMember({...newTeamMember, cost_rate: e.target.value})}
                          required
                          placeholder="e.g., 150.00"
                        />
                      </div>
                      <div className="form-group">
                        <label>SOW Hours (optional):</label>
                        <input
                          type="number"
                          value={newTeamMember.sow_hours}
                          onChange={(e) => setNewTeamMember({...newTeamMember, sow_hours: e.target.value})}
                          placeholder="e.g., 40"
                        />
                      </div>
                      <div className="form-actions">
                        <button type="submit">Add Team Member</button>
                        <button type="button" onClick={() => setShowAddMemberForm(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                )}
                
                {selectedProject.team_members.length > 0 ? (
                  <div className="team-members-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Role</th>
                          <th>Cost Rate</th>
                          <th>SOW Hours</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProject.team_members.map((member) => (
                          <tr key={member.augusto_team_member_id}>
                            <td>{member.full_name}</td>
                            <td>{member.role}</td>
                            <td>${member.cost_rate}</td>
                            <td>{member.sow_hours || 'N/A'}</td>
                            <td>
                              <button 
                                className="delete-button-small"
                                onClick={() => handleRemoveTeamMember(member.augusto_team_member_id)}
                                title="Remove from project"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No team members assigned to this project.</p>
                )}
              </div>

              <div className="project-data-section">
                <div className="section-header-with-action">
                  <h3>Project Data ({selectedProject.project_data.length})</h3>
                  <button 
                    className="add-button"
                    onClick={() => setShowAddDataForm(!showAddDataForm)}
                  >
                    {showAddDataForm ? 'Cancel' : 'Add Data'}
                  </button>
                </div>
                
                {showAddDataForm && (
                  <div className="add-form">
                    <h4>Add Project Data</h4>
                    <form onSubmit={handleAddProjectData}>
                      <div className="form-group">
                        <label>Name:</label>
                        <input
                          type="text"
                          value={newProjectData.name}
                          onChange={(e) => setNewProjectData({...newProjectData, name: e.target.value})}
                          required
                          placeholder="e.g., PO Number, Manager, Budget Note"
                        />
                      </div>
                      <div className="form-group">
                        <label>Value:</label>
                        <input
                          type="text"
                          value={newProjectData.value}
                          onChange={(e) => setNewProjectData({...newProjectData, value: e.target.value})}
                          placeholder="e.g., 12345, John Smith, Additional requirements"
                        />
                      </div>
                      <div className="form-actions">
                        <button type="submit">Add Data</button>
                        <button type="button" onClick={() => setShowAddDataForm(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                )}
                
                {selectedProject.project_data.length > 0 ? (
                  <div className="project-data-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Value</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProject.project_data.map((data) => (
                          <tr key={data.id}>
                            <td>{data.name}</td>
                            <td>{data.value || 'N/A'}</td>
                            <td>
                              <button 
                                className="delete-button-small"
                                onClick={() => handleDeleteProjectData(data.id)}
                                title="Delete project data"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No additional project data available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;