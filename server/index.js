const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');
const { createTunnel } = require('tunnel-ssh');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

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
    const [rows] = await db.execute('SELECT * FROM augusto_service_lines ORDER BY name');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch service lines' });
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

app.listen(PORT, async () => {
  await initializeDatabase();
  console.log(`Server running on port ${PORT}`);
});