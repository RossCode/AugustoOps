# AugustoOps - Team Cost Rate Manager

A full-stack React and Node.js application for managing team member cost rates, service lines, and active status with secure database connectivity.

## Features

- **Team Member Management**: View and edit team member information
- **Cost Rate Updates**: Real-time cost rate editing with validation
- **Service Line Assignment**: Assign team members to service lines with ID - Name display format
- **Active Status Toggle**: Mark team members as active or inactive
- **Smart Filtering**: Show active members by default with option to view all
- **Search Functionality**: Search team members by name
- **Secure Database Access**: SSH tunnel connection to remote MySQL database
- **Modern UI**: Clean, responsive React TypeScript interface

## Tech Stack

- **Backend**: Node.js, Express.js, MySQL
- **Frontend**: React, TypeScript, CSS3
- **Database**: MySQL (via SSH tunnel)
- **Authentication**: SSH key-based database access
- **Security**: Environment-based configuration with SSH tunnel

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- SSH private key for database access
- npm package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/RossCode/AugustoOps.git
cd AugustoOps
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

4. Set up environment variables:
```bash
cd ../server
cp .env.example .env
```

Edit `server/.env` with your database and SSH credentials:
```
DB_HOST=localhost
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
DB_PORT=3307
PORT=5001

# SSH Tunnel Configuration
SSH_HOST=your.ssh.host.com
SSH_USER=your_ssh_user
SSH_PRIVATE_KEY_PATH=/path/to/your/ssh/private/key.txt
SSH_PRIVATE_KEY_PASSPHRASE=your_ssh_key_passphrase
```

5. Start the development servers:

**Backend (from server directory):**
```bash
npm start
```

**Frontend (from client directory):**
```bash
npm start
```

This will start:
- Backend server on http://localhost:5001
- React frontend on http://localhost:3000

## API Endpoints

### Team Members
- `GET /api/team-members` - Get all team members with service line information
- `GET /api/team-members/:name` - Get specific team member
- `PUT /api/team-members/:name/cost-rate` - Update team member cost rate
- `PUT /api/team-members/:name/service-line` - Update team member service line
- `PUT /api/team-members/:name/active-status` - Update team member active status

### Service Lines
- `GET /api/service-lines` - Get all service lines

### Health Check
- `GET /api/test` - Database connection health check

### Webhooks
- `POST /api/webhooks/n8n` - n8n webhook endpoint

## Database Schema

The application uses existing tables:

- **augusto_team_members**: Team member information with cost rates and service line assignments
- **augusto_service_lines**: Service line definitions with ID and name

## Usage

### Team Member Management

1. **View Team Members**: The dashboard shows active team members by default
2. **Filter Options**: 
   - Check/uncheck "Show active members only" to toggle between active and all members
   - Use the search bar to find specific team members
3. **Edit Member**: Click "Edit Member" on any team member card to modify:
   - **Cost Rate**: Hourly rate (saved on form submission)
   - **Service Line**: Dropdown with "ID - Name" format (saved immediately)
   - **Active Status**: Checkbox toggle (saved immediately)

### Service Line Format

Service lines are displayed as "ID - Name" format:
- 04 - Software Engineering
- 03 - User Experience Design
- 00 - Consulting
- etc.

## Security Features

- **SSH Tunnel**: Secure database connection via SSH tunnel
- **Environment Variables**: Sensitive credentials stored in .env files
- **Git Security**: SSH keys and sensitive files excluded from version control
- **Key Management**: Support for encrypted SSH private keys with passphrases

## Development

### Server Commands
```bash
cd server
npm start      # Start with nodemon (development)
npm run prod   # Start without nodemon (production)
```

### Client Commands
```bash
cd client
npm start      # Start development server
npm run build  # Build for production
npm test       # Run tests
```

## Project Structure

```
AugustoOps/
├── client/                 # React TypeScript frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── App.tsx        # Main application component
│   │   ├── App.css        # Application styles
│   │   └── ...
│   └── package.json
├── server/                # Node.js Express backend
│   ├── index.js          # Main server file
│   ├── .env.example      # Environment template
│   └── package.json
└── README.md
```

## License

MIT