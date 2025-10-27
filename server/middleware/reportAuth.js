/**
 * Report-specific authorization middleware
 * Checks if user has permission to access report functionality
 */

/**
 * Check if user is the Report PM for a specific project
 * Report PM is stored in augusto_project_data with name='Report PM'
 */
const isReportPM = async (db, userId, userEmail, projectCode) => {
  try {
    // Check if user's email matches the Report PM value for this project
    const [results] = await db.execute(
      `SELECT value FROM augusto_project_data
       WHERE project_code = ? AND name = 'Report PM'`,
      [projectCode]
    );

    if (results.length === 0) {
      return false; // No Report PM assigned
    }

    const reportPMEmail = results[0].value;
    return reportPMEmail === userEmail;
  } catch (error) {
    console.error('Error checking Report PM:', error);
    return false;
  }
};

/**
 * Check if user can configure reports for a project
 * Allowed roles: Admin, Operations Leader, Account Manager, or Report PM
 */
const canConfigureReports = (db) => {
  return async (req, res, next) => {
    const { code } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Admins and Operations Leaders can configure any project
    if (user.roles.includes('Admin') || user.roles.includes('Operations Leader')) {
      return next();
    }

    // Account Managers and Project Managers can configure
    if (user.roles.includes('Account Manager') || user.roles.includes('Project Manager')) {
      return next();
    }

    // Check if user is the Report PM for this project
    const isPM = await isReportPM(db, user.id, user.email, code);
    if (isPM) {
      return next();
    }

    return res.status(403).json({
      error: 'You do not have permission to configure reports for this project'
    });
  };
};

/**
 * Check if user can view/review a specific report
 * Allowed: Admin, Operations Leader, Account Manager, or Report PM for the project
 */
const canViewReport = (db) => {
  return async (req, res, next) => {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Admins and Operations Leaders can view any report
    if (user.roles.includes('Admin') || user.roles.includes('Operations Leader')) {
      return next();
    }

    try {
      // Get the project code for this report
      const [reports] = await db.execute(
        'SELECT project_code FROM augusto_reports WHERE id = ?',
        [id]
      );

      if (reports.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }

      const projectCode = reports[0].project_code;

      // Account Managers and Project Managers can view
      if (user.roles.includes('Account Manager') || user.roles.includes('Project Manager')) {
        return next();
      }

      // Check if user is the Report PM for this project
      const isPM = await isReportPM(db, user.id, user.email, projectCode);
      if (isPM) {
        return next();
      }

      return res.status(403).json({
        error: 'You do not have permission to view this report'
      });
    } catch (error) {
      console.error('Error checking report permissions:', error);
      return res.status(500).json({ error: 'Failed to check permissions' });
    }
  };
};

/**
 * Check if user can approve/send a report
 * Only the Report PM or Admin/Operations Leader can approve/send
 */
const canApproveReport = (db) => {
  return async (req, res, next) => {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Admins and Operations Leaders can approve any report
    if (user.roles.includes('Admin') || user.roles.includes('Operations Leader')) {
      return next();
    }

    try {
      // Get the project code for this report
      const [reports] = await db.execute(
        'SELECT project_code FROM augusto_reports WHERE id = ?',
        [id]
      );

      if (reports.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }

      const projectCode = reports[0].project_code;

      // Only the Report PM can approve/send (besides admin/ops leader)
      const isPM = await isReportPM(db, user.id, user.email, projectCode);
      if (isPM) {
        return next();
      }

      return res.status(403).json({
        error: 'Only the assigned Report PM can approve or send this report'
      });
    } catch (error) {
      console.error('Error checking approve permissions:', error);
      return res.status(500).json({ error: 'Failed to check permissions' });
    }
  };
};

/**
 * Filter pending reports to only show reports where user is Report PM
 * This is used in the /reports/pending-review endpoint
 */
const filterPendingReportsByPM = async (db, userEmail) => {
  try {
    // Get all project codes where user is the Report PM
    const [projects] = await db.execute(
      `SELECT project_code FROM augusto_project_data
       WHERE name = 'Report PM' AND value = ?`,
      [userEmail]
    );

    return projects.map(p => p.project_code);
  } catch (error) {
    console.error('Error filtering reports by PM:', error);
    return [];
  }
};

module.exports = {
  canConfigureReports,
  canViewReport,
  canApproveReport,
  filterPendingReportsByPM,
  isReportPM
};
