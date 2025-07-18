import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import TeamMembers from './components/TeamMembers';
import ServiceLines from './components/ServiceLines';
import Roles from './components/Roles';
import Projects from './components/Projects';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/team-members" element={<TeamMembers />} />
          <Route path="/service-lines" element={<ServiceLines />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/projects" element={<Projects />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;