# AugustoOps - Database Settings Manager

A full-stack operations application for managing database settings with n8n workflow integration.

## Features

- **Settings Management**: Create, read, update, and delete database settings
- **Category Organization**: Group settings by categories for better organization
- **Data Type Support**: String, Number, Boolean, and JSON data types
- **n8n Integration**: Webhook endpoints for n8n workflow automation
- **Modern UI**: Clean, responsive React interface
- **MySQL Integration**: Direct connection to your data warehouse

## Tech Stack

- **Backend**: Node.js, Express.js, MySQL
- **Frontend**: React, TypeScript
- **Database**: MySQL (for data warehouse settings)
- **Integration**: n8n workflow automation

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MySQL database
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AugustoOps
```

2. Install dependencies:
```bash
npm run install-deps
```

3. Set up environment variables:
```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your MySQL database credentials:
```
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=augusto_ops
DB_PORT=3306
PORT=5000
```

4. Start the development servers:
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- React frontend on http://localhost:3000

## API Endpoints

### Settings Management
- `GET /api/settings` - Get all settings
- `GET /api/settings/:category` - Get settings by category
- `POST /api/settings` - Create new setting
- `PUT /api/settings/:id` - Update setting
- `DELETE /api/settings/:id` - Delete setting

### n8n Integration
- `POST /api/webhooks/n8n` - Webhook endpoint for n8n workflows

## Database Schema

The application creates a `settings` table with the following structure:

```sql
CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  key_name VARCHAR(100) NOT NULL,
  value TEXT,
  description TEXT,
  data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_category_key (category, key_name)
);
```

## Usage

1. **Adding Settings**: Click "Add Setting" to create new database configuration entries
2. **Organizing by Category**: Use categories like "database", "api", "n8n", etc.
3. **Data Types**: Choose appropriate data types for validation and display
4. **n8n Integration**: Use the webhook endpoint to trigger setting updates from n8n workflows

## Development

- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend
- `npm run build` - Build the React frontend for production

## License

MIT