const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

module.exports = (db) => {
  // Configure Google OAuth Strategy
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails[0].value;
        const fullName = profile.displayName;
        const profilePicture = profile.photos[0]?.value || null;

        // Validate email domain
        const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || 'augustodigital.com';
        if (!email.endsWith(`@${allowedDomain}`)) {
          return done(null, false, {
            message: `Only ${allowedDomain} email addresses are allowed`
          });
        }

        // Check if user exists
        const [existingUsers] = await db.execute(
          'SELECT * FROM augusto_users WHERE google_id = ?',
          [googleId]
        );

        let user;

        if (existingUsers.length > 0) {
          user = existingUsers[0];

          // Update last login
          await db.execute(
            'UPDATE augusto_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
          );
        } else {
          // Check if this is the first user (bootstrap admin)
          const [adminCount] = await db.execute(
            'SELECT COUNT(*) as count FROM augusto_user_roles WHERE role_name = ?',
            ['Admin']
          );

          const isFirstUser = adminCount[0].count === 0;

          // Create new user
          const [result] = await db.execute(
            `INSERT INTO augusto_users (google_id, email, full_name, profile_picture, is_approved, is_active, last_login_at)
             VALUES (?, ?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP)`,
            [googleId, email, fullName, profilePicture, isFirstUser]
          );

          const userId = result.insertId;

          // If first user, automatically grant Admin role
          if (isFirstUser) {
            await db.execute(
              'INSERT INTO augusto_user_roles (user_id, role_name, granted_by) VALUES (?, ?, NULL)',
              [userId, 'Admin']
            );
            console.log(`First user created and granted Admin role: ${email}`);
          }

          // Fetch the newly created user
          const [newUsers] = await db.execute(
            'SELECT * FROM augusto_users WHERE id = ?',
            [userId]
          );
          user = newUsers[0];
        }

        // Check if user is approved
        if (!user.is_approved) {
          return done(null, false, {
            message: 'Your account is pending approval. Please contact an administrator.'
          });
        }

        // Check if user is active
        if (!user.is_active) {
          return done(null, false, {
            message: 'Your account has been deactivated. Please contact an administrator.'
          });
        }

        // Fetch user roles
        const [roles] = await db.execute(
          'SELECT role_name FROM augusto_user_roles WHERE user_id = ?',
          [user.id]
        );

        user.roles = roles.map(r => r.role_name);

        return done(null, user);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    }
  ));

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const [users] = await db.execute(
        'SELECT * FROM augusto_users WHERE id = ?',
        [id]
      );

      if (users.length === 0) {
        return done(null, false);
      }

      const user = users[0];

      // Fetch user roles
      const [roles] = await db.execute(
        'SELECT role_name FROM augusto_user_roles WHERE user_id = ?',
        [user.id]
      );

      user.roles = roles.map(r => r.role_name);

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  return passport;
};
