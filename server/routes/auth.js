const express = require('express');
const passport = require('passport');
const { requireAuth, generateToken } = require('../middleware/auth');

module.exports = (db) => {
  const router = express.Router();

  // Initiate Google OAuth login
  router.get('/google',
    passport.authenticate('google', {
      scope: ['profile', 'email']
    })
  );

  // Google OAuth callback
  router.get('/google/callback',
    passport.authenticate('google', {
      failureRedirect: '/login?error=auth_failed',
      session: true
    }),
    (req, res) => {
      // Generate JWT token
      const token = generateToken(req.user);

      // Redirect to frontend with token
      res.redirect(`http://localhost:3000/auth/callback?token=${token}`);
    }
  );

  // Get current user info
  router.get('/me', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;

      const [users] = await db.execute(
        'SELECT id, google_id, email, full_name, profile_picture, is_approved, is_active, created_at, last_login_at FROM augusto_users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = users[0];

      // Fetch user roles
      const [roles] = await db.execute(
        'SELECT role_name FROM augusto_user_roles WHERE user_id = ?',
        [userId]
      );

      user.roles = roles.map(r => r.role_name);

      res.json(user);
    } catch (error) {
      console.error('Error fetching user info:', error);
      res.status(500).json({ error: 'Failed to fetch user information' });
    }
  });

  // Logout
  router.post('/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
      });
    });
  });

  // Request access (for unapproved users)
  router.post('/request-access', async (req, res) => {
    try {
      const { google_id, email, full_name, requested_roles, message } = req.body;

      if (!google_id || !email) {
        return res.status(400).json({ error: 'Google ID and email are required' });
      }

      // Validate email domain
      const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || 'augustodigital.com';
      if (!email.endsWith(`@${allowedDomain}`)) {
        return res.status(400).json({
          error: `Only ${allowedDomain} email addresses are allowed`
        });
      }

      // Check if user already exists
      const [existingUsers] = await db.execute(
        'SELECT id, is_approved FROM augusto_users WHERE google_id = ?',
        [google_id]
      );

      if (existingUsers.length > 0) {
        const user = existingUsers[0];
        if (user.is_approved) {
          return res.status(400).json({ error: 'User is already approved' });
        } else {
          return res.status(400).json({ error: 'Access request already pending' });
        }
      }

      // Check if there's already a pending request
      const [existingRequests] = await db.execute(
        'SELECT id FROM augusto_access_requests WHERE email = ? AND status = ?',
        [email, 'pending']
      );

      if (existingRequests.length > 0) {
        return res.status(400).json({ error: 'Access request already submitted' });
      }

      // Create access request
      const rolesJson = requested_roles ? JSON.stringify(requested_roles) : null;
      await db.execute(
        `INSERT INTO augusto_access_requests (google_id, email, full_name, requested_roles, message, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [google_id, email, full_name, rolesJson, message || null]
      );

      res.status(201).json({
        message: 'Access request submitted successfully. An administrator will review your request.'
      });
    } catch (error) {
      console.error('Error creating access request:', error);
      res.status(500).json({ error: 'Failed to submit access request' });
    }
  });

  return router;
};
