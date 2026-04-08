import React, { useState, useEffect, useMemo } from 'react';
import './ProgramOrder.css';

const API_BASE = '/api';

function ProgramOrder() {
  const [allSongs, setAllSongs] = useState([]);
  const [competitionEvents, setCompetitionEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [currentCompetitionEvent, setCurrentCompetitionEvent] = useState('');
  const [currentProgramOrder, setCurrentProgramOrder] = useState(1);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [draggedSong, setDraggedSong] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const competitionSongsForEvent = useMemo(() => {
    if (!selectedEvent) return [];
    const ev = String(selectedEvent).trim();
    const forEvent = allSongs.filter(
      s => s.inCompetition && String(s.competitionEvent || '').trim() === ev
    );
    return forEvent.sort((a, b) => (a.programOrder || 0) - (b.programOrder || 0));
  }, [allSongs, selectedEvent]);

  const [eventSongs, setEventSongs] = useState([]);
  useEffect(() => {
    setEventSongs(competitionSongsForEvent);
  }, [competitionSongsForEvent, selectedEvent]);

  const competitionSongs = selectedEvent ? eventSongs : [];

  useEffect(() => {
    loadSongs();
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch(`${API_BASE}/competition-config`);
      const data = await response.json();
      const events = data.competitionEvents || [];
      setCompetitionEvents(events);
      setCurrentCompetitionEvent(data.currentCompetitionEvent || '');
      setCurrentProgramOrder(data.currentProgramOrder != null ? data.currentProgramOrder : 1);
      setSelectedEvent(prev => prev || data.currentCompetitionEvent || events[0] || '');
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const loadSongs = async () => {
    try {
      const response = await fetch(`${API_BASE}/songs`);
      const data = await response.json();
      setAllSongs(data.filter(song => song.inCompetition));
    } catch (error) {
      console.error('Error loading songs:', error);
    }
  };

  const handleDragStart = (e, song, index) => {
    setDraggedSong({ song, index });
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedSong(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (!draggedSong) return;

    const { song, index: sourceIndex } = draggedSong;

    if (sourceIndex === dropIndex) {
      setDraggedSong(null);
      setDragOverIndex(null);
      return;
    }

    const newSongs = [...competitionSongs];
    newSongs.splice(sourceIndex, 1);
    newSongs.splice(dropIndex, 0, song);
    setEventSongs(newSongs);
    
    setDraggedSong(null);
    setDragOverIndex(null);
  };

  const moveUp = (index) => {
    if (index > 0) {
      const newSongs = [...competitionSongs];
      [newSongs[index], newSongs[index - 1]] = [newSongs[index - 1], newSongs[index]];
      setEventSongs(newSongs);
    }
  };

  const moveDown = (index) => {
    if (index < competitionSongs.length - 1) {
      const newSongs = [...competitionSongs];
      [newSongs[index], newSongs[index + 1]] = [newSongs[index + 1], newSongs[index]];
      setEventSongs(newSongs);
    }
  };

  const handleSave = async () => {
    // Update competition songs with their new order
    const updates = competitionSongs.map((song, index) => ({
      id: song._id,
      inCompetition: true,
      programOrder: index + 1
    }));

    try {
      const eventToSave = selectedEvent ? String(selectedEvent).trim() : '';
      const promises = updates.map(update =>
        fetch(`${API_BASE}/songs/${update.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inCompetition: update.inCompetition,
            programOrder: update.programOrder,
            ...(eventToSave ? { competitionEvent: eventToSave } : {})
          })
        })
      );

      await Promise.all(promises);

      // Set current song to first in list for this event (program order 1)
      if (selectedEvent && competitionSongs.length > 0) {
        const currentRes = await fetch(`${API_BASE}/competition-config/current-song`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentCompetitionEvent: selectedEvent,
            currentProgramOrder: 1
          })
        });
        if (currentRes.ok) {
          const data = await currentRes.json();
          setCurrentCompetitionEvent(data.currentCompetitionEvent || '');
          setCurrentProgramOrder(data.currentProgramOrder != null ? data.currentProgramOrder : 1);
        }
      }

      showMessage('Success!', 'success');
      loadSongs();
      loadConfig();
    } catch (error) {
      showMessage('Error saving program order', 'error');
      console.error('Error:', error);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const clearJudgeEventFilter = async () => {
    try {
      const res = await fetch(`${API_BASE}/competition-config/current-song`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentCompetitionEvent: '' })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentCompetitionEvent(data.currentCompetitionEvent || '');
        showMessage('Judges will now see all in-competition songs (not filtered by event).', 'success');
      } else {
        showMessage('Could not clear event filter', 'error');
      }
    } catch (e) {
      showMessage('Could not clear event filter', 'error');
      console.error(e);
    }
  };

  const isCurrentSong = (index) =>
    selectedEvent === currentCompetitionEvent && (index + 1) === currentProgramOrder;

  return (
    <div className="page">
      <h2>Program Order - Current Competition</h2>
      <p className="info-text">Select a Competition Event, then drag and drop to reorder. Click &quot;Save Program Order&quot; to save the order and set the first song as the current song for judges.</p>

      <div className="program-order-event-row">
        <label htmlFor="program-order-event">Competition Event</label>
        <select
          id="program-order-event"
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
        >
          <option value="">— Select event —</option>
          {competitionEvents.map(event => (
            <option key={event} value={event}>{event}</option>
          ))}
        </select>
        {currentCompetitionEvent ? (
          <span className="current-song-label" title="Judges only see songs for this event">
            Judges active event: <strong>{currentCompetitionEvent}</strong> (song #{currentProgramOrder})
          </span>
        ) : (
          <span className="current-song-label">Judges see all in-competition songs (no event filter).</span>
        )}
        <button
          type="button"
          className="submit-btn secondary-btn"
          onClick={clearJudgeEventFilter}
          disabled={!currentCompetitionEvent}
          title="If judges see no songs, the active event may not match your songs—clear to show every in-competition song"
        >
          Clear judge event filter
        </button>
      </div>
      
      <div className="program-list">
        {!selectedEvent ? (
          <div className="empty-section">
            <p>Select a Competition Event to view and edit program order.</p>
          </div>
        ) : competitionSongs.length === 0 ? (
          <div className="empty-section">
            <p>No songs in competition for this event. Add songs in &quot;Manage Songs&quot; with this event and set &quot;inCompetition&quot;.</p>
          </div>
        ) : (
          competitionSongs.map((song, index) => (
            <div
              key={song._id}
              className={`program-item ${isCurrentSong(index) ? 'current-song-item' : ''} ${draggedSong?.song._id === song._id ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, song, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div className="drag-handle">☰</div>
              <div className="program-order">{index + 1}</div>
              <div className="program-info">
                <h3>{song.title}</h3>
                <p>{song.singer || song.artist || 'N/A'}</p>
              </div>
              <div className="program-controls">
                <button
                  className="order-btn"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  style={{ opacity: index === 0 ? 0.5 : 1 }}
                >
                  ↑
                </button>
                <button
                  className="order-btn"
                  onClick={() => moveDown(index)}
                  disabled={index === competitionSongs.length - 1}
                  style={{ opacity: index === competitionSongs.length - 1 ? 0.5 : 1 }}
                >
                  ↓
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      <button className="submit-btn" onClick={handleSave} style={{ marginTop: '20px' }} disabled={!selectedEvent}>
        Save Program Order
      </button>

      {message.text && (
        <div className={`message ${message.type} show`}>
          <div className="message-box">{message.text}</div>
        </div>
      )}
    </div>
  );
}

export default ProgramOrder;
