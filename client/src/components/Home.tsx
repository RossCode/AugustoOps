import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>AugustoOps</h1>
        <p>Business Operations Management Tools</p>
      </header>

      <main className="home-content">
        <div className="tools-grid">
          <Card className="tool-card">
            <CardHeader className="text-center">
              <div className="tool-icon text-4xl mb-2">👥</div>
              <CardTitle>Team Manager</CardTitle>
              <CardDescription>
                Manage team member cost rates, internal rates, weekly capacity, and service lines
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button asChild>
                <Link to="/team-members">
                  Manage Team Members
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="tool-card">
            <CardHeader className="text-center">
              <div className="tool-icon text-4xl mb-2">🏢</div>
              <CardTitle>Service Lines</CardTitle>
              <CardDescription>
                Create and manage service line categories and classifications
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button asChild>
                <Link to="/service-lines">
                  Manage Service Lines
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="tool-card">
            <CardHeader className="text-center">
              <div className="tool-icon text-4xl mb-2">👔</div>
              <CardTitle>Roles</CardTitle>
              <CardDescription>
                Define and manage default roles and job functions
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button asChild>
                <Link to="/roles">
                  Manage Roles
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="tool-card">
            <CardHeader className="text-center">
              <div className="tool-icon text-4xl mb-2">📋</div>
              <CardTitle>Projects</CardTitle>
              <CardDescription>
                Manage project data, team assignments, and project details
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button asChild>
                <Link to="/projects">
                  View Projects
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="tool-card">
            <CardHeader className="text-center">
              <div className="tool-icon text-4xl mb-2">⚙️</div>
              <CardTitle>Admin Utilities</CardTitle>
              <CardDescription>
                System administration and data synchronization tools
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button asChild>
                <Link to="/admin">
                  Admin Panel
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="tool-card">
            <CardHeader className="text-center">
              <div className="tool-icon text-4xl mb-2">📊</div>
              <CardTitle>Project Data Audit</CardTitle>
              <CardDescription>
                Identify and complete missing project data fields for active projects
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button asChild>
                <Link to="/audit">
                  Audit Projects
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="tool-card">
            <CardHeader className="text-center">
              <div className="tool-icon text-4xl mb-2">📊</div>
              <CardTitle>Status Reports</CardTitle>
              <CardDescription>
                Review and approve bi-weekly project status reports with financial tracking
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button asChild>
                <Link to="/reports/review">
                  Review Reports
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>

      <footer className="home-footer">
        <p>&copy; 2024 AugustoOps - Business Operations Management</p>
      </footer>
    </div>
  );
};

export default Home;