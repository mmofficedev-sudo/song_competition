import React, { useState, useEffect } from 'react';
import './ManageSongs.css';

const API_BASE = '/api';

function ManageSongs() {
  const [songs, setSongs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [competitionGroups, setCompetitionGroups] = useState([]);
  const [competitionEvents, setCompetitionEvents] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    singer: '',
    competitionGroup: '',
    competitionEvent: '',
    programOrder: 0,
    inCompetition: true
  });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadSongs();
    loadCompetitionConfig();
  }, []);

  const loadCompetitionConfig = async () => {
    try {
      const response = await fetch(`${API_BASE}/competition-config`);
      const data = await response.json();
      setCompetitionGroups(data.competitionGroups || []);
      setCompetitionEvents(data.competitionEvents || []);
    } catch (error) {
      console.error('Error loading competition config:', error);
    }
  };

  const loadSongs = async () => {
    try {
      const response = await fetch(`${API_BASE}/songs`);
      const data = await response.json();
      setSongs(data);
    } catch (error) {
      console.error('Error loading songs:', error);
    }
  };

  const handleOpenModal = (song = null) => {
    if (song) {
      setEditingSong(song._id);
      setFormData({
        title: song.title || '',
        artist: song.artist || '',
        singer: song.singer || '',
        competitionGroup: song.competitionGroup || '',
        competitionEvent: song.competitionEvent || '',
        programOrder: song.programOrder || 0,
        inCompetition: true
      });
    } else {
      setEditingSong(null);
      setFormData({
        title: '',
        artist: '',
        singer: '',
        competitionGroup: '',
        competitionEvent: '',
        programOrder: 0,
        inCompetition: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSong(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingSong ? `${API_BASE}/songs/${editingSong}` : `${API_BASE}/songs`;
      const method = editingSong ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        showMessage('Success!', 'success');
        handleCloseModal();
        loadSongs();
      } else {
        showMessage(result.message || 'Error saving song', 'error');
      }
    } catch (error) {
      showMessage('Error saving song. Please try again.', 'error');
      console.error('Error:', error);
    }
  };

  const handleDelete = async (songId) => {
    if (!window.confirm('Are you sure you want to delete this song? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/songs/${songId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showMessage('Success!', 'success');
        loadSongs();
      } else {
        const result = await response.json();
        showMessage(result.message || 'Error deleting song', 'error');
      }
    } catch (error) {
      showMessage('Error deleting song. Please try again.', 'error');
      console.error('Error:', error);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Manage Songs</h2>
        <button className="add-btn" onClick={() => handleOpenModal()}>+ Add New Song</button>
      </div>

      {showModal && (
        <div className="modal" onClick={(e) => e.target.className === 'modal' && handleCloseModal()}>
          <div className="modal-content">
            <span className="close" onClick={handleCloseModal}>&times;</span>
            <h3>{editingSong ? 'Edit Song' : 'Add New Song'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Competitor *</label>
                <input
                  type="text"
                  value={formData.singer}
                  onChange={(e) => setFormData({ ...formData, singer: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Artist *</label>
                <input
                  type="text"
                  value={formData.artist}
                  onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Competition Group</label>
                <select
                  value={formData.competitionGroup}
                  onChange={(e) => setFormData({ ...formData, competitionGroup: e.target.value })}
                >
                  <option value="">-- Select Group --</option>
                  {competitionGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Competition Event</label>
                <select
                  value={formData.competitionEvent}
                  onChange={(e) => setFormData({ ...formData, competitionEvent: e.target.value })}
                >
                  <option value="">-- Select Event --</option>
                  {competitionEvents.map(event => (
                    <option key={event} value={event}>{event}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Program Order</label>
                <input
                  type="number"
                  value={formData.programOrder}
                  onChange={(e) => setFormData({ ...formData, programOrder: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">Save Song</button>
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="songs-grid">
        {songs.length === 0 ? (
          <div className="loading">No songs found. Click "Add New Song" to add one.</div>
        ) : (
          songs.map(song => (
            <div key={song._id} className="song-card">
              <h3>{song.title}</h3>
              <p><strong>Artist:</strong> {song.artist || 'N/A'}</p>
              <p><strong>Competitor:</strong> {song.singer || 'N/A'}</p>
              {song.competitionGroup && <p><strong>Competition Group:</strong> {song.competitionGroup}</p>}
              {song.competitionEvent && <p><strong>Competition Event:</strong> {song.competitionEvent}</p>}
              <p><strong>Program Order:</strong> {song.programOrder || 'Not set'}</p>
              <div className="song-actions">
                <button className="action-btn edit-btn" onClick={() => handleOpenModal(song)}>Edit</button>
                <button className="action-btn delete-btn" onClick={() => handleDelete(song._id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {message.text && (
        <div className={`message ${message.type} show`}>
          <div className="message-box">{message.text}</div>
        </div>
      )}
    </div>
  );
}

export default ManageSongs;
