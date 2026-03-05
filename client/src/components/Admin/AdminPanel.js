import React, { useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import ManageSongs from './ManageSongs';
import ManageJudges from './ManageJudges';
import ProgramOrder from './ProgramOrder';
import Results from './Results';
import CompetitionConfig from './CompetitionConfig';
import './AdminPanel.css';

function AdminPanel() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is logged in
    const savedAdmin = localStorage.getItem('currentAdmin');
    if (!savedAdmin) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('currentAdmin');
    navigate('/admin/login');
  };

  return (
    <div className="container">
      <header>
        <h1>🎵 Admin Panel - Song Competition</h1>
        <div className="header-links">
          <a href="/judge" className="link-btn">Judge Panel</a>
          <button className="link-btn" onClick={handleLogout} style={{ marginLeft: '10px' }}>
            Logout
          </button>
        </div>
      </header>

      <nav className="admin-nav">
        <NavLink to="/admin/songs" className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>
          Manage Songs
        </NavLink>
        <NavLink to="/admin/judges" className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>
          Manage Judges
        </NavLink>
        <NavLink to="/admin/program" className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>
          Program Order
        </NavLink>
        <NavLink to="/admin/config" className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>
          Define Group&Event
        </NavLink>
        <NavLink to="/admin/results" className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>
          Results
        </NavLink>
      </nav>

      <Routes>
        <Route path="songs" element={<ManageSongs />} />
        <Route path="judges" element={<ManageJudges />} />
        <Route path="program" element={<ProgramOrder />} />
        <Route path="config" element={<CompetitionConfig />} />
        <Route path="results" element={<Results />} />
        <Route path="*" element={<ManageSongs />} />
      </Routes>
    </div>
  );
}

export default AdminPanel;
