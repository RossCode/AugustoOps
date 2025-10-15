-- Migration: Create Authentication Tables
-- Description: Creates tables for Google OAuth authentication and role-based access control
-- Date: 2025-10-14

-- Table: augusto_users
-- Stores user accounts linked to Google OAuth identities
CREATE TABLE IF NOT EXISTS augusto_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  google_id VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  profile_picture TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP NULL,
  INDEX idx_google_id (google_id),
  INDEX idx_email (email),
  INDEX idx_is_approved (is_approved),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: augusto_user_roles
-- Many-to-many relationship between users and their assigned roles
CREATE TABLE IF NOT EXISTS augusto_user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role_name VARCHAR(50) NOT NULL,
  granted_by INT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES augusto_users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES augusto_users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_role (user_id, role_name),
  INDEX idx_user_id (user_id),
  INDEX idx_role_name (role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: augusto_access_requests
-- Tracks access requests from users who have authenticated with Google but need approval
CREATE TABLE IF NOT EXISTS augusto_access_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  google_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  requested_roles TEXT,
  message TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INT NULL,
  reviewed_at TIMESTAMP NULL,
  FOREIGN KEY (reviewed_by) REFERENCES augusto_users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_email (email),
  INDEX idx_requested_at (requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert comment for documentation
-- Valid role names: 'Admin', 'Operations Leader', 'Account Manager', 'Project Manager', 'Service Line Leader', 'Member'
-- Users can have multiple roles assigned simultaneously
-- First user to authenticate will automatically receive 'Admin' role
-- All subsequent users must be approved by an Admin
