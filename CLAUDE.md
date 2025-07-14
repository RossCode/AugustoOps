# AugustoOps Project

## Overview
Full-stack operations app for managing database settings with React frontend and Node.js backend.

## Architecture
- **Frontend**: React (TypeScript) in `/client`
- **Backend**: Express.js API in `/server` 
- **Database**: MySQL with SSH tunnel support
- **Build Tool**: Create React App

## Development Commands
```bash
# Install all dependencies
npm run install-deps

# Start both client and server in development
npm run dev

# Start server only
npm run server

# Start client only  
npm run client

# Build for production
npm run build
```

## Key Components
- Projects dashboard with client filtering (300XXX codes)
- Team member management
- Service lines configuration
- Roles management panel
- Home dashboard

## Environment Setup
- Server requires `.env` file with database connection details
- SSH tunnel scripts available for secure database connections
- Uses `nodemon` for development server auto-reload

## Testing
```bash
cd client && npm test
```

## Tech Stack
- **Frontend**: React 19, TypeScript, React Router
- **Backend**: Express, MySQL2, SSH2, Helmet
- **Development**: Nodemon, Concurrently