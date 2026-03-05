import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './JudgeLogin.css';

const API_BASE = '/api';

function JudgeLogin() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const savedJudge = localStorage.getItem('currentJudge');
    if (savedJudge) {
      navigate('/judge/scoring');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !password) {
      setError('Please enter both name and password');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/judges/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, password })
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        // If response is not JSON, it's likely a server error
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      if (response.ok) {
        localStorage.setItem('currentJudge', JSON.stringify(result.judge));
        navigate('/judge/scoring');
      } else {
        setError(result.message || 'Invalid credentials');
      }
    } catch (error) {
      setError('Error connecting to server. Please try again.');
      console.error('Error:', error);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>🎵 Judge Scoring Panel</h1>
        <div className="header-links">
          <a href="/admin" className="link-btn">Admin Panel</a>
        </div>
      </header>

      <div className="page">
        <h2>Judge Login</h2>
        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="login-name">Judge Name:</label>
            <input
              type="text"
              id="login-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., judge1, judge2"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password:</label>
            <input
              type="password"
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="submit-btn">Login</button>
        </form>
      </div>
    </div>
  );
}

export default JudgeLogin;
