/**
 * Report Generator Service
 * Calculates budget, spending, and invoice data for project status reports
 */

/**
 * Generate report data for a project within a date range
 * @param {Object} db - Database connection
 * @param {string} projectCode - Project code (e.g., "300123")
 * @param {string} startDate - Period start date (YYYY-MM-DD)
 * @param {string} endDate - Period end date (YYYY-MM-DD)
 * @returns {Object} Report data with tasks, totals, and invoices
 */
async function generateReportData(db, projectCode, startDate, endDate) {
  try {
    // Get project info
    const [projects] = await db.execute(
      `SELECT hp.*, hc.name as client_name
       FROM harvest_projects hp
       LEFT JOIN harvest_clients hc ON hp.client_id = hc.id
       WHERE hp.code = ?`,
      [projectCode]
    );

    if (projects.length === 0) {
      throw new Error(`Project ${projectCode} not found`);
    }

    const project = projects[0];

    // Get task assignments for this project
    const [taskAssignments] = await db.execute(
      `SELECT DISTINCT hta.task_id, ht.name as task_name
       FROM harvest_task_assignments hta
       LEFT JOIN harvest_tasks ht ON hta.task_id = ht.id
       WHERE hta.project_id = ?
       AND hta.is_active = 1`,
      [project.id]
    );

    // Get fixed cost tasks
    const [fixedCostTasks] = await db.execute(
      `SELECT * FROM augusto_fixed_cost_tasks
       WHERE project_id = ?`,
      [project.id]
    );

    // Calculate task-level data
    const tasks = [];
    let totalBudget = 0;
    let totalSpentPeriod = 0;
    let totalSpentToDate = 0;

    for (const task of taskAssignments) {
      const taskData = await calculateTaskData(
        db,
        projectCode,
        task.task_id,
        task.task_name,
        startDate,
        endDate
      );

      tasks.push(taskData);
      totalBudget += taskData.budget || 0;
      totalSpentPeriod += taskData.spent_period || 0;
      totalSpentToDate += taskData.spent_total || 0;
    }

    // Add fixed cost tasks to the calculation
    for (const fixedTask of fixedCostTasks) {
      const isInPeriod = fixedTask.date >= startDate && fixedTask.date <= endDate;

      tasks.push({
        task_id: fixedTask.task_id,
        task_name: fixedTask.description || `Fixed Cost Task ${fixedTask.id}`,
        budget: fixedTask.billable_amount || 0,
        spent_period: isInPeriod ? (fixedTask.cost_amount || 0) : 0,
        spent_total: fixedTask.cost_amount || 0,
        remaining: (fixedTask.billable_amount || 0) - (fixedTask.cost_amount || 0),
        type: 'fixed_cost'
      });

      totalBudget += fixedTask.billable_amount || 0;
      if (isInPeriod) {
        totalSpentPeriod += fixedTask.cost_amount || 0;
      }
      totalSpentToDate += fixedTask.cost_amount || 0;
    }

    // Get invoices
    const [invoices] = await db.execute(
      `SELECT * FROM augusto_quickbooks_invoices
       WHERE project_code = ?
       ORDER BY due_date DESC`,
      [projectCode]
    );

    // Calculate invoice summaries
    const invoiceSummary = {
      total_count: invoices.length,
      paid_count: invoices.filter(i => i.status === 'paid').length,
      open_count: invoices.filter(i => i.status === 'open').length,
      overdue_count: invoices.filter(i => i.status === 'overdue').length,
      paid_amount: invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + parseFloat(i.amount), 0),
      open_amount: invoices
        .filter(i => i.status === 'open')
        .reduce((sum, i) => sum + parseFloat(i.amount), 0),
      overdue_amount: invoices
        .filter(i => i.status === 'overdue')
        .reduce((sum, i) => sum + parseFloat(i.amount), 0)
    };

    // Build report data structure
    const reportData = {
      project: {
        code: projectCode,
        name: project.name,
        client_name: project.client_name,
        budget: parseFloat(project.budget) || 0,
        budget_hours: parseFloat(project.budget_hours) || 0,
        is_fixed_fee: project.is_fixed_fee === 1,
        billable: project.billable === 1
      },
      period: {
        start: startDate,
        end: endDate
      },
      tasks: tasks,
      totals: {
        budget: totalBudget,
        spent_period: totalSpentPeriod,
        spent_total: totalSpentToDate,
        remaining: totalBudget - totalSpentToDate
      },
      invoices: invoices.map(inv => ({
        invoice_number: inv.invoice_number,
        amount: parseFloat(inv.amount),
        due_date: inv.due_date,
        paid_date: inv.paid_date,
        status: inv.status,
        is_overdue: inv.status === 'overdue' ||
                    (inv.status === 'open' && new Date(inv.due_date) < new Date())
      })),
      invoice_summary: invoiceSummary,
      generated_at: new Date().toISOString()
    };

    return reportData;
  } catch (error) {
    console.error('Error generating report data:', error);
    throw error;
  }
}

/**
 * Calculate data for a specific task
 */
async function calculateTaskData(db, projectCode, taskId, taskName, startDate, endDate) {
  try {
    // Get time entries for this task in the period
    const [periodEntries] = await db.execute(
      `SELECT SUM(hours * cost_rate) as spent
       FROM augusto_harvest_time_entries
       WHERE project_code = ?
       AND task_id = ?
       AND entry_date >= ?
       AND entry_date <= ?`,
      [projectCode, taskId, startDate, endDate]
    );

    // Get all time entries for this task to date
    const [totalEntries] = await db.execute(
      `SELECT SUM(hours * cost_rate) as spent
       FROM augusto_harvest_time_entries
       WHERE project_code = ?
       AND task_id = ?`,
      [projectCode, taskId]
    );

    // Get budget allocation (simplified - would need more complex logic for real allocation)
    // For now, we'll estimate based on task proportions
    const spentTotal = parseFloat(totalEntries[0]?.spent) || 0;
    const spentPeriod = parseFloat(periodEntries[0]?.spent) || 0;

    // TODO: Implement proper budget allocation per task
    // For now, we'll set budget as null and let the frontend handle it
    const budget = null;

    return {
      task_id: taskId,
      task_name: taskName || `Task ${taskId}`,
      budget: budget,
      spent_period: spentPeriod,
      spent_total: spentTotal,
      remaining: budget ? budget - spentTotal : null,
      type: 'time_tracked'
    };
  } catch (error) {
    console.error(`Error calculating task data for task ${taskId}:`, error);
    throw error;
  }
}

/**
 * Calculate next scheduled report date for a project
 * @param {Object} config - Report configuration
 * @param {Date} lastReportDate - Date of last report (optional)
 * @returns {Date} Next scheduled report date
 */
function calculateNextReportDate(config, lastReportDate = null) {
  const today = new Date();

  // Map day names to numbers (0 = Sunday, 1 = Monday, etc.)
  const dayMap = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };

  const targetDay = dayMap[config.send_day] || 2; // Default to Tuesday

  if (config.frequency === 'weekly') {
    // Next occurrence of the target day
    const daysUntilTarget = (targetDay - today.getDay() + 7) % 7;
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
    return nextDate;
  } else if (config.frequency === 'bi-weekly') {
    if (!lastReportDate) {
      // If no last report, schedule for next target day
      const daysUntilTarget = (targetDay - today.getDay() + 7) % 7;
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
      return nextDate;
    }

    // Add 14 days to last report date
    const nextDate = new Date(lastReportDate);
    nextDate.setDate(nextDate.getDate() + 14);
    return nextDate;
  } else if (config.frequency === 'monthly') {
    // Day after first Monday of next month
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const firstMonday = nextMonth.getDay() === 1 ? 1 : (8 - nextMonth.getDay()) % 7 + 1;
    nextMonth.setDate(firstMonday + 1);
    return nextMonth;
  }

  return null;
}

module.exports = {
  generateReportData,
  calculateTaskData,
  calculateNextReportDate
};
