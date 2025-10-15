const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');

module.exports = (db) => {
  const router = express.Router();

  // All routes require Admin role
  router.use(requireAuth, requireAdmin);

  // Get all users with their roles
  router.get('/', async (req, res) => {
    try {
      const [users] = await db.execute(`
        SELECT u.id, u.google_id, u.email, u.full_name, u.profile_picture,
               u.is_approved, u.is_active, u.created_at, u.last_login_at
        FROM augusto_users u
        ORDER BY u.created_at DESC
      `);

      // Fetch roles for each user
      for (let user of users) {
        const [roles] = await db.execute(
          'SELECT role_name FROM augusto_user_roles WHERE user_id = ?',
          [user.id]
        );
        user.roles = roles.map(r => r.role_name);
      }

      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Get pending access requests
  router.get('/pending', async (req, res) => {
    try {
      const [requests] = await db.execute(`
        SELECT id, google_id, email, full_name, requested_roles, message,
               status, requested_at
        FROM augusto_access_requests
        WHERE status = 'pending'
        ORDER BY requested_at DESC
      `);

      // Parse requested_roles JSON
      requests.forEach(req => {
        try {
          req.requested_roles = req.requested_roles ? JSON.parse(req.requested_roles) : [];
        } catch (e) {
          req.requested_roles = [];
        }
      });

      res.json(requests);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      res.status(500).json({ error: 'Failed to fetch pending requests' });
    }
  });

  // Approve user and assign roles
  router.post('/:id/approve', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { roles } = req.body;

      if (!roles || !Array.isArray(roles) || roles.length === 0) {
        return res.status(400).json({ error: 'At least one role must be assigned' });
      }

      const validRoles = ['Admin', 'Operations Leader', 'Account Manager', 'Project Manager', 'Service Line Leader', 'Member'];
      const invalidRoles = roles.filter(r => !validRoles.includes(r));

      if (invalidRoles.length > 0) {
        return res.status(400).json({
          error: 'Invalid roles provided',
          invalidRoles,
          validRoles
        });
      }

      // Check if user exists
      const [users] = await db.execute(
        'SELECT id, email FROM augusto_users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Approve user
      await db.execute(
        'UPDATE augusto_users SET is_approved = TRUE, is_active = TRUE WHERE id = ?',
        [userId]
      );

      // Assign roles
      for (const role of roles) {
        await db.execute(
          'INSERT INTO augusto_user_roles (user_id, role_name, granted_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE granted_by = ?',
          [userId, role, req.user.id, req.user.id]
        );
      }

      res.json({
        message: 'User approved successfully',
        userId,
        roles
      });
    } catch (error) {
      console.error('Error approving user:', error);
      res.status(500).json({ error: 'Failed to approve user' });
    }
  });

  // Approve access request
  router.post('/requests/:id/approve', async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { roles } = req.body;

      if (!roles || !Array.isArray(roles) || roles.length === 0) {
        return res.status(400).json({ error: 'At least one role must be assigned' });
      }

      // Get the access request
      const [requests] = await db.execute(
        'SELECT * FROM augusto_access_requests WHERE id = ? AND status = ?',
        [requestId, 'pending']
      );

      if (requests.length === 0) {
        return res.status(404).json({ error: 'Access request not found or already processed' });
      }

      const request = requests[0];

      // Check if user already exists
      const [existingUsers] = await db.execute(
        'SELECT id FROM augusto_users WHERE google_id = ?',
        [request.google_id]
      );

      let userId;

      if (existingUsers.length > 0) {
        // User exists, just approve them
        userId = existingUsers[0].id;
        await db.execute(
          'UPDATE augusto_users SET is_approved = TRUE, is_active = TRUE WHERE id = ?',
          [userId]
        );
      } else {
        // Create new user
        const [result] = await db.execute(
          `INSERT INTO augusto_users (google_id, email, full_name, is_approved, is_active)
           VALUES (?, ?, ?, TRUE, TRUE)`,
          [request.google_id, request.email, request.full_name]
        );
        userId = result.insertId;
      }

      // Assign roles
      for (const role of roles) {
        await db.execute(
          'INSERT INTO augusto_user_roles (user_id, role_name, granted_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE granted_by = ?',
          [userId, role, req.user.id, req.user.id]
        );
      }

      // Update request status
      await db.execute(
        'UPDATE augusto_access_requests SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['approved', req.user.id, requestId]
      );

      res.json({
        message: 'Access request approved successfully',
        userId,
        roles
      });
    } catch (error) {
      console.error('Error approving access request:', error);
      res.status(500).json({ error: 'Failed to approve access request' });
    }
  });

  // Reject access request
  router.post('/requests/:id/reject', async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);

      const [result] = await db.execute(
        'UPDATE augusto_access_requests SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?',
        ['rejected', req.user.id, requestId, 'pending']
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Access request not found or already processed' });
      }

      res.json({ message: 'Access request rejected' });
    } catch (error) {
      console.error('Error rejecting access request:', error);
      res.status(500).json({ error: 'Failed to reject access request' });
    }
  });

  // Update user roles
  router.put('/:id/roles', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { roles } = req.body;

      if (!roles || !Array.isArray(roles)) {
        return res.status(400).json({ error: 'Roles array is required' });
      }

      const validRoles = ['Admin', 'Operations Leader', 'Account Manager', 'Project Manager', 'Service Line Leader', 'Member'];
      const invalidRoles = roles.filter(r => !validRoles.includes(r));

      if (invalidRoles.length > 0) {
        return res.status(400).json({
          error: 'Invalid roles provided',
          invalidRoles,
          validRoles
        });
      }

      // Check if user exists
      const [users] = await db.execute(
        'SELECT id FROM augusto_users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Delete existing roles
      await db.execute(
        'DELETE FROM augusto_user_roles WHERE user_id = ?',
        [userId]
      );

      // Assign new roles
      for (const role of roles) {
        await db.execute(
          'INSERT INTO augusto_user_roles (user_id, role_name, granted_by) VALUES (?, ?, ?)',
          [userId, role, req.user.id]
        );
      }

      res.json({
        message: 'User roles updated successfully',
        roles
      });
    } catch (error) {
      console.error('Error updating user roles:', error);
      res.status(500).json({ error: 'Failed to update user roles' });
    }
  });

  // Deactivate user
  router.put('/:id/deactivate', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      // Prevent self-deactivation
      if (userId === req.user.id) {
        return res.status(400).json({ error: 'Cannot deactivate your own account' });
      }

      const [result] = await db.execute(
        'UPDATE augusto_users SET is_active = FALSE WHERE id = ?',
        [userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User deactivated successfully' });
    } catch (error) {
      console.error('Error deactivating user:', error);
      res.status(500).json({ error: 'Failed to deactivate user' });
    }
  });

  // Reactivate user
  router.put('/:id/activate', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      const [result] = await db.execute(
        'UPDATE augusto_users SET is_active = TRUE WHERE id = ?',
        [userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User activated successfully' });
    } catch (error) {
      console.error('Error activating user:', error);
      res.status(500).json({ error: 'Failed to activate user' });
    }
  });

  return router;
};
