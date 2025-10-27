const express = require('express');

/**
 * Webhook Routes for n8n Integration
 * Handles data synchronization from external systems
 */

module.exports = (db) => {
  const router = express.Router();

  /**
   * POST /n8n/invoices
   * Receive QuickBooks invoice data from n8n
   *
   * Expected payload:
   * {
   *   invoices: [
   *     {
   *       project_code: "300123",
   *       invoice_number: "INV-001",
   *       amount: 5000.00,
   *       due_date: "2025-11-15",
   *       paid_date: null,
   *       status: "open"
   *     }
   *   ]
   * }
   */
  router.post('/n8n/invoices', async (req, res) => {
    const { invoices } = req.body;

    if (!invoices || !Array.isArray(invoices)) {
      return res.status(400).json({ error: 'Invalid payload: invoices array required' });
    }

    try {
      let inserted = 0;
      let updated = 0;
      let errors = 0;

      for (const invoice of invoices) {
        const {
          project_code,
          invoice_number,
          amount,
          due_date,
          paid_date,
          status
        } = invoice;

        // Validate required fields
        if (!project_code || !invoice_number || !amount || !due_date || !status) {
          console.error('Missing required fields in invoice:', invoice);
          errors++;
          continue;
        }

        // Validate status
        const validStatuses = ['draft', 'open', 'paid', 'overdue'];
        if (!validStatuses.includes(status)) {
          console.error('Invalid status:', status);
          errors++;
          continue;
        }

        try {
          // Check if invoice exists
          const [existing] = await db.execute(
            'SELECT id FROM augusto_quickbooks_invoices WHERE invoice_number = ?',
            [invoice_number]
          );

          if (existing.length > 0) {
            // Update existing invoice
            await db.execute(
              `UPDATE augusto_quickbooks_invoices
               SET project_code = ?,
                   amount = ?,
                   due_date = ?,
                   paid_date = ?,
                   status = ?,
                   synced_at = NOW()
               WHERE invoice_number = ?`,
              [project_code, amount, due_date, paid_date, status, invoice_number]
            );
            updated++;
          } else {
            // Insert new invoice
            await db.execute(
              `INSERT INTO augusto_quickbooks_invoices
               (project_code, invoice_number, amount, due_date, paid_date, status)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [project_code, invoice_number, amount, due_date, paid_date, status]
            );
            inserted++;
          }
        } catch (error) {
          console.error('Error processing invoice:', invoice_number, error);
          errors++;
        }
      }

      res.json({
        message: 'Invoice sync completed',
        inserted,
        updated,
        errors,
        total: invoices.length
      });
    } catch (error) {
      console.error('Error syncing invoices:', error);
      res.status(500).json({ error: 'Failed to sync invoices' });
    }
  });

  /**
   * POST /n8n/time-entries
   * Receive Harvest time entry data from n8n
   *
   * Expected payload:
   * {
   *   time_entries: [
   *     {
   *       harvest_id: 12345678,
   *       project_code: "300123",
   *       task_id: 101,
   *       user_id: 5,
   *       hours: 8.5,
   *       billable_rate: 150.00,
   *       cost_rate: 75.00,
   *       entry_date: "2025-10-15"
   *     }
   *   ]
   * }
   */
  router.post('/n8n/time-entries', async (req, res) => {
    const { time_entries } = req.body;

    if (!time_entries || !Array.isArray(time_entries)) {
      return res.status(400).json({ error: 'Invalid payload: time_entries array required' });
    }

    try {
      let inserted = 0;
      let updated = 0;
      let errors = 0;

      for (const entry of time_entries) {
        const {
          harvest_id,
          project_code,
          task_id,
          user_id,
          hours,
          billable_rate,
          cost_rate,
          entry_date
        } = entry;

        // Validate required fields
        if (!harvest_id || !project_code || !task_id || !user_id || !hours || !entry_date) {
          console.error('Missing required fields in time entry:', entry);
          errors++;
          continue;
        }

        try {
          // Check if time entry exists
          const [existing] = await db.execute(
            'SELECT id FROM augusto_harvest_time_entries WHERE harvest_id = ?',
            [harvest_id]
          );

          if (existing.length > 0) {
            // Update existing entry
            await db.execute(
              `UPDATE augusto_harvest_time_entries
               SET project_code = ?,
                   task_id = ?,
                   user_id = ?,
                   hours = ?,
                   billable_rate = ?,
                   cost_rate = ?,
                   entry_date = ?,
                   synced_at = NOW()
               WHERE harvest_id = ?`,
              [project_code, task_id, user_id, hours, billable_rate || 0, cost_rate || 0, entry_date, harvest_id]
            );
            updated++;
          } else {
            // Insert new entry
            await db.execute(
              `INSERT INTO augusto_harvest_time_entries
               (harvest_id, project_code, task_id, user_id, hours, billable_rate, cost_rate, entry_date)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [harvest_id, project_code, task_id, user_id, hours, billable_rate || 0, cost_rate || 0, entry_date]
            );
            inserted++;
          }
        } catch (error) {
          console.error('Error processing time entry:', harvest_id, error);
          errors++;
        }
      }

      res.json({
        message: 'Time entries sync completed',
        inserted,
        updated,
        errors,
        total: time_entries.length
      });
    } catch (error) {
      console.error('Error syncing time entries:', error);
      res.status(500).json({ error: 'Failed to sync time entries' });
    }
  });

  /**
   * POST /n8n/report-sent
   * Callback from n8n after report is sent via email
   *
   * Expected payload:
   * {
   *   report_id: 123,
   *   status: "sent" | "failed",
   *   error_message: "Optional error message"
   * }
   */
  router.post('/n8n/report-sent', async (req, res) => {
    const { report_id, status, error_message } = req.body;

    if (!report_id || !status) {
      return res.status(400).json({ error: 'report_id and status required' });
    }

    try {
      if (status === 'sent') {
        await db.execute(
          `UPDATE augusto_reports
           SET status = 'sent',
               sent_at = NOW()
           WHERE id = ?`,
          [report_id]
        );
      } else {
        // Log error but don't change status
        console.error(`Report ${report_id} failed to send:`, error_message);
      }

      res.json({ message: 'Status updated successfully' });
    } catch (error) {
      console.error('Error updating report status:', error);
      res.status(500).json({ error: 'Failed to update report status' });
    }
  });

  /**
   * GET /n8n/scheduled-reports
   * Called by n8n cron to get projects that need reports generated today
   *
   * Returns list of projects that should have reports generated
   */
  router.get('/n8n/scheduled-reports', async (req, res) => {
    try {
      const today = new Date();
      const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
      const dayOfMonth = today.getDate();

      // Get active report configurations
      const [configs] = await db.execute(
        `SELECT rc.*,
                hp.name as project_name,
                hc.name as client_name
         FROM augusto_report_configs rc
         LEFT JOIN harvest_projects hp ON rc.project_code = hp.code
         LEFT JOIN harvest_clients hc ON hp.client_id = hc.id
         WHERE rc.is_active = TRUE`
      );

      const projectsToReport = [];

      for (const config of configs) {
        let shouldGenerate = false;

        if (config.frequency === 'weekly' && config.send_day === dayOfWeek) {
          shouldGenerate = true;
        } else if (config.frequency === 'bi-weekly') {
          // Check if it's been 2 weeks since last report
          const [lastReport] = await db.execute(
            `SELECT generated_at FROM augusto_reports
             WHERE project_code = ?
             ORDER BY generated_at DESC
             LIMIT 1`,
            [config.project_code]
          );

          if (lastReport.length === 0) {
            // No previous report, generate if it's the right day
            shouldGenerate = config.send_day === dayOfWeek;
          } else {
            const lastReportDate = new Date(lastReport[0].generated_at);
            const daysSinceLastReport = Math.floor((today - lastReportDate) / (1000 * 60 * 60 * 24));

            if (daysSinceLastReport >= 14 && config.send_day === dayOfWeek) {
              shouldGenerate = true;
            }
          }
        } else if (config.frequency === 'monthly') {
          // Generate on the day after the first Monday of the month
          const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const firstMonday = firstDayOfMonth.getDay() === 1 ? 1 : (8 - firstDayOfMonth.getDay()) % 7 + 1;
          const targetDay = firstMonday + 1;

          shouldGenerate = dayOfMonth === targetDay;
        }

        if (shouldGenerate) {
          // Calculate date range
          const endDate = new Date(today);
          const startDate = new Date(today);
          startDate.setDate(endDate.getDate() - (config.reporting_period_weeks * 7));

          projectsToReport.push({
            project_code: config.project_code,
            project_name: config.project_name,
            client_name: config.client_name,
            frequency: config.frequency,
            period_start: startDate.toISOString().split('T')[0],
            period_end: endDate.toISOString().split('T')[0]
          });
        }
      }

      res.json({
        date: today.toISOString().split('T')[0],
        day_of_week: dayOfWeek,
        projects: projectsToReport
      });
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
      res.status(500).json({ error: 'Failed to fetch scheduled reports' });
    }
  });

  return router;
};
