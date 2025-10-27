/**
 * PDF Generator Service
 * Generates PDF reports from HTML templates
 *
 * NOTE: This is a stub implementation. Full Puppeteer integration
 * will be added in Phase 5.
 */

/**
 * Generate HTML for report preview/PDF
 * @param {Object} report - Report object with all data
 * @returns {string} HTML string
 */
async function generateReportHTML(report) {
  const data = report.report_data || {};

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Status Report - ${report.project_name}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 40px auto;
          padding: 20px;
          color: #333;
        }
        h1 {
          color: #2c3e50;
          border-bottom: 3px solid #3498db;
          padding-bottom: 10px;
        }
        h2 {
          color: #34495e;
          margin-top: 30px;
        }
        .header-info {
          background: #ecf0f1;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .header-info p {
          margin: 5px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background: #3498db;
          color: white;
          padding: 12px;
          text-align: left;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #ddd;
        }
        tr:hover {
          background: #f5f5f5;
        }
        .totals-row {
          font-weight: bold;
          background: #e8f4f8;
        }
        .status-paid {
          color: #27ae60;
          font-weight: bold;
        }
        .status-open {
          color: #f39c12;
          font-weight: bold;
        }
        .status-overdue {
          color: #e74c3c;
          font-weight: bold;
        }
        .narrative {
          background: #fff9e6;
          padding: 15px;
          border-left: 4px solid #f39c12;
          margin: 20px 0;
        }
        .summary-box {
          display: inline-block;
          background: #3498db;
          color: white;
          padding: 15px 20px;
          margin: 10px 10px 10px 0;
          border-radius: 5px;
        }
        .summary-box .label {
          font-size: 12px;
          opacity: 0.9;
        }
        .summary-box .value {
          font-size: 24px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <h1>Project Status Report</h1>

      <div class="header-info">
        <p><strong>Project:</strong> ${report.project_name || 'N/A'}</p>
        <p><strong>Client:</strong> ${report.client_name || 'N/A'}</p>
        <p><strong>Project Code:</strong> ${report.project_code}</p>
        <p><strong>Report Period:</strong> ${report.report_period_start} to ${report.report_period_end}</p>
        <p><strong>Generated:</strong> ${new Date(report.generated_at).toLocaleString()}</p>
      </div>

      ${report.pm_narrative ? `
        <div class="narrative">
          <h3>Project Manager Summary</h3>
          <p>${report.pm_narrative}</p>
        </div>
      ` : ''}

      <h2>Financial Summary</h2>

      <div>
        <div class="summary-box">
          <div class="label">Total Budget</div>
          <div class="value">$${(data.totals?.budget || 0).toFixed(2)}</div>
        </div>
        <div class="summary-box">
          <div class="label">Spent This Period</div>
          <div class="value">$${(data.totals?.spent_period || 0).toFixed(2)}</div>
        </div>
        <div class="summary-box" style="background: #27ae60;">
          <div class="label">Remaining Balance</div>
          <div class="value">$${(data.totals?.remaining || 0).toFixed(2)}</div>
        </div>
      </div>

      <h2>Task Breakdown</h2>

      ${data.tasks && data.tasks.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Budget</th>
              <th>Spent (Period)</th>
              <th>Spent (Total)</th>
              <th>Remaining</th>
            </tr>
          </thead>
          <tbody>
            ${data.tasks.map(task => `
              <tr>
                <td>${task.task_name}</td>
                <td>$${task.budget ? task.budget.toFixed(2) : 'N/A'}</td>
                <td>$${(task.spent_period || 0).toFixed(2)}</td>
                <td>$${(task.spent_total || 0).toFixed(2)}</td>
                <td>$${task.remaining !== null ? task.remaining.toFixed(2) : 'N/A'}</td>
              </tr>
            `).join('')}
            <tr class="totals-row">
              <td>TOTALS</td>
              <td>$${(data.totals?.budget || 0).toFixed(2)}</td>
              <td>$${(data.totals?.spent_period || 0).toFixed(2)}</td>
              <td>$${(data.totals?.spent_total || 0).toFixed(2)}</td>
              <td>$${(data.totals?.remaining || 0).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      ` : '<p>No task data available.</p>'}

      <h2>Invoice Status</h2>

      ${data.invoices && data.invoices.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Paid Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.invoices.map(invoice => `
              <tr>
                <td>${invoice.invoice_number}</td>
                <td>$${invoice.amount.toFixed(2)}</td>
                <td>${invoice.due_date || 'N/A'}</td>
                <td>${invoice.paid_date || '-'}</td>
                <td class="status-${invoice.status}">${invoice.status.toUpperCase()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${data.invoice_summary ? `
          <div style="margin-top: 15px;">
            <p><strong>Paid:</strong> ${data.invoice_summary.paid_count} invoice(s) - $${data.invoice_summary.paid_amount.toFixed(2)}</p>
            <p><strong>Open:</strong> ${data.invoice_summary.open_count} invoice(s) - $${data.invoice_summary.open_amount.toFixed(2)}</p>
            ${data.invoice_summary.overdue_count > 0 ? `
              <p style="color: #e74c3c;"><strong>OVERDUE:</strong> ${data.invoice_summary.overdue_count} invoice(s) - $${data.invoice_summary.overdue_amount.toFixed(2)}</p>
            ` : ''}
          </div>
        ` : ''}
      ` : '<p>No invoices found for this project.</p>'}

      <h2>Jira Integration</h2>
      <p><em>Jira sprint data integration coming soon...</em></p>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #7f8c8d; font-size: 12px;">
        <p>Generated by AugustoOps - Project Status Reports</p>
      </div>
    </body>
    </html>
  `;

  return html;
}

/**
 * Generate PDF buffer from report data
 * @param {Object} report - Report object with all data
 * @returns {Buffer} PDF buffer
 *
 * NOTE: This is a stub. Will be implemented with Puppeteer in Phase 5.
 */
async function generatePDF(report) {
  // For now, return a simple text buffer as placeholder
  // In Phase 5, this will use Puppeteer to convert HTML to PDF

  const html = await generateReportHTML(report);

  // TODO: Implement Puppeteer PDF generation
  // const browser = await puppeteer.launch();
  // const page = await browser.newPage();
  // await page.setContent(html);
  // const pdfBuffer = await page.pdf({
  //   format: 'A4',
  //   printBackground: true,
  //   margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
  // });
  // await browser.close();
  // return pdfBuffer;

  // Placeholder: Return HTML as buffer for now
  return Buffer.from(html, 'utf-8');
}

module.exports = {
  generateReportHTML,
  generatePDF
};
