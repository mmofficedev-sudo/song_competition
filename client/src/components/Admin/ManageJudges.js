import React, { useState, useEffect } from 'react';
import './ManageJudges.css';

const API_BASE = '/api';

function ManageJudges() {
  const [judges, setJudges] = useState([]);
  const [judgeCount, setJudgeCount] = useState(5);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadJudges();
  }, []);

  const loadJudges = async () => {
    try {
      const response = await fetch(`${API_BASE}/judges`);
      const data = await response.json();
      setJudges(data);
    } catch (error) {
      console.error('Error loading judges:', error);
    }
  };

  const handleCreateJudges = async () => {
    if (!judgeCount || judgeCount < 1 || judgeCount > 50) {
      showMessage('Please enter a valid judge count (1-50)', 'error');
      return;
    }

    if (!window.confirm(`This will create ${judgeCount} judges (judge1, judge2, ..., judge${judgeCount}). Existing judges will be deleted. Continue?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/judges/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ count: judgeCount })
      });

      const result = await response.json();

      if (response.ok) {
        showMessage('Success!', 'success');
        const passwordList = result.passwords.map(p => `${p.name}: ${p.password}`).join('\n');
        alert(`Judges created!\n\nPasswords:\n${passwordList}\n\nPlease save these passwords.`);
        loadJudges();
      } else {
        showMessage(result.message || 'Error creating judges', 'error');
      }
    } catch (error) {
      showMessage('Error creating judges. Please try again.', 'error');
      console.error('Error:', error);
    }
  };

  const handleChangePassword = async (judgeId, judgeName) => {
    const newPassword = window.prompt(`Enter new password for ${judgeName}:`);
    if (!newPassword) return;

    try {
      const response = await fetch(`${API_BASE}/judges/${judgeId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: newPassword })
      });

      const result = await response.json();

      if (response.ok) {
        showMessage('Success!', 'success');
        loadJudges();
      } else {
        showMessage(result.message || 'Error updating password', 'error');
      }
    } catch (error) {
      showMessage('Error updating password. Please try again.', 'error');
      console.error('Error:', error);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  return (
    <div className="page">
      <h2>Manage Judges</h2>
      
      <div className="judge-setup">
        <h3>Create Judges</h3>
        <div className="form-group">
          <label htmlFor="judge-count">Number of Judges:</label>
          <input
            type="number"
            id="judge-count"
            min="1"
            max="50"
            value={judgeCount}
            onChange={(e) => setJudgeCount(parseInt(e.target.value) || 5)}
          />
        </div>
        <button className="submit-btn" onClick={handleCreateJudges}>Create Judges</button>
      </div>

      {judges.length > 0 && (
        <div className="judges-section">
          <h3 style={{ marginTop: '30px' }}>Existing Judges ({judges.length})</h3>
          <div className="judges-grid">
            {judges.map(judge => (
              <div key={judge._id} className="judge-card">
                <h4>{judge.name}</h4>
                <p>ID: {judge._id}</p>
                <button
                  className="action-btn edit-btn"
                  onClick={() => handleChangePassword(judge._id, judge.name)}
                >
                  Change Password
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {message.text && (
        <div className={`message ${message.type} show`}>
          <div className="message-box">{message.text}</div>
        </div>
      )}
    </div>
  );
}

export default ManageJudges;
