import React, { useState, useEffect } from 'react';
import './App.css';

interface TeamMember {
  id: number;
  full_name: string;
  default_cost_rate: number;
  is_active: number;
  role: string;
  service_line_id: string;
  service_line_name: string;
  [key: string]: any;
}

interface ServiceLine {
  service_line_id: string;
  name: string;
}

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function App() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
    fetchServiceLines();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/team-members`);
      const data = await response.json();
      setTeamMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceLines = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/service-lines`);
      const data = await response.json();
      setServiceLines(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching service lines:', error);
      setServiceLines([]);
    }
  };

  const handleUpdateCostRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    try {
      const response = await fetch(`${API_BASE}/api/team-members/${encodeURIComponent(editingMember.full_name)}/cost-rate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_cost_rate: editingMember.default_cost_rate
        })
      });
      
      if (response.ok) {
        setEditingMember(null);
        fetchTeamMembers();
      }
    } catch (error) {
      console.error('Error updating cost rate:', error);
    }
  };

  const handleUpdateServiceLine = async (newServiceLineId: string) => {
    if (!editingMember) return;

    try {
      const response = await fetch(`${API_BASE}/api/team-members/${encodeURIComponent(editingMember.full_name)}/service-line`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_line_id: newServiceLineId
        })
      });
      
      if (response.ok) {
        setEditingMember({...editingMember, service_line_id: newServiceLineId});
        fetchTeamMembers(); // Refresh to get updated service line name
      }
    } catch (error) {
      console.error('Error updating service line:', error);
    }
  };

  const handleUpdateActiveStatus = async (newActiveStatus: number) => {
    if (!editingMember) return;

    try {
      const response = await fetch(`${API_BASE}/api/team-members/${encodeURIComponent(editingMember.full_name)}/active-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: newActiveStatus
        })
      });
      
      if (response.ok) {
        setEditingMember({...editingMember, is_active: newActiveStatus});
        fetchTeamMembers(); // Refresh to get updated data
      }
    } catch (error) {
      console.error('Error updating active status:', error);
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActiveFilter = showActiveOnly ? member.is_active === 1 : true;
    return matchesSearch && matchesActiveFilter;
  });

  if (loading) return <div className="loading">Loading team members...</div>;

  return (
    <div className="App">
      <header className="App-header">
        <h1>AugustoOps - Team Cost Rate Manager</h1>
        <p>Manage developer cost rates for your team</p>
      </header>

      <main className="main-content">
        <div className="controls">
          <div className="search-filter">
            <label>Search team members: </label>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="activity-filter">
            <label>
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
              />
              Show active members only
            </label>
          </div>
          
          <div className="stats">
            <span>{filteredMembers.length} team members</span>
            {showActiveOnly && (
              <span className="active-count">
                ({teamMembers.filter(m => m.is_active === 1).length} active of {teamMembers.length} total)
              </span>
            )}
          </div>
        </div>

        <div className="members-grid">
          {filteredMembers.map(member => (
            <div key={member.id} className="member-card">
              {editingMember?.id === member.id ? (
                <form onSubmit={handleUpdateCostRate}>
                  <h4>{member.full_name}</h4>
                  <div className="edit-fields">
                    <div className="cost-rate-edit">
                      <label>Cost Rate ($/hour):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingMember.default_cost_rate}
                        onChange={(e) => setEditingMember({...editingMember, default_cost_rate: parseFloat(e.target.value) || 0})}
                        required
                      />
                    </div>
                    <div className="service-line-edit">
                      <label>Service Line:</label>
                      <select
                        value={editingMember.service_line_id || ''}
                        onChange={(e) => handleUpdateServiceLine(e.target.value)}
                      >
                        <option value="">Select Service Line</option>
                        {serviceLines.map(sl => (
                          <option key={sl.service_line_id} value={sl.service_line_id}>
                            {sl.service_line_id} - {sl.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="active-status-edit">
                      <label>
                        <input
                          type="checkbox"
                          checked={editingMember.is_active === 1}
                          onChange={(e) => handleUpdateActiveStatus(e.target.checked ? 1 : 0)}
                        />
                        Active Member
                      </label>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button type="submit">Save Changes</button>
                    <button type="button" onClick={() => setEditingMember(null)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <h4>{member.full_name}</h4>
                  <div className="member-info">
                    <div className="member-details">
                      <div className="role">{member.role}</div>
                      <div className="service-line">
                        {member.service_line_id && member.service_line_name 
                          ? `${member.service_line_id} - ${member.service_line_name}` 
                          : 'No Service Line'
                        }
                      </div>
                    </div>
                    <div className="status">
                      <span className={`status-badge ${member.is_active ? 'active' : 'inactive'}`}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="cost-rate">
                    <span className="rate-label">Cost Rate:</span>
                    <span className="rate-value">${member.default_cost_rate}/hour</span>
                  </div>
                  <div className="card-actions">
                    <button onClick={() => setEditingMember(member)}>Edit Member</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="no-members">
            {searchTerm ? 
              `No team members found matching "${searchTerm}"` : 
              'No team members found in the database.'
            }
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
