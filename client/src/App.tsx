import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Login from './components/Login';
import AccessDenied from './components/AccessDenied';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './components/Home';
import TeamMembers from './components/TeamMembers';
import ServiceLines from './components/ServiceLines';
import Roles from './components/Roles';
import Projects from './components/Projects';
import ProjectAudit from './components/ProjectAudit';
import Admin from './components/Admin';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Header />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<Login />} />
            <Route path="/access-denied" element={<AccessDenied />} />

            {/* Protected routes - require authentication */}
            <Route path="/" element={
              <ProtectedRoute roles={['Member', 'Project Manager', 'Account Manager', 'Operations Leader', 'Service Line Leader', 'Admin']}>
                <Home />
              </ProtectedRoute>
            } />

            <Route path="/projects" element={
              <ProtectedRoute roles={['Project Manager', 'Account Manager', 'Operations Leader', 'Admin']}>
                <Projects />
              </ProtectedRoute>
            } />

            <Route path="/audit" element={
              <ProtectedRoute roles={['Operations Leader', 'Admin']}>
                <ProjectAudit />
              </ProtectedRoute>
            } />

            <Route path="/team-members" element={
              <ProtectedRoute roles={['Service Line Leader', 'Operations Leader', 'Admin']}>
                <TeamMembers />
              </ProtectedRoute>
            } />

            <Route path="/service-lines" element={
              <ProtectedRoute roles={['Service Line Leader', 'Operations Leader', 'Admin']}>
                <ServiceLines />
              </ProtectedRoute>
            } />

            <Route path="/roles" element={
              <ProtectedRoute roles={['Service Line Leader', 'Operations Leader', 'Admin']}>
                <Roles />
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute roles={['Admin']}>
                <Admin />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;