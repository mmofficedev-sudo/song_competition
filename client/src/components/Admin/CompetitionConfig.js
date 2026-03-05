import React, { useState, useEffect } from 'react';
import './CompetitionConfig.css';

const API_BASE = '/api';

function CompetitionConfig() {
  const [competitionGroups, setCompetitionGroups] = useState([]);
  const [competitionEvents, setCompetitionEvents] = useState([]);
  const [newGroup, setNewGroup] = useState('');
  const [newEvent, setNewEvent] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch(`${API_BASE}/competition-config`);
      const data = await response.json();
      setCompetitionGroups(data.competitionGroups || []);
      setCompetitionEvents(data.competitionEvents || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading config:', error);
      setLoading(false);
    }
  };

  const handleAddGroup = () => {
    if (newGroup.trim() && !competitionGroups.includes(newGroup.trim())) {
      const updated = [...competitionGroups, newGroup.trim()];
      setCompetitionGroups(updated);
      setNewGroup('');
      saveConfig(updated, competitionEvents);
    }
  };

  const handleAddEvent = () => {
    if (newEvent.trim() && !competitionEvents.includes(newEvent.trim())) {
      const updated = [...competitionEvents, newEvent.trim()];
      setCompetitionEvents(updated);
      setNewEvent('');
      saveConfig(competitionGroups, updated);
    }
  };

  const handleRemoveGroup = (group) => {
    const updated = competitionGroups.filter(g => g !== group);
    setCompetitionGroups(updated);
    saveConfig(updated, competitionEvents);
  };

  const handleRemoveEvent = (event) => {
    const updated = competitionEvents.filter(e => e !== event);
    setCompetitionEvents(updated);
    saveConfig(competitionGroups, updated);
  };

  const handleKeyPress = (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'group') {
        handleAddGroup();
      } else {
        handleAddEvent();
      }
    }
  };

  const saveConfig = async (groups, events) => {
    try {
      const response = await fetch(`${API_BASE}/competition-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionGroups: groups,
          competitionEvents: events
        })
      });

      if (response.ok) {
        showMessage('Success!', 'success');
      } else {
        const result = await response.json();
        showMessage(result.message || 'Error saving configuration', 'error');
      }
    } catch (error) {
      showMessage('Error saving configuration. Please try again.', 'error');
      console.error('Error:', error);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  if (loading) {
    return (
      <div className="page">
        <h2>Predefine Group and Event</h2>
        <div className="loading">Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Predefine Group and Event</h2>
      <p className="info-text">Manage the predefined Competition Groups and Events that can be selected when adding or editing songs.</p>

      <div className="config-sections">
        {/* Competition Groups Section */}
        <div className="config-section">
          <h3>Competition Groups</h3>
          <div className="add-item-form">
            <input
              type="text"
              className="item-input"
              placeholder="Enter new group name (e.g., Group A)"
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'group')}
            />
            <button className="add-item-btn" onClick={handleAddGroup}>
              + Add Group
            </button>
          </div>
          <div className="items-list">
            {competitionGroups.length === 0 ? (
              <p className="empty-message">No groups defined. Add a group above.</p>
            ) : (
              competitionGroups.map((group, index) => (
                <div key={index} className="item-card">
                  <span className="item-name">{group}</span>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveGroup(group)}
                    title="Remove group"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Competition Events Section */}
        <div className="config-section">
          <h3>Competition Events</h3>
          <div className="add-item-form">
            <input
              type="text"
              className="item-input"
              placeholder="Enter new event name (e.g., Event 1)"
              value={newEvent}
              onChange={(e) => setNewEvent(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'event')}
            />
            <button className="add-item-btn" onClick={handleAddEvent}>
              + Add Event
            </button>
          </div>
          <div className="items-list">
            {competitionEvents.length === 0 ? (
              <p className="empty-message">No events defined. Add an event above.</p>
            ) : (
              competitionEvents.map((event, index) => (
                <div key={index} className="item-card">
                  <span className="item-name">{event}</span>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveEvent(event)}
                    title="Remove event"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type} show`}>
          <div className="message-box">{message.text}</div>
        </div>
      )}
    </div>
  );
}

export default CompetitionConfig;
