import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Roles.css';

interface Role {
  id: number;
  role_name: string;
  default_rate: string;
  service_line_id: string;
  service_line_name?: string;
}

interface ServiceLine {
  service_line_id: string;
  name: string;
}

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const Roles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRole, setNewRole] = useState({ role_name: '', default_rate: '', service_line_id: '' });

  useEffect(() => {
    fetchRoles();
    fetchServiceLines();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/roles`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        console.error('API did not return an array:', data);
        setRoles([]);
        return;
      }
      
      const validRoles = data.filter(role => {
        if (!role || typeof role !== 'object') {
          console.warn('Invalid role object:', role);
          return false;
        }
        if (!role.role_name) {
          console.warn('Role missing role_name:', role);
          return false;
        }
        return true;
      });
      
      setRoles(validRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceLines = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/service-lines`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setServiceLines(data);
    } catch (error) {
      console.error('Error fetching service lines:', error);
      setServiceLines([]);
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.role_name || !newRole.default_rate || !newRole.service_line_id) return;

    try {
      const response = await fetch(`${API_BASE}/api/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRole)
      });

      if (response.ok) {
        setNewRole({ role_name: '', default_rate: '', service_line_id: '' });
        setShowAddForm(false);
        fetchRoles();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to add role'}`);
      }
    } catch (error) {
      console.error('Error adding role:', error);
      alert('Error adding role');
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    try {
      const response = await fetch(`${API_BASE}/api/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_name: editingRole.role_name,
          default_rate: editingRole.default_rate,
          service_line_id: editingRole.service_line_id
        })
      });

      if (response.ok) {
        setEditingRole(null);
        fetchRoles();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to update role'}`);
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Error updating role');
    }
  };

  const handleDeleteRole = async (roleId: number, roleName: string) => {
    if (!window.confirm(`Are you sure you want to delete role "${roleName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/roles/${roleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchRoles();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to delete role'}`);
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      alert('Error deleting role');
    }
  };

  if (loading) return <div className="loading">Loading roles...</div>;

  if (!Array.isArray(roles)) {
    console.error('Roles is not an array:', roles);
    return <div className="loading">Error loading roles...</div>;
  }

  return (
    <div className="roles-container">
      <nav className="breadcrumb">
        <Link to="/">Home</Link> / Roles
      </nav>

      <header className="roles-header">
        <h1>Roles</h1>
        <p>Manage default roles and job functions</p>
      </header>

      <main className="roles-content">
        <div className="section-header">
          <h2>Default Roles</h2>
          <button 
            className="add-button"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : 'Add Role'}
          </button>
        </div>

        {showAddForm && (
          <div className="add-form">
            <h3>Add New Role</h3>
            <form onSubmit={handleAddRole}>
              <div className="form-group">
                <label>Role Name:</label>
                <input
                  type="text"
                  value={newRole.role_name}
                  onChange={(e) => setNewRole({...newRole, role_name: e.target.value})}
                  required
                  placeholder="e.g., Senior Developer, Project Manager, Designer"
                />
              </div>
              <div className="form-group">
                <label>Default Rate ($):</label>
                <input
                  type="number"
                  step="0.01"
                  value={newRole.default_rate}
                  onChange={(e) => setNewRole({...newRole, default_rate: e.target.value})}
                  required
                  placeholder="e.g., 150.00"
                />
              </div>
              <div className="form-group">
                <label>Service Line:</label>
                <select
                  value={newRole.service_line_id}
                  onChange={(e) => setNewRole({...newRole, service_line_id: e.target.value})}
                  required
                >
                  <option value="">Select a service line</option>
                  {serviceLines.map(line => (
                    <option key={line.service_line_id} value={line.service_line_id}>
                      {line.service_line_id} - {line.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="submit">Add Role</button>
                <button type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="roles-grid">
          {roles.map((role, index) => {
            if (!role || typeof role !== 'object' || !role.role_name || !role.id) {
              console.warn('Skipping invalid role:', role);
              return null;
            }
            
            const safeRole = {
              id: role.id,
              role_name: role.role_name || '',
              default_rate: role.default_rate || '0.00',
              service_line_id: role.service_line_id || '',
              service_line_name: role.service_line_name || 'Unknown'
            };
            
            return (
              <div key={`role-${safeRole.id}-${index}`} className="role-card">
                {editingRole?.id === safeRole.id ? (
                  <form onSubmit={handleUpdateRole}>
                    <div className="form-group">
                      <label>Role Name:</label>
                      <input
                        type="text"
                        value={editingRole.role_name || ''}
                        onChange={(e) => setEditingRole({...editingRole, role_name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Default Rate ($):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingRole.default_rate || ''}
                        onChange={(e) => setEditingRole({...editingRole, default_rate: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Service Line:</label>
                      <select
                        value={editingRole.service_line_id || ''}
                        onChange={(e) => setEditingRole({...editingRole, service_line_id: e.target.value})}
                        required
                      >
                        <option value="">Select a service line</option>
                        {serviceLines.map(line => (
                          <option key={line.service_line_id} value={line.service_line_id}>
                            {line.service_line_id} - {line.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="card-actions">
                      <button type="submit">Save Changes</button>
                      <button type="button" onClick={() => setEditingRole(null)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="role-info">
                      <h4>{safeRole.role_name}</h4>
                      <div className="role-details">
                        <div className="role-rate">Default Rate: ${safeRole.default_rate}</div>
                        <div className="role-service-line">Service Line: {safeRole.service_line_id} - {safeRole.service_line_name}</div>
                        <div className="role-id">ID: {safeRole.id}</div>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button onClick={() => setEditingRole(safeRole)}>Edit</button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteRole(safeRole.id, safeRole.role_name)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {roles.length === 0 && (
          <div className="no-data">
            No roles found. Add one to get started.
          </div>
        )}
      </main>
    </div>
  );
};

export default Roles;