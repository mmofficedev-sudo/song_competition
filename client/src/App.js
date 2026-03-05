import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import JudgeLogin from './components/Judge/JudgeLogin';
import JudgeScoring from './components/Judge/JudgeScoring';
import AdminLogin from './components/Admin/AdminLogin';
import AdminPanel from './components/Admin/AdminPanel';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/judge" replace />} />
        <Route path="/judge" element={<JudgeLogin />} />
        <Route path="/judge/scoring" element={<JudgeScoring />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/*" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;
