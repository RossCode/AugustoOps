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

interface FixedCostTask {
  id: number;
  project_id: number;
  task_id: number;
  billable_amount: string;
  cost_amount: string;
  date: string;
  description?: string;
  task_name?: string;
}

interface HarvestTask {
  task_id: number;
  task_name: string;
}

interface ProjectDetails {
  project: any;
  team_members: TeamMember[];
  project_data: ProjectData[];
  fixed_cost_tasks?: FixedCostTask[];
}

interface AvailableTeamMember {
  id: number;
  full_name: string;
  role: string;
  default_cost_rate: string;
  service_line_id: string;
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

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedProject, setSelectedProject] = useState<ProjectDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [availableTeamMembers, setAvailableTeamMembers] = useState<AvailableTeamMember[]>([]);
  const [showAddDataForm, setShowAddDataForm] = useState(false);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ name: '', value: '' });
  const [selectedFieldType, setSelectedFieldType] = useState('');
  const [allTeamMembers, setAllTeamMembers] = useState<AllTeamMember[]>([]);
  const [newTeamMember, setNewTeamMember] = useState({ augusto_team_member_id: '', cost_rate: '', sow_hours: '' });
  const [fixedCostTasks, setFixedCostTasks] = useState<FixedCostTask[]>([]);
  const [harvestTasks, setHarvestTasks] = useState<HarvestTask[]>([]);
  const [newFixedCostTask, setNewFixedCostTask] = useState({ 
    task_id: '', 
    billable_amount: '', 
    cost_amount: '', 
    date: '', 
    description: '' 
  });
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Predefined field options
  const FIELD_TYPES = {
    REVENUE_TYPE: 'Revenue Type',
    ACCOUNT_OWNER: 'Account Owner', 
    BILLING_TYPE: 'Billing Type',
    CUSTOM: 'Custom'
  };
  
  const REVENUE_TYPE_OPTIONS = ['New', 'Extension', 'Recurring'];
  const BILLING_TYPE_OPTIONS = ['Up Front', 'Bi-Weekly Journal Entry', 'Bi-Weekly Invoice', 'Monthly'];
  
  // Edit state management
  const [editingTeamMember, setEditingTeamMember] = useState<number | null>(null);
  const [editingProjectData, setEditingProjectData] = useState<number | null>(null);
  const [editingFixedTask, setEditingFixedTask] = useState<number | null>(null);
  
  // Edit form states
  const [editTeamMemberForm, setEditTeamMemberForm] = useState({ cost_rate: '', sow_hours: '' });
  const [editProjectDataForm, setEditProjectDataForm] = useState({ name: '', value: '' });
  const [editFieldType, setEditFieldType] = useState('');
  const [editFixedTaskForm, setEditFixedTaskForm] = useState({ 
    task_id: '', 
    billable_amount: '', 
    cost_amount: '', 
    date: '', 
    description: '' 
  });

  useEffect(() => {
    fetchProjects();
  }, [showInactive]);

  useEffect(() => {
    // Fetch all team members when component mounts for Account Owner dropdown
    fetchAllTeamMembers();
  }, []);

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
      
      // Fetch fixed cost tasks and harvest tasks
      fetchFixedCostTasks(projectCode);
      fetchHarvestTasks(projectCode);
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

  const fetchFixedCostTasks = async (projectCode: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectCode}/fixed-cost-tasks`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setFixedCostTasks(data);
    } catch (error) {
      console.error('Error fetching fixed cost tasks:', error);
      setFixedCostTasks([]);
    }
  };

  const fetchHarvestTasks = async (projectCode: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectCode}/harvest-tasks`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setHarvestTasks(data);
    } catch (error) {
      console.error('Error fetching harvest tasks:', error);
      setHarvestTasks([]);
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

  const handleFieldTypeChange = (fieldType: string) => {
    setSelectedFieldType(fieldType);
    if (fieldType !== FIELD_TYPES.CUSTOM) {
      setNewProjectData({ name: fieldType, value: '' });
    } else {
      setNewProjectData({ name: '', value: '' });
    }
  };

  const handleAddProjectData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newProjectData.name || !newProjectData.value) return;

    try {
      const response = await fetch(`${API_BASE}/api/projects/${selectedProject.project.code}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProjectData)
      });

      if (response.ok) {
        setNewProjectData({ name: '', value: '' });
        setSelectedFieldType('');
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

  const handleAddFixedCostTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newFixedCostTask.task_id || !newFixedCostTask.billable_amount || !newFixedCostTask.cost_amount || !newFixedCostTask.date) return;

    try {
      const response = await fetch(`${API_BASE}/api/projects/${selectedProject.project.code}/fixed-cost-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: parseInt(newFixedCostTask.task_id),
          billable_amount: parseFloat(newFixedCostTask.billable_amount),
          cost_amount: parseFloat(newFixedCostTask.cost_amount),
          date: newFixedCostTask.date,
          description: newFixedCostTask.description || null
        })
      });

      if (response.ok) {
        setNewFixedCostTask({ task_id: '', billable_amount: '', cost_amount: '', date: '', description: '' });
        setShowAddTaskForm(false);
        // Refresh fixed cost tasks
        fetchFixedCostTasks(selectedProject.project.code);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to add fixed cost task'}`);
      }
    } catch (error) {
      console.error('Error adding fixed cost task:', error);
      alert('Error adding fixed cost task');
    }
  };

  const handleDeleteFixedCostTask = async (taskId: number) => {
    if (!selectedProject || !window.confirm('Are you sure you want to delete this fixed cost task?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/projects/${selectedProject.project.code}/fixed-cost-tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Refresh fixed cost tasks
        fetchFixedCostTasks(selectedProject.project.code);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to delete fixed cost task'}`);
      }
    } catch (error) {
      console.error('Error deleting fixed cost task:', error);
      alert('Error deleting fixed cost task');
    }
  };

  const handleSyncProjects = async () => {
    setSyncLoading(true);
    setSyncMessage(null);

    try {
      const response = await fetch(`${API_BASE}/api/sync/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSyncMessage({
          type: 'success',
          text: 'Projects sync triggered successfully. Refresh the page in a few minutes to see updated data.'
        });
        // Auto-refresh projects after a successful sync
        setTimeout(() => {
          fetchProjects();
        }, 2000);
      } else {
        setSyncMessage({
          type: 'error',
          text: data.error || 'Failed to trigger projects sync'
        });
      }
    } catch (error) {
      setSyncMessage({
        type: 'error',
        text: 'Network error: Could not trigger projects sync. Please check your connection and try again.'
      });
    } finally {
      setSyncLoading(false);
      // Clear message after 5 seconds
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  // Team Member edit handlers
  const handleEditTeamMember = (memberId: number, member: TeamMember) => {
    setEditingTeamMember(memberId);
    setEditTeamMemberForm({
      cost_rate: member.cost_rate,
      sow_hours: member.sow_hours?.toString() || ''
    });
  };

  const handleSaveTeamMember = async (memberId: number) => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`${API_BASE}/api/projects/${selectedProject.project.code}/team-members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cost_rate: parseFloat(editTeamMemberForm.cost_rate),
          sow_hours: editTeamMemberForm.sow_hours ? parseInt(editTeamMemberForm.sow_hours) : null
        })
      });

      if (response.ok) {
        setEditingTeamMember(null);
        // Refresh project details
        fetchProjectDetails(selectedProject.project.code);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to update team member'}`);
      }
    } catch (error) {
      console.error('Error updating team member:', error);
      alert('Error updating team member');
    }
  };

  const handleCancelEditTeamMember = () => {
    setEditingTeamMember(null);
    setEditTeamMemberForm({ cost_rate: '', sow_hours: '' });
  };

  // Project Data edit handlers
  const handleEditProjectData = (dataId: number, data: ProjectData) => {
    setEditingProjectData(dataId);
    setEditProjectDataForm({
      name: data.name,
      value: data.value || ''
    });
    
    // Determine field type based on name
    if (data.name === FIELD_TYPES.REVENUE_TYPE) {
      setEditFieldType(FIELD_TYPES.REVENUE_TYPE);
    } else if (data.name === FIELD_TYPES.ACCOUNT_OWNER) {
      setEditFieldType(FIELD_TYPES.ACCOUNT_OWNER);
    } else if (data.name === FIELD_TYPES.BILLING_TYPE) {
      setEditFieldType(FIELD_TYPES.BILLING_TYPE);
    } else {
      setEditFieldType(FIELD_TYPES.CUSTOM);
    }
  };

  const handleEditFieldTypeChange = (fieldType: string) => {
    setEditFieldType(fieldType);
    if (fieldType !== FIELD_TYPES.CUSTOM) {
      setEditProjectDataForm({ name: fieldType, value: editProjectDataForm.value });
    }
  };

  const handleSaveProjectData = async (dataId: number) => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`${API_BASE}/api/projects/${selectedProject.project.code}/data/${dataId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProjectDataForm)
      });

      if (response.ok) {
        setEditingProjectData(null);
        // Refresh project details
        fetchProjectDetails(selectedProject.project.code);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to update project data'}`);
      }
    } catch (error) {
      console.error('Error updating project data:', error);
      alert('Error updating project data');
    }
  };

  const handleCancelEditProjectData = () => {
    setEditingProjectData(null);
    setEditProjectDataForm({ name: '', value: '' });
    setEditFieldType('');
  };

  // Fixed Cost Task edit handlers
  const handleEditFixedTask = (taskId: number, task: FixedCostTask) => {
    setEditingFixedTask(taskId);
    setEditFixedTaskForm({
      task_id: task.task_id.toString(),
      billable_amount: task.billable_amount,
      cost_amount: task.cost_amount,
      date: task.date,
      description: task.description || ''
    });
  };

  const handleSaveFixedTask = async (taskId: number) => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`${API_BASE}/api/projects/${selectedProject.project.code}/fixed-cost-tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: parseInt(editFixedTaskForm.task_id),
          billable_amount: parseFloat(editFixedTaskForm.billable_amount),
          cost_amount: parseFloat(editFixedTaskForm.cost_amount),
          date: editFixedTaskForm.date,
          description: editFixedTaskForm.description || null
        })
      });

      if (response.ok) {
        setEditingFixedTask(null);
        // Refresh fixed cost tasks
        fetchFixedCostTasks(selectedProject.project.code);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to update fixed cost task'}`);
      }
    } catch (error) {
      console.error('Error updating fixed cost task:', error);
      alert('Error updating fixed cost task');
    }
  };

  const handleCancelEditFixedTask = () => {
    setEditingFixedTask(null);
    setEditFixedTaskForm({ 
      task_id: '', 
      billable_amount: '', 
      cost_amount: '', 
      date: '', 
      description: '' 
    });
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

  // Filter projects by code, name, or client name if filter is applied
  const filteredProjects = projects.filter(project => {
    if (!searchFilter) return true;
    const searchTerm = searchFilter.toLowerCase();
    return (
      project.code.toLowerCase().includes(searchTerm) ||
      project.name.toLowerCase().includes(searchTerm) ||
      (project.client_name && project.client_name.toLowerCase().includes(searchTerm))
    );
  });

  // Group filtered projects by client
  const groupedProjects = filteredProjects.reduce((groups: { [key: string]: Project[] }, project) => {
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
        <div className="header-content">
          <div className="header-text">
            <h1>Projects Dashboard</h1>
            <p>Manage project data and team assignments for client projects (300XXX codes only) • Organized by client</p>
          </div>
          <div className="header-actions">
            <button
              className={`sync-projects-button ${syncLoading ? 'loading' : ''}`}
              onClick={handleSyncProjects}
              disabled={syncLoading}
              title="Trigger n8n projects sync"
            >
              {syncLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Syncing...
                </>
              ) : (
                <>
                  <span className="sync-icon">🔄</span>
                  Sync Projects
                </>
              )}
            </button>
          </div>
        </div>
        
        {syncMessage && (
          <div className={`sync-message ${syncMessage.type}`}>
            <span className="message-icon">
              {syncMessage.type === 'success' ? '✅' : '❌'}
            </span>
            {syncMessage.text}
          </div>
        )}
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
            <div className="filter-group">
              <label htmlFor="project-search-filter">Search projects:</label>
              <input
                id="project-search-filter"
                type="text"
                placeholder="Search by project name, code, or client..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="project-search-filter"
              />
            </div>
          </div>
          <div className="projects-summary">
            <span className="project-count">
              {filteredProjects.length} of {projects.length} projects
              {searchFilter && ` (filtered by "${searchFilter}")`}
            </span>
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

        {projects.length > 0 && filteredProjects.length === 0 && (
          <div className="no-data">
            No projects match the current search "{searchFilter}".
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
                          <tr key={member.augusto_team_member_id} className={editingTeamMember === member.augusto_team_member_id ? 'editing-row' : ''}>
                            <td>{member.full_name}</td>
                            <td>{member.role}</td>
                            <td>
                              {editingTeamMember === member.augusto_team_member_id ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  className="edit-input"
                                  value={editTeamMemberForm.cost_rate}
                                  onChange={(e) => setEditTeamMemberForm({...editTeamMemberForm, cost_rate: e.target.value})}
                                />
                              ) : (
                                `$${member.cost_rate}`
                              )}
                            </td>
                            <td>
                              {editingTeamMember === member.augusto_team_member_id ? (
                                <input
                                  type="number"
                                  className="edit-input"
                                  value={editTeamMemberForm.sow_hours}
                                  onChange={(e) => setEditTeamMemberForm({...editTeamMemberForm, sow_hours: e.target.value})}
                                  placeholder="N/A"
                                />
                              ) : (
                                member.sow_hours || 'N/A'
                              )}
                            </td>
                            <td>
                              {editingTeamMember === member.augusto_team_member_id ? (
                                <div className="edit-actions">
                                  <button 
                                    className="save-button-small"
                                    onClick={() => handleSaveTeamMember(member.augusto_team_member_id)}
                                    title="Save changes"
                                  >
                                    Save
                                  </button>
                                  <button 
                                    className="cancel-button-small"
                                    onClick={handleCancelEditTeamMember}
                                    title="Cancel editing"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="edit-actions">
                                  <button 
                                    className="edit-button-small"
                                    onClick={() => handleEditTeamMember(member.augusto_team_member_id, member)}
                                    title="Edit team member"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    className="delete-button-small"
                                    onClick={() => handleRemoveTeamMember(member.augusto_team_member_id)}
                                    title="Remove from project"
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
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
                        <label>Field Type:</label>
                        <select
                          value={selectedFieldType}
                          onChange={(e) => handleFieldTypeChange(e.target.value)}
                          required
                        >
                          <option value="">Select field type</option>
                          <option value={FIELD_TYPES.REVENUE_TYPE}>{FIELD_TYPES.REVENUE_TYPE}</option>
                          <option value={FIELD_TYPES.ACCOUNT_OWNER}>{FIELD_TYPES.ACCOUNT_OWNER}</option>
                          <option value={FIELD_TYPES.BILLING_TYPE}>{FIELD_TYPES.BILLING_TYPE}</option>
                          <option value={FIELD_TYPES.CUSTOM}>{FIELD_TYPES.CUSTOM}</option>
                        </select>
                      </div>
                      
                      {selectedFieldType === FIELD_TYPES.CUSTOM && (
                        <div className="form-group">
                          <label>Custom Field Name:</label>
                          <input
                            type="text"
                            value={newProjectData.name}
                            onChange={(e) => setNewProjectData({...newProjectData, name: e.target.value})}
                            required
                            placeholder="e.g., PO Number, Manager, Budget Note"
                          />
                        </div>
                      )}
                      
                      <div className="form-group">
                        <label>Value:</label>
                        {selectedFieldType === FIELD_TYPES.REVENUE_TYPE && (
                          <select
                            value={newProjectData.value}
                            onChange={(e) => setNewProjectData({...newProjectData, value: e.target.value})}
                            required
                          >
                            <option value="">Select revenue type</option>
                            {REVENUE_TYPE_OPTIONS.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        )}
                        
                        {selectedFieldType === FIELD_TYPES.ACCOUNT_OWNER && (
                          <select
                            value={newProjectData.value}
                            onChange={(e) => setNewProjectData({...newProjectData, value: e.target.value})}
                            required
                          >
                            <option value="">Select account owner</option>
                            {allTeamMembers.map(member => (
                              <option key={member.id} value={member.full_name}>{member.full_name}</option>
                            ))}
                          </select>
                        )}
                        
                        {selectedFieldType === FIELD_TYPES.BILLING_TYPE && (
                          <select
                            value={newProjectData.value}
                            onChange={(e) => setNewProjectData({...newProjectData, value: e.target.value})}
                            required
                          >
                            <option value="">Select billing type</option>
                            {BILLING_TYPE_OPTIONS.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        )}
                        
                        {(selectedFieldType === FIELD_TYPES.CUSTOM || selectedFieldType === '') && (
                          <input
                            type="text"
                            value={newProjectData.value}
                            onChange={(e) => setNewProjectData({...newProjectData, value: e.target.value})}
                            placeholder="e.g., 12345, John Smith, Additional requirements"
                            required={selectedFieldType === FIELD_TYPES.CUSTOM}
                          />
                        )}
                      </div>
                      
                      <div className="form-actions">
                        <button type="submit">Add Data</button>
                        <button type="button" onClick={() => {
                          setShowAddDataForm(false);
                          setSelectedFieldType('');
                          setNewProjectData({ name: '', value: '' });
                        }}>Cancel</button>
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
                          <tr key={data.id} className={editingProjectData === data.id ? 'editing-row' : ''}>
                            <td>
                              {editingProjectData === data.id ? (
                                <div>
                                  <select
                                    className="edit-input"
                                    value={editFieldType}
                                    onChange={(e) => handleEditFieldTypeChange(e.target.value)}
                                  >
                                    <option value={FIELD_TYPES.REVENUE_TYPE}>{FIELD_TYPES.REVENUE_TYPE}</option>
                                    <option value={FIELD_TYPES.ACCOUNT_OWNER}>{FIELD_TYPES.ACCOUNT_OWNER}</option>
                                    <option value={FIELD_TYPES.BILLING_TYPE}>{FIELD_TYPES.BILLING_TYPE}</option>
                                    <option value={FIELD_TYPES.CUSTOM}>{FIELD_TYPES.CUSTOM}</option>
                                  </select>
                                  {editFieldType === FIELD_TYPES.CUSTOM && (
                                    <input
                                      type="text"
                                      className="edit-input"
                                      value={editProjectDataForm.name}
                                      onChange={(e) => setEditProjectDataForm({...editProjectDataForm, name: e.target.value})}
                                      placeholder="Custom field name"
                                      style={{marginTop: '4px'}}
                                    />
                                  )}
                                </div>
                              ) : (
                                data.name
                              )}
                            </td>
                            <td>
                              {editingProjectData === data.id ? (
                                <div>
                                  {editFieldType === FIELD_TYPES.REVENUE_TYPE && (
                                    <select
                                      className="edit-input"
                                      value={editProjectDataForm.value}
                                      onChange={(e) => setEditProjectDataForm({...editProjectDataForm, value: e.target.value})}
                                    >
                                      <option value="">Select revenue type</option>
                                      {REVENUE_TYPE_OPTIONS.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                      ))}
                                    </select>
                                  )}
                                  
                                  {editFieldType === FIELD_TYPES.ACCOUNT_OWNER && (
                                    <select
                                      className="edit-input"
                                      value={editProjectDataForm.value}
                                      onChange={(e) => setEditProjectDataForm({...editProjectDataForm, value: e.target.value})}
                                    >
                                      <option value="">Select account owner</option>
                                      {allTeamMembers.map(member => (
                                        <option key={member.id} value={member.full_name}>{member.full_name}</option>
                                      ))}
                                    </select>
                                  )}
                                  
                                  {editFieldType === FIELD_TYPES.BILLING_TYPE && (
                                    <select
                                      className="edit-input"
                                      value={editProjectDataForm.value}
                                      onChange={(e) => setEditProjectDataForm({...editProjectDataForm, value: e.target.value})}
                                    >
                                      <option value="">Select billing type</option>
                                      {BILLING_TYPE_OPTIONS.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                      ))}
                                    </select>
                                  )}
                                  
                                  {editFieldType === FIELD_TYPES.CUSTOM && (
                                    <input
                                      type="text"
                                      className="edit-input"
                                      value={editProjectDataForm.value}
                                      onChange={(e) => setEditProjectDataForm({...editProjectDataForm, value: e.target.value})}
                                      placeholder="Enter custom value"
                                    />
                                  )}
                                </div>
                              ) : (
                                data.value || 'N/A'
                              )}
                            </td>
                            <td>
                              {editingProjectData === data.id ? (
                                <div className="edit-actions">
                                  <button 
                                    className="save-button-small"
                                    onClick={() => handleSaveProjectData(data.id)}
                                    title="Save changes"
                                  >
                                    Save
                                  </button>
                                  <button 
                                    className="cancel-button-small"
                                    onClick={handleCancelEditProjectData}
                                    title="Cancel editing"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="edit-actions">
                                  <button 
                                    className="edit-button-small"
                                    onClick={() => handleEditProjectData(data.id, data)}
                                    title="Edit project data"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    className="delete-button-small"
                                    onClick={() => handleDeleteProjectData(data.id)}
                                    title="Delete project data"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
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

              <div className="fixed-cost-tasks-section">
                <div className="section-header-with-action">
                  <h3>Fixed Cost Tasks ({fixedCostTasks.length})</h3>
                  <button 
                    className="add-button"
                    onClick={() => setShowAddTaskForm(!showAddTaskForm)}
                  >
                    {showAddTaskForm ? 'Cancel' : 'Add Fixed Cost Task'}
                  </button>
                </div>
                
                {showAddTaskForm && (
                  <div className="add-form">
                    <h4>Add Fixed Cost Task</h4>
                    <form onSubmit={handleAddFixedCostTask}>
                      <div className="form-group">
                        <label>Task:</label>
                        <select
                          value={newFixedCostTask.task_id}
                          onChange={(e) => setNewFixedCostTask({...newFixedCostTask, task_id: e.target.value})}
                          required
                        >
                          <option value="">Select a task</option>
                          {harvestTasks.map(task => (
                            <option key={task.task_id} value={task.task_id}>
                              {task.task_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Billable Amount ($):</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newFixedCostTask.billable_amount}
                          onChange={(e) => setNewFixedCostTask({...newFixedCostTask, billable_amount: e.target.value})}
                          required
                          placeholder="e.g., 1500.00"
                        />
                      </div>
                      <div className="form-group">
                        <label>Cost Amount ($):</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newFixedCostTask.cost_amount}
                          onChange={(e) => setNewFixedCostTask({...newFixedCostTask, cost_amount: e.target.value})}
                          required
                          placeholder="e.g., 1000.00"
                        />
                      </div>
                      <div className="form-group">
                        <label>Date:</label>
                        <input
                          type="date"
                          value={newFixedCostTask.date}
                          onChange={(e) => setNewFixedCostTask({...newFixedCostTask, date: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Description (optional):</label>
                        <textarea
                          value={newFixedCostTask.description}
                          onChange={(e) => setNewFixedCostTask({...newFixedCostTask, description: e.target.value})}
                          placeholder="Additional notes about this fixed cost task"
                          rows={3}
                        />
                      </div>
                      <div className="form-actions">
                        <button type="submit">Add Fixed Cost Task</button>
                        <button type="button" onClick={() => setShowAddTaskForm(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                )}
                
                {fixedCostTasks.length > 0 ? (
                  <div className="fixed-cost-tasks-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Task</th>
                          <th>Billable Amount</th>
                          <th>Cost Amount</th>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fixedCostTasks.map((task) => (
                          <tr key={task.id} className={editingFixedTask === task.id ? 'editing-row' : ''}>
                            <td>
                              {editingFixedTask === task.id ? (
                                <select
                                  className="edit-input"
                                  value={editFixedTaskForm.task_id}
                                  onChange={(e) => setEditFixedTaskForm({...editFixedTaskForm, task_id: e.target.value})}
                                >
                                  <option value="">Select a task</option>
                                  {harvestTasks.map(harvestTask => (
                                    <option key={harvestTask.task_id} value={harvestTask.task_id}>
                                      {harvestTask.task_name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                task.task_name || `Task ${task.task_id}`
                              )}
                            </td>
                            <td>
                              {editingFixedTask === task.id ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="edit-input"
                                  value={editFixedTaskForm.billable_amount}
                                  onChange={(e) => setEditFixedTaskForm({...editFixedTaskForm, billable_amount: e.target.value})}
                                />
                              ) : (
                                formatCurrency(parseFloat(task.billable_amount))
                              )}
                            </td>
                            <td>
                              {editingFixedTask === task.id ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="edit-input"
                                  value={editFixedTaskForm.cost_amount}
                                  onChange={(e) => setEditFixedTaskForm({...editFixedTaskForm, cost_amount: e.target.value})}
                                />
                              ) : (
                                formatCurrency(parseFloat(task.cost_amount))
                              )}
                            </td>
                            <td>
                              {editingFixedTask === task.id ? (
                                <input
                                  type="date"
                                  className="edit-input"
                                  value={editFixedTaskForm.date}
                                  onChange={(e) => setEditFixedTaskForm({...editFixedTaskForm, date: e.target.value})}
                                />
                              ) : (
                                formatDate(task.date)
                              )}
                            </td>
                            <td>
                              {editingFixedTask === task.id ? (
                                <textarea
                                  className="edit-input edit-textarea"
                                  value={editFixedTaskForm.description}
                                  onChange={(e) => setEditFixedTaskForm({...editFixedTaskForm, description: e.target.value})}
                                  placeholder="N/A"
                                  rows={2}
                                />
                              ) : (
                                task.description || 'N/A'
                              )}
                            </td>
                            <td>
                              {editingFixedTask === task.id ? (
                                <div className="edit-actions">
                                  <button 
                                    className="save-button-small"
                                    onClick={() => handleSaveFixedTask(task.id)}
                                    title="Save changes"
                                  >
                                    Save
                                  </button>
                                  <button 
                                    className="cancel-button-small"
                                    onClick={handleCancelEditFixedTask}
                                    title="Cancel editing"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="edit-actions">
                                  <button 
                                    className="edit-button-small"
                                    onClick={() => handleEditFixedTask(task.id, task)}
                                    title="Edit fixed cost task"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    className="delete-button-small"
                                    onClick={() => handleDeleteFixedCostTask(task.id)}
                                    title="Delete fixed cost task"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No fixed cost tasks available.</p>
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