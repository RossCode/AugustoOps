import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ServiceLines.css';

interface ServiceLine {
  service_line_id: string;
  name: string;
}

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const ServiceLines: React.FC = () => {
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingServiceLine, setEditingServiceLine] = useState<ServiceLine | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newServiceLine, setNewServiceLine] = useState({ service_line_id: '', name: '' });

  useEffect(() => {
    fetchServiceLines();
  }, []);

  const fetchServiceLines = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/service-lines`);
      const data = await response.json();
      setServiceLines(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching service lines:', error);
      setServiceLines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddServiceLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceLine.service_line_id || !newServiceLine.name) return;

    try {
      const response = await fetch(`${API_BASE}/api/service-lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newServiceLine)
      });

      if (response.ok) {
        setNewServiceLine({ service_line_id: '', name: '' });
        setShowAddForm(false);
        fetchServiceLines();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to add service line'}`);
      }
    } catch (error) {
      console.error('Error adding service line:', error);
      alert('Error adding service line');
    }
  };

  const handleUpdateServiceLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServiceLine) return;

    try {
      const response = await fetch(`${API_BASE}/api/service-lines/${encodeURIComponent(editingServiceLine.service_line_id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingServiceLine.name })
      });

      if (response.ok) {
        setEditingServiceLine(null);
        fetchServiceLines();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to update service line'}`);
      }
    } catch (error) {
      console.error('Error updating service line:', error);
      alert('Error updating service line');
    }
  };

  const handleDeleteServiceLine = async (serviceLineId: string) => {
    if (!window.confirm(`Are you sure you want to delete service line "${serviceLineId}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/service-lines/${encodeURIComponent(serviceLineId)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchServiceLines();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to delete service line'}`);
      }
    } catch (error) {
      console.error('Error deleting service line:', error);
      alert('Error deleting service line');
    }
  };

  if (loading) return <div className="loading">Loading service lines...</div>;

  return (
    <div className="service-lines-container">
      <nav className="breadcrumb">
        <Link to="/">Home</Link> / Service Lines
      </nav>

      <header className="service-lines-header">
        <h1>Service Lines</h1>
        <p>Manage service line categories and classifications</p>
      </header>

      <main className="service-lines-content">
        <div className="section-header">
          <h2>Service Lines</h2>
          <button 
            className="add-button"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : 'Add Service Line'}
          </button>
        </div>

        {showAddForm && (
          <div className="add-form">
            <h3>Add New Service Line</h3>
            <form onSubmit={handleAddServiceLine}>
              <div className="form-group">
                <label>Service Line ID:</label>
                <input
                  type="text"
                  value={newServiceLine.service_line_id}
                  onChange={(e) => setNewServiceLine({...newServiceLine, service_line_id: e.target.value})}
                  required
                  placeholder="e.g., DEV, QA, PM"
                />
              </div>
              <div className="form-group">
                <label>Service Line Name:</label>
                <input
                  type="text"
                  value={newServiceLine.name}
                  onChange={(e) => setNewServiceLine({...newServiceLine, name: e.target.value})}
                  required
                  placeholder="e.g., Development, Quality Assurance, Project Management"
                />
              </div>
              <div className="form-actions">
                <button type="submit">Add Service Line</button>
                <button type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="service-lines-grid">
          {serviceLines.map(serviceLine => (
            <div key={serviceLine.service_line_id} className="service-line-card">
              {editingServiceLine?.service_line_id === serviceLine.service_line_id ? (
                <form onSubmit={handleUpdateServiceLine}>
                  <div className="form-group">
                    <label>Service Line ID:</label>
                    <input
                      type="text"
                      value={editingServiceLine.service_line_id}
                      disabled
                      className="disabled-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Service Line Name:</label>
                    <input
                      type="text"
                      value={editingServiceLine.name}
                      onChange={(e) => setEditingServiceLine({...editingServiceLine, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="card-actions">
                    <button type="submit">Save Changes</button>
                    <button type="button" onClick={() => setEditingServiceLine(null)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="service-line-info">
                    <h4>{serviceLine.service_line_id}</h4>
                    <p>{serviceLine.name}</p>
                  </div>
                  <div className="card-actions">
                    <button onClick={() => setEditingServiceLine(serviceLine)}>Edit</button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteServiceLine(serviceLine.service_line_id)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {serviceLines.length === 0 && (
          <div className="no-data">
            No service lines found. Add one to get started.
          </div>
        )}
      </main>
    </div>
  );
};

export default ServiceLines;