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

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);

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
    } catch (error) {
      console.error('Error fetching project details:', error);
      alert('Error loading project details');
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

  if (loading) return <div className="loading">Loading projects...</div>;

  return (
    <div className="projects-container">
      <nav className="breadcrumb">
        <Link to="/">Home</Link> / Projects
      </nav>

      <header className="projects-header">
        <h1>Projects Dashboard</h1>
        <p>Manage project data and team assignments</p>
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

        <div className="projects-grid">
          {projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <h3>{project.name}</h3>
                <div className="project-code">{project.code}</div>
              </div>
              
              <div className="project-info">
                {project.client_name && (
                  <div className="project-client">Client: {project.client_name}</div>
                )}
                
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
                <h3>Team Members ({selectedProject.team_members.length})</h3>
                {selectedProject.team_members.length > 0 ? (
                  <div className="team-members-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Role</th>
                          <th>Cost Rate</th>
                          <th>SOW Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProject.team_members.map((member) => (
                          <tr key={member.augusto_team_member_id}>
                            <td>{member.full_name}</td>
                            <td>{member.role}</td>
                            <td>${member.cost_rate}</td>
                            <td>{member.sow_hours || 'N/A'}</td>
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
                <h3>Project Data ({selectedProject.project_data.length})</h3>
                {selectedProject.project_data.length > 0 ? (
                  <div className="project-data-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProject.project_data.map((data) => (
                          <tr key={data.id}>
                            <td>{data.name}</td>
                            <td>{data.value || 'N/A'}</td>
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