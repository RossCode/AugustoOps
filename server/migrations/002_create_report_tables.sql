-- Migration: Create Status Reports Tables
-- Created: 2025-10-27
-- Description: Tables for bi-weekly project status reports with PM review workflow

-- 1. Report Configuration per Project
CREATE TABLE IF NOT EXISTS augusto_report_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_code VARCHAR(50) NOT NULL UNIQUE,
    frequency ENUM('weekly', 'bi-weekly', 'monthly') NOT NULL DEFAULT 'bi-weekly',
    send_day VARCHAR(20) NOT NULL DEFAULT 'Tuesday',
    send_time TIME NOT NULL DEFAULT '10:00:00',
    reporting_period_weeks INT NOT NULL DEFAULT 2,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    include_jira BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_project_code (project_code),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. External Recipients per Project
CREATE TABLE IF NOT EXISTS augusto_report_external_recipients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_project_code (project_code),
    UNIQUE KEY unique_project_email (project_code, email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Internal Recipients (Team Members) per Project
CREATE TABLE IF NOT EXISTS augusto_report_internal_recipients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_code VARCHAR(50) NOT NULL,
    team_member_id INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_project_code (project_code),
    INDEX idx_team_member_id (team_member_id),
    UNIQUE KEY unique_project_member (project_code, team_member_id),
    FOREIGN KEY (team_member_id) REFERENCES augusto_team_members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Generated Reports
CREATE TABLE IF NOT EXISTS augusto_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_code VARCHAR(50) NOT NULL,
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    status ENUM('draft', 'pending_review', 'approved', 'sent') NOT NULL DEFAULT 'draft',
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    generated_by INT NULL,
    reviewed_by INT NULL,
    reviewed_at DATETIME NULL,
    sent_at DATETIME NULL,
    pm_narrative TEXT NULL,
    report_data_json JSON NULL,
    INDEX idx_project_code (project_code),
    INDEX idx_status (status),
    INDEX idx_generated_at (generated_at),
    INDEX idx_reviewed_by (reviewed_by),
    FOREIGN KEY (generated_by) REFERENCES augusto_users(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES augusto_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. QuickBooks Invoices (synced from n8n)
CREATE TABLE IF NOT EXISTS augusto_quickbooks_invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_code VARCHAR(50) NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE NULL,
    status ENUM('draft', 'open', 'paid', 'overdue') NOT NULL DEFAULT 'open',
    synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_project_code (project_code),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date),
    UNIQUE KEY unique_invoice_number (invoice_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Harvest Time Entries (synced from n8n)
CREATE TABLE IF NOT EXISTS augusto_harvest_time_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    harvest_id BIGINT NOT NULL UNIQUE,
    project_code VARCHAR(50) NOT NULL,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    hours DECIMAL(5, 2) NOT NULL,
    billable_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    cost_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    entry_date DATE NOT NULL,
    synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_project_code (project_code),
    INDEX idx_entry_date (entry_date),
    INDEX idx_task_id (task_id),
    INDEX idx_harvest_id (harvest_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comments for documentation
ALTER TABLE augusto_report_configs
    COMMENT = 'Configuration for automated project status reports';

ALTER TABLE augusto_report_external_recipients
    COMMENT = 'External email recipients for project status reports';

ALTER TABLE augusto_report_internal_recipients
    COMMENT = 'Internal team members who receive project status reports';

ALTER TABLE augusto_reports
    COMMENT = 'Generated status reports with PM review workflow';

ALTER TABLE augusto_quickbooks_invoices
    COMMENT = 'QuickBooks invoice data synced via n8n for status reports';

ALTER TABLE augusto_harvest_time_entries
    COMMENT = 'Harvest time tracking entries synced via n8n for status reports';
