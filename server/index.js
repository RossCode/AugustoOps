const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');
const { createTunnel } = require('tunnel-ssh');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

let db;
let sshTunnel;

const createSSHTunnel = () => {
  return new Promise((resolve, reject) => {
    const tunnelConfig = {
      host: process.env.SSH_HOST,
      port: 22,
      username: process.env.SSH_USER,
      privateKey: fs.readFileSync(process.env.SSH_PRIVATE_KEY_PATH),
      passphrase: process.env.SSH_PRIVATE_KEY_PASSPHRASE,
      dstHost: 'localhost',
      dstPort: 3306,
      localHost: 'localhost',
      localPort: parseInt(process.env.DB_PORT || '3307')
    };

    createTunnel(tunnelConfig)
      .then((server) => {
        console.log('SSH tunnel established on port', process.env.DB_PORT || 3307);
        sshTunnel = server;
        resolve(server);
      })
      .catch((error) => {
        console.error('SSH tunnel failed:', error);
        reject(error);
      });
  });
};

const initializeDatabase = async () => {
  try {
    // SSH tunnel should already be running manually
    console.log('Using existing SSH tunnel on port', process.env.DB_PORT || 3307);

    console.log('Connecting to database...');
    db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'augusto_ops',
      port: process.env.DB_PORT || 3306
    });
    
    console.log('Database connected to existing tables');
    
    // Test query to verify data exists
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM augusto_team_members');
    console.log('Team members count:', rows[0].count);
    
    const [sampleRows] = await db.execute('SELECT full_name, default_cost_rate FROM augusto_team_members LIMIT 3');
    console.log('Sample team members:', sampleRows);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Test endpoint
app.get('/api/test', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT 1 as test');
    res.json({ status: 'Database connection successful', result: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

app.get('/api/service-lines', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM augusto_service_lines ORDER BY service_line_id');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch service lines' });
  }
});

