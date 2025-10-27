const express = require('express');
const { requireAuth } = require('../middleware/auth');

/**
 * Report Management Routes
 * Handles report configuration, generation, review, and sending
 */

module.exports = (db) => {
  const router = express.Router();

  // Apply auth middleware to all routes
  router.use(requireAuth);

  // ==================== REPORT CONFIGURATION ====================

  /**
   * GET /projects/:code/report-config
   * Get report configuration for a project
   */
  router.get('/projects/:code/report-config', async (req, res) => {
    const { code } = req.params;

    try {
      const [configs] = await db.execute(
        'SELECT * FROM augusto_report_configs WHERE project_code = ?',
        [code]
      );

      if (configs.length === 0) {
        return res.status(404).json({ error: 'Report configuration not found' });
      }

      res.json(configs[0]);
    } catch (error) {
      console.error('Error fetching report config:', error);
      res.status(500).json({ error: 'Failed to fetch report configuration' });
    }
  });

  /**
   * POST /projects/:code/report-config
   * Create or update report configuration for a project
   */
  router.post('/projects/:code/report-config', async (req, res) => {
    const { code } = req.params;
    const {
      frequency,
      send_day,
      send_time,
      reporting_period_weeks,
      is_active,
      include_jira
    } = req.body;

    // Validation
    const validFrequencies = ['weekly', 'bi-weekly', 'monthly'];
    if (frequency && !validFrequencies.includes(frequency)) {
      return res.status(400).json({ error: 'Invalid frequency value' });
    }

    try {
      // Check if config exists
      const [existing] = await db.execute(
        'SELECT id FROM augusto_report_configs WHERE project_code = ?',
        [code]
      );

      if (existing.length > 0) {
        // Update existing config
        await db.execute(
          `UPDATE augusto_report_configs
           SET frequency = COALESCE(?, frequency),
               send_day = COALESCE(?, send_day),
               send_time = COALESCE(?, send_time),
               reporting_period_weeks = COALESCE(?, reporting_period_weeks),
               is_active = COALESCE(?, is_active),
               include_jira = COALESCE(?, include_jira)
           WHERE project_code = ?`,
          [frequency, send_day, send_time, reporting_period_weeks, is_active, include_jira, code]
        );
      } else {
        // Create new config
        await db.execute(
          `INSERT INTO augusto_report_configs
           (project_code, frequency, send_day, send_time, reporting_period_weeks, is_active, include_jira)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            code,
            frequency || 'bi-weekly',
            send_day || 'Tuesday',
            send_time || '10:00:00',
            reporting_period_weeks || 2,
            is_active !== undefined ? is_active : true,
            include_jira || false
          ]
        );
      }

      // Fetch and return updated config
      const [updated] = await db.execute(
        'SELECT * FROM augusto_report_configs WHERE project_code = ?',
        [code]
      );

      res.json(updated[0]);
    } catch (error) {
      console.error('Error saving report config:', error);
      res.status(500).json({ error: 'Failed to save report configuration' });
    }
  });

  /**
   * DELETE /projects/:code/report-config
   * Delete report configuration for a project
   */
  router.delete('/projects/:code/report-config', async (req, res) => {
    const { code } = req.params;

    try {
      const [result] = await db.execute(
        'DELETE FROM augusto_report_configs WHERE project_code = ?',
        [code]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Report configuration not found' });
      }

      res.json({ message: 'Report configuration deleted successfully' });
    } catch (error) {
      console.error('Error deleting report config:', error);
      res.status(500).json({ error: 'Failed to delete report configuration' });
    }
  });

  // ==================== RECIPIENT MANAGEMENT ====================

  /**
   * GET /projects/:code/report-recipients
   * Get all recipients (internal + external) for a project
   */
  router.get('/projects/:code/report-recipients', async (req, res) => {
    const { code } = req.params;

    try {
      // Get internal recipients
      const [internal] = await db.execute(
        `SELECT rir.id, rir.project_code, rir.team_member_id,
                tm.full_name as name, tm.id as augusto_team_member_id
         FROM augusto_report_internal_recipients rir
         JOIN augusto_team_members tm ON rir.team_member_id = tm.id
         WHERE rir.project_code = ?`,
        [code]
      );

      // Get external recipients
      const [external] = await db.execute(
        `SELECT id, project_code, name, email
         FROM augusto_report_external_recipients
         WHERE project_code = ?`,
        [code]
      );

      res.json({
        internal: internal,
        external: external
      });
    } catch (error) {
      console.error('Error fetching report recipients:', error);
      res.status(500).json({ error: 'Failed to fetch report recipients' });
    }
  });

  /**
   * POST /projects/:code/report-recipients/external
   * Add external recipient to a project
   */
  router.post('/projects/:code/report-recipients/external', async (req, res) => {
    const { code } = req.params;
    const { name, email } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
      const [result] = await db.execute(
        `INSERT INTO augusto_report_external_recipients (project_code, name, email)
         VALUES (?, ?, ?)`,
        [code, name, email]
      );

      res.status(201).json({
        id: result.insertId,
        project_code: code,
        name,
        email
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Recipient already exists for this project' });
      }
      console.error('Error adding external recipient:', error);
      res.status(500).json({ error: 'Failed to add external recipient' });
    }
  });

  /**
   * DELETE /projects/:code/report-recipients/external/:id
   * Remove external recipient from a project
   */
  router.delete('/projects/:code/report-recipients/external/:id', async (req, res) => {
    const { code, id } = req.params;

    try {
      const [result] = await db.execute(
        'DELETE FROM augusto_report_external_recipients WHERE id = ? AND project_code = ?',
        [id, code]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Recipient not found' });
      }

      res.json({ message: 'External recipient removed successfully' });
    } catch (error) {
      console.error('Error removing external recipient:', error);
      res.status(500).json({ error: 'Failed to remove external recipient' });
    }
  });

  /**
   * POST /projects/:code/report-recipients/internal
   * Add internal team member as recipient
   */
  router.post('/projects/:code/report-recipients/internal', async (req, res) => {
    const { code } = req.params;
    const { team_member_id } = req.body;

    // Validation
    if (!team_member_id) {
      return res.status(400).json({ error: 'Team member ID is required' });
    }

    try {
      // Verify team member exists
      const [members] = await db.execute(
        'SELECT id, full_name FROM augusto_team_members WHERE id = ?',
        [team_member_id]
      );

      if (members.length === 0) {
        return res.status(404).json({ error: 'Team member not found' });
      }

      const [result] = await db.execute(
        `INSERT INTO augusto_report_internal_recipients (project_code, team_member_id)
         VALUES (?, ?)`,
        [code, team_member_id]
      );

      res.status(201).json({
        id: result.insertId,
        project_code: code,
        team_member_id,
        name: members[0].full_name
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Team member already added as recipient' });
      }
      console.error('Error adding internal recipient:', error);
      res.status(500).json({ error: 'Failed to add internal recipient' });
    }
  });

  /**
   * DELETE /projects/:code/report-recipients/internal/:id
   * Remove internal team member as recipient
   */
  router.delete('/projects/:code/report-recipients/internal/:id', async (req, res) => {
    const { code, id } = req.params;

    try {
      const [result] = await db.execute(
        'DELETE FROM augusto_report_internal_recipients WHERE id = ? AND project_code = ?',
        [id, code]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Recipient not found' });
      }

      res.json({ message: 'Internal recipient removed successfully' });
    } catch (error) {
      console.error('Error removing internal recipient:', error);
      res.status(500).json({ error: 'Failed to remove internal recipient' });
    }
  });

  // ==================== REPORT GENERATION & MANAGEMENT ====================

  /**
   * GET /projects/:code/reports
   * List all reports for a project
   */
  router.get('/projects/:code/reports', async (req, res) => {
    const { code } = req.params;

    try {
      const [reports] = await db.execute(
        `SELECT r.*,
                u1.full_name as generated_by_name,
                u2.full_name as reviewed_by_name
         FROM augusto_reports r
         LEFT JOIN augusto_users u1 ON r.generated_by = u1.id
         LEFT JOIN augusto_users u2 ON r.reviewed_by = u2.id
         WHERE r.project_code = ?
         ORDER BY r.generated_at DESC`,
        [code]
      );

      res.json(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  });

  /**
   * POST /projects/:code/reports/generate
   * Generate a new report for a project
   */
  router.post('/projects/:code/reports/generate', async (req, res) => {
    const { code } = req.params;
    const { period_start, period_end, status } = req.body;

    try {
      // Get report configuration
      const [configs] = await db.execute(
        'SELECT * FROM augusto_report_configs WHERE project_code = ? AND is_active = TRUE',
        [code]
      );

      if (configs.length === 0) {
        return res.status(400).json({ error: 'No active report configuration found for this project' });
      }

      const config = configs[0];

      // Calculate date range if not provided
      let startDate = period_start;
      let endDate = period_end;

      if (!startDate || !endDate) {
        const weeksAgo = config.reporting_period_weeks || 2;
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (weeksAgo * 7));

        startDate = start.toISOString().split('T')[0];
        endDate = end.toISOString().split('T')[0];
      }

      // Import report generator service
      const reportGenerator = require('../services/reportGenerator');
      const reportData = await reportGenerator.generateReportData(db, code, startDate, endDate);

      // Create report record
      const [result] = await db.execute(
        `INSERT INTO augusto_reports
         (project_code, report_period_start, report_period_end, status, generated_by, report_data_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          code,
          startDate,
          endDate,
          status || 'pending_review',
          req.user?.id || null,
          JSON.stringify(reportData)
        ]
      );

      // Fetch created report
      const [reports] = await db.execute(
        `SELECT r.*,
                u.full_name as generated_by_name
         FROM augusto_reports r
         LEFT JOIN augusto_users u ON r.generated_by = u.id
         WHERE r.id = ?`,
        [result.insertId]
      );

      res.status(201).json(reports[0]);
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ error: 'Failed to generate report', details: error.message });
    }
  });

  /**
   * GET /reports/:id
   * Get specific report details
   */
  router.get('/reports/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const [reports] = await db.execute(
        `SELECT r.*,
                u1.full_name as generated_by_name,
                u2.full_name as reviewed_by_name,
                hp.name as project_name,
                hc.name as client_name
         FROM augusto_reports r
         LEFT JOIN augusto_users u1 ON r.generated_by = u1.id
         LEFT JOIN augusto_users u2 ON r.reviewed_by = u2.id
         LEFT JOIN harvest_projects hp ON r.project_code = hp.code
         LEFT JOIN harvest_clients hc ON hp.client_id = hc.id
         WHERE r.id = ?`,
        [id]
      );

      if (reports.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }

      const report = reports[0];

      // Parse JSON data
      if (report.report_data_json) {
        report.report_data = JSON.parse(report.report_data_json);
      }

      res.json(report);
    } catch (error) {
      console.error('Error fetching report:', error);
      res.status(500).json({ error: 'Failed to fetch report' });
    }
  });

  /**
   * GET /reports/:id/preview
   * Get HTML preview of report
   */
  router.get('/reports/:id/preview', async (req, res) => {
    const { id } = req.params;

    try {
      // Fetch report data
      const [reports] = await db.execute(
        `SELECT r.*,
                hp.name as project_name,
                hc.name as client_name
         FROM augusto_reports r
         LEFT JOIN harvest_projects hp ON r.project_code = hp.code
         LEFT JOIN harvest_clients hc ON hp.client_id = hc.id
         WHERE r.id = ?`,
        [id]
      );

      if (reports.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }

      const report = reports[0];
      report.report_data = JSON.parse(report.report_data_json);

      // Generate HTML preview
      const pdfGenerator = require('../services/pdfGenerator');
      const html = await pdfGenerator.generateReportHTML(report);

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Error generating preview:', error);
      res.status(500).json({ error: 'Failed to generate preview' });
    }
  });

  /**
   * GET /reports/:id/pdf
   * Download report as PDF
   */
  router.get('/reports/:id/pdf', async (req, res) => {
    const { id } = req.params;

    try {
      // Fetch report data
      const [reports] = await db.execute(
        `SELECT r.*,
                hp.name as project_name,
                hc.name as client_name
         FROM augusto_reports r
         LEFT JOIN harvest_projects hp ON r.project_code = hp.code
         LEFT JOIN harvest_clients hc ON hp.client_id = hc.id
         WHERE r.id = ?`,
        [id]
      );

      if (reports.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }

      const report = reports[0];
      report.report_data = JSON.parse(report.report_data_json);

      // Generate PDF
      const pdfGenerator = require('../services/pdfGenerator');
      const pdfBuffer = await pdfGenerator.generatePDF(report);

      const filename = `Status_Report_${report.project_code}_${report.report_period_start}_to_${report.report_period_end}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  });

  /**
   * PUT /reports/:id/narrative
   * Update PM narrative for a report
   */
  router.put('/reports/:id/narrative', async (req, res) => {
    const { id } = req.params;
    const { pm_narrative } = req.body;

    try {
      const [result] = await db.execute(
        'UPDATE augusto_reports SET pm_narrative = ? WHERE id = ?',
        [pm_narrative, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }

      res.json({ message: 'Narrative updated successfully' });
    } catch (error) {
      console.error('Error updating narrative:', error);
      res.status(500).json({ error: 'Failed to update narrative' });
    }
  });

  /**
   * PUT /reports/:id/approve
   * Approve a report (changes status to 'approved')
   */
  router.put('/reports/:id/approve', async (req, res) => {
    const { id } = req.params;

    try {
      const [result] = await db.execute(
        `UPDATE augusto_reports
         SET status = 'approved',
             reviewed_by = ?,
             reviewed_at = NOW()
         WHERE id = ?`,
        [req.user?.id || null, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }

      // Fetch updated report
      const [reports] = await db.execute(
        'SELECT * FROM augusto_reports WHERE id = ?',
        [id]
      );

      res.json(reports[0]);
    } catch (error) {
      console.error('Error approving report:', error);
      res.status(500).json({ error: 'Failed to approve report' });
    }
  });

  /**
   * POST /reports/:id/send
   * Trigger report sending via n8n webhook
   */
  router.post('/reports/:id/send', async (req, res) => {
    const { id } = req.params;

    try {
      // Fetch report with all details
      const [reports] = await db.execute(
        `SELECT r.*,
                hp.name as project_name,
                hc.name as client_name
         FROM augusto_reports r
         LEFT JOIN harvest_projects hp ON r.project_code = hp.code
         LEFT JOIN harvest_clients hc ON hp.client_id = hc.id
         WHERE r.id = ?`,
        [id]
      );

      if (reports.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }

      const report = reports[0];

      if (report.status !== 'approved') {
        return res.status(400).json({ error: 'Report must be approved before sending' });
      }

      // Get recipients
      const [externalRecipients] = await db.execute(
        'SELECT name, email FROM augusto_report_external_recipients WHERE project_code = ?',
        [report.project_code]
      );

      // TODO: Get emails for internal recipients when email field is added to augusto_team_members
      const recipients = externalRecipients.map(r => r.email);

      if (recipients.length === 0) {
        return res.status(400).json({ error: 'No recipients configured for this project' });
      }

      // Prepare payload for n8n
      const payload = {
        report_id: report.id,
        project_code: report.project_code,
        project_name: report.project_name,
        client_name: report.client_name,
        period_start: report.report_period_start,
        period_end: report.report_period_end,
        recipients: recipients,
        pdf_url: `${req.protocol}://${req.get('host')}/api/reports/${id}/pdf`,
        summary_html: generateEmailSummary(report),
        pm_narrative: report.pm_narrative
      };

      // Call n8n webhook
      const axios = require('axios');
      await axios.post('https://automate.augusto.digital/webhook/send-report', payload);

      res.json({ message: 'Report queued for sending' });
    } catch (error) {
      console.error('Error sending report:', error);
      res.status(500).json({ error: 'Failed to send report', details: error.message });
    }
  });

  /**
   * DELETE /reports/:id
   * Delete a draft report
   */
  router.delete('/reports/:id', async (req, res) => {
    const { id } = req.params;

    try {
      // Check if report is draft
      const [reports] = await db.execute(
        'SELECT status FROM augusto_reports WHERE id = ?',
        [id]
      );

      if (reports.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }

      if (reports[0].status !== 'draft') {
        return res.status(400).json({ error: 'Only draft reports can be deleted' });
      }

      await db.execute('DELETE FROM augusto_reports WHERE id = ?', [id]);

      res.json({ message: 'Report deleted successfully' });
    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({ error: 'Failed to delete report' });
    }
  });

  /**
   * GET /reports/pending-review
   * Get all reports pending review for the current user (as Report PM)
   */
  router.get('/reports/pending-review', async (req, res) => {
    try {
      // Get projects where current user is Report PM
      const [projectData] = await db.execute(
        `SELECT project_code
         FROM augusto_project_data
         WHERE name = 'Report PM' AND value = ?`,
        [req.user?.email || '']
      );

      if (projectData.length === 0) {
        return res.json([]);
      }

      const projectCodes = projectData.map(p => p.project_code);

      // Get pending reports for those projects
      const placeholders = projectCodes.map(() => '?').join(',');
      const [reports] = await db.execute(
        `SELECT r.*,
                hp.name as project_name,
                hc.name as client_name,
                u.full_name as generated_by_name
         FROM augusto_reports r
         LEFT JOIN harvest_projects hp ON r.project_code = hp.code
         LEFT JOIN harvest_clients hc ON hp.client_id = hc.id
         LEFT JOIN augusto_users u ON r.generated_by = u.id
         WHERE r.project_code IN (${placeholders})
           AND r.status = 'pending_review'
         ORDER BY r.generated_at DESC`,
        projectCodes
      );

      res.json(reports);
    } catch (error) {
      console.error('Error fetching pending reports:', error);
      res.status(500).json({ error: 'Failed to fetch pending reports' });
    }
  });

  // ==================== DATA RETRIEVAL ====================

  /**
   * GET /projects/:code/invoices
   * Get invoices for a project
   */
  router.get('/projects/:code/invoices', async (req, res) => {
    const { code } = req.params;

    try {
      const [invoices] = await db.execute(
        `SELECT * FROM augusto_quickbooks_invoices
         WHERE project_code = ?
         ORDER BY due_date DESC`,
        [code]
      );

      res.json(invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ error: 'Failed to fetch invoices' });
    }
  });

  /**
   * GET /projects/:code/time-entries
   * Get time entries for a project
   */
  router.get('/projects/:code/time-entries', async (req, res) => {
    const { code } = req.params;
    const { start_date, end_date } = req.query;

    try {
      let query = 'SELECT * FROM augusto_harvest_time_entries WHERE project_code = ?';
      const params = [code];

      if (start_date) {
        query += ' AND entry_date >= ?';
        params.push(start_date);
      }

      if (end_date) {
        query += ' AND entry_date <= ?';
        params.push(end_date);
      }

      query += ' ORDER BY entry_date DESC';

      const [entries] = await db.execute(query, params);

      res.json(entries);
    } catch (error) {
      console.error('Error fetching time entries:', error);
      res.status(500).json({ error: 'Failed to fetch time entries' });
    }
  });

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Generate HTML summary for email body
   */
  function generateEmailSummary(report) {
    const data = JSON.parse(report.report_data_json || '{}');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>Project Status Report</h2>
        <p><strong>Project:</strong> ${report.project_name || 'N/A'}</p>
        <p><strong>Period:</strong> ${report.report_period_start} to ${report.report_period_end}</p>

        <h3>Financial Summary</h3>
        <ul>
          <li><strong>Total Budget:</strong> $${data.totals?.budget?.toFixed(2) || '0.00'}</li>
          <li><strong>Spent This Period:</strong> $${data.totals?.spent_period?.toFixed(2) || '0.00'}</li>
          <li><strong>Total Spent:</strong> $${data.totals?.spent_total?.toFixed(2) || '0.00'}</li>
          <li><strong>Remaining Balance:</strong> $${data.totals?.remaining?.toFixed(2) || '0.00'}</li>
        </ul>

        ${data.invoices?.length > 0 ? `
        <h3>Invoice Status</h3>
        <p>${data.invoices.length} invoice(s) tracked</p>
        ` : ''}

        ${report.pm_narrative ? `
        <h3>Project Manager Notes</h3>
        <p>${report.pm_narrative}</p>
        ` : ''}

        <p>Please find the detailed report attached as a PDF.</p>
      </div>
    `;
  }

  return router;
};
