import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

const API_BASE = '/api';

function AdminLogin() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const savedAdmin = localStorage.getItem('currentAdmin');
    if (savedAdmin) {
      navigate('/admin/songs');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('currentAdmin', JSON.stringify(result.admin));
        navigate('/admin/songs');
      } else {
        setError(result.message || 'Invalid credentials');
      }
    } catch (error) {
      setError('Error connecting to server. Please try again.');
      console.error('Error:', error);
    }
  };

  const handleInitialize = async () => {
    if (!password) {
      setError('Please enter a password');
      return;
    }

    setIsInitializing(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/admin/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      const result = await response.json();

      if (response.ok) {
        setError('');
        alert('Admin account created! You can now login.');
        setPassword('');
      } else {
        setError(result.message || 'Error creating admin account');
      }
    } catch (error) {
      setError('Error connecting to server. Please try again.');
      console.error('Error:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>🎵 Admin Panel Login</h1>
        <div className="header-links">
          <a href="/judge" className="link-btn">Judge Panel</a>
        </div>
      </header>

      <div className="page">
        <h2>Admin Login</h2>
        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="admin-username">Username:</label>
            <input
              type="text"
              id="admin-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="admin-password">Password:</label>
            <input
              type="password"
              id="admin-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="submit-btn">Login</button>
          <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <p style={{ marginBottom: '10px', fontSize: '0.9em', color: '#666' }}>
              First time? Initialize admin account:
            </p>
            <button
              type="button"
              className="submit-btn"
              onClick={handleInitialize}
              disabled={isInitializing}
              style={{ background: '#27ae60', marginTop: '0' }}
            >
              {isInitializing ? 'Creating...' : 'Initialize Admin Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