app.post('/api/service-lines', async (req, res) => {
  const { service_line_id, name } = req.body;
  
  if (!service_line_id || !name) {
    return res.status(400).json({ error: 'Service line ID and name are required' });
  }
  
  try {
    const [result] = await db.execute(
      'INSERT INTO augusto_service_lines (service_line_id, name) VALUES (?, ?)',
      [service_line_id, name]
    );
    
    res.status(201).json({ 
      message: 'Service line created successfully',
      service_line_id: service_line_id
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Service line ID already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create service line' });
    }
  }
});

app.put('/api/service-lines/:id', async (req, res) => {
  const { name } = req.body;
  const serviceLineId = req.params.id;
  
  if (!name) {
    return res.status(400).json({ error: 'Service line name is required' });
  }
  
  try {
    const [result] = await db.execute(
      'UPDATE augusto_service_lines SET name = ? WHERE service_line_id = ?',
      [name, serviceLineId]
    );
    
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Service line not found' });
    } else {
      res.json({ message: 'Service line updated successfully' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update service line' });
  }
});

app.delete('/api/service-lines/:id', async (req, res) => {
  const serviceLineId = req.params.id;
  
  try {
    // Check if service line is being used by any team members
    const [teamMembers] = await db.execute(
      'SELECT COUNT(*) as count FROM augusto_team_members WHERE service_line_id = ?',
      [serviceLineId]
    );
    
    if (teamMembers[0].count > 0) {
      return res.status(409).json({ 
        error: `Cannot delete service line. It is currently assigned to ${teamMembers[0].count} team member(s).` 
      });
    }
    
    const [result] = await db.execute(
      'DELETE FROM augusto_service_lines WHERE service_line_id = ?',
      [serviceLineId]
    );
    
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Service line not found' });
    } else {
      res.json({ message: 'Service line deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete service line' });
  }
});

// Roles endpoints
app.get('/api/roles', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        adr.id,
        adr.role_name,
        adr.default_rate,
        adr.service_line_id,
        asl.name as service_line_name
      FROM augusto_default_roles adr
      LEFT JOIN augusto_service_lines asl ON adr.service_line_id = asl.service_line_id
      ORDER BY adr.role_name
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

app.post('/api/roles', async (req, res) => {
  const { role_name, default_rate, service_line_id } = req.body;
  
  if (!role_name || !default_rate || !service_line_id) {
    return res.status(400).json({ error: 'Role name, default rate, and service line ID are required' });
  }
  
  try {
    // Validate that service_line_id exists
    const [serviceLineCheck] = await db.execute(
      'SELECT COUNT(*) as count FROM augusto_service_lines WHERE service_line_id = ?',
      [service_line_id]
    );
    
    if (serviceLineCheck[0].count === 0) {
      return res.status(400).json({ error: 'Invalid service line ID' });
    }
    
    const [result] = await db.execute(
      'INSERT INTO augusto_default_roles (role_name, default_rate, service_line_id) VALUES (?, ?, ?)',
      [role_name, default_rate, service_line_id]
    );
    
    res.status(201).json({ 
      message: 'Role created successfully',
      role_id: result.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Role name already exists' });
    } else {
      console.error('Error creating role:', error);
      res.status(500).json({ error: 'Failed to create role' });
    }
  }
});

app.put('/api/roles/:id', async (req, res) => {
  const { role_name, default_rate, service_line_id } = req.body;
  const roleId = req.params.id;
  
  if (!role_name || !default_rate || !service_line_id) {
    return res.status(400).json({ error: 'Role name, default rate, and service line ID are required' });
  }
  
  try {
    // Validate that service_line_id exists
    const [serviceLineCheck] = await db.execute(
      'SELECT COUNT(*) as count FROM augusto_service_lines WHERE service_line_id = ?',
      [service_line_id]
    );
    
    if (serviceLineCheck[0].count === 0) {
      return res.status(400).json({ error: 'Invalid service line ID' });
    }
    
    const [result] = await db.execute(
      'UPDATE augusto_default_roles SET role_name = ?, default_rate = ?, service_line_id = ? WHERE id = ?',
      [role_name, default_rate, service_line_id, roleId]
    );
    
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Role not found' });
    } else {
      res.json({ message: 'Role updated successfully' });
    }
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Role name already exists' });
    } else {
      console.error('Error updating role:', error);
      res.status(500).json({ error: 'Failed to update role' });
    }
  }
});

app.delete('/api/roles/:id', async (req, res) => {
  const roleId = req.params.id;
  
  try {
    // Check if role is being used by any team members
    const [teamMembers] = await db.execute(
      'SELECT COUNT(*) as count FROM augusto_team_members WHERE role = (SELECT role_name FROM augusto_default_roles WHERE id = ?)',
      [roleId]
    );
    
    if (teamMembers[0].count > 0) {
      return res.status(409).json({ 
        error: `Cannot delete role. It is currently assigned to ${teamMembers[0].count} team member(s).` 
      });
    }
    
    const [result] = await db.execute(
      'DELETE FROM augusto_default_roles WHERE id = ?',
      [roleId]
    );
    
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Role not found' });
    } else {
      res.json({ message: 'Role deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

app.get('/api/team-members', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT tm.*, sl.name as service_line_name 
      FROM augusto_team_members tm
      LEFT JOIN augusto_service_lines sl ON tm.service_line_id = sl.service_line_id
      ORDER BY tm.full_name
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

app.get('/api/team-members/:name', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM augusto_team_members WHERE full_name = ?',
      [req.params.name]
    );
    res.json(rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team member' });
  }
});

app.put('/api/team-members/:name/cost-rate', async (req, res) => {
  const { default_cost_rate } = req.body;
  
  try {
    const [result] = await db.execute(
      'UPDATE augusto_team_members SET default_cost_rate = ? WHERE full_name = ?',
      [default_cost_rate, req.params.name]
    );
    
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Team member not found' });
    } else {
      res.json({ message: 'Cost rate updated successfully' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cost rate' });
  }
});

app.put('/api/team-members/:name/service-line', async (req, res) => {
  const { service_line_id } = req.body;
  
  try {
    const [result] = await db.execute(
      'UPDATE augusto_team_members SET service_line_id = ? WHERE full_name = ?',
      [service_line_id, req.params.name]
    );
    
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Team member not found' });
    } else {
      res.json({ message: 'Service line updated successfully' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update service line' });
  }
});

app.put('/api/team-members/:name/active-status', async (req, res) => {
  const { is_active } = req.body;
  
  try {
    const [result] = await db.execute(
      'UPDATE augusto_team_members SET is_active = ? WHERE full_name = ?',
      [is_active, req.params.name]
    );
    
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Team member not found' });
    } else {
      res.json({ message: 'Active status updated successfully' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update active status' });
  }
});

app.put('/api/team-members/:name/weekly-capacity', async (req, res) => {
  const { weekly_capacity } = req.body;
  
  try {
    const [result] = await db.execute(
      'UPDATE augusto_team_members SET weekly_capacity = ? WHERE full_name = ?',
      [weekly_capacity, req.params.name]
    );
    
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Team member not found' });
    } else {
      res.json({ message: 'Weekly capacity updated successfully' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update weekly capacity' });
  }
});

app.put('/api/team-members/:name/internal-rate', async (req, res) => {
  const { internal_rate } = req.body;
  
  try {
    const [result] = await db.execute(
      'UPDATE augusto_team_members SET internal_rate = ? WHERE full_name = ?',
      [internal_rate, req.params.name]
    );
    
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Team member not found' });
    } else {
      res.json({ message: 'Internal rate updated successfully' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update internal rate' });
  }
});

app.post('/api/webhooks/n8n', async (req, res) => {
  console.log('n8n webhook received:', req.body);
  res.json({ message: 'Webhook received successfully' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  if (sshTunnel) {
    sshTunnel.close();
    console.log('SSH tunnel closed');
  }
  if (db) {
    db.end();
    console.log('Database connection closed');
  }
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  initializeDatabase().catch(error => {
    console.error('Database initialization failed:', error);
    console.log('Server is running but database connection failed');
  });
});