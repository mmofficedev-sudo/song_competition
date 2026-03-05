import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './JudgeScoring.css';

const API_BASE = '/api';

function JudgeScoring() {
  const [currentJudge, setCurrentJudge] = useState(null);
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scoredSongs, setScoredSongs] = useState(new Set());
  const [scores, setScores] = useState({
    entryExit: 0,
    lyricsAccuracy: 0,
    voiceHarmony: 0,
    performanceFlow: 0,
    audienceSupport: 0
  });
  const [reward, setReward] = useState('');
  const [currentScoreId, setCurrentScoreId] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastLoadedSongId, setLastLoadedSongId] = useState(null);
  const navigate = useNavigate();
  const lastConfigRef = useRef({ currentProgramOrder: null, currentCompetitionEvent: null });

  useEffect(() => {
    const savedJudge = localStorage.getItem('currentJudge');
    if (!savedJudge) {
      navigate('/judge');
      return;
    }
    const judge = JSON.parse(savedJudge);
    setCurrentJudge(judge);
    
    // Load songs function (uses config: current event + program order define current song)
    const loadSongs = async () => {
      try {
        const [songsRes, configRes] = await Promise.all([
          fetch(`${API_BASE}/songs`),
          fetch(`${API_BASE}/competition-config`)
        ]);
        const data = await songsRes.json();
        const config = configRes.ok ? await configRes.json() : {};
        const eventFilter = config.currentCompetitionEvent || '';

        let competitionSongs = data.filter(song => song.inCompetition);
        if (eventFilter) {
          competitionSongs = competitionSongs.filter(s => s.competitionEvent === eventFilter);
        }
        competitionSongs.sort((a, b) => (a.programOrder || 0) - (b.programOrder || 0));
        
        // Load which songs this judge has scored, then find first unscored song in program order
        const scoreResponse = await fetch(`${API_BASE}/scores/judge/${judge.name}`);
        const scoreData = await scoreResponse.json();
        const scored = new Set(scoreData.map(score => score.songId._id || score.songId));
        setScoredSongs(scored);
        
        const firstUnscoredIndex = competitionSongs.length > 0
          ? (() => { const i = competitionSongs.findIndex(s => !scored.has(s._id)); return i >= 0 ? i : competitionSongs.length - 1; })()
          : 0;
        const allScored = competitionSongs.length > 0 && competitionSongs.every(s => scored.has(s._id));
        
        const configChanged = 
          config.currentProgramOrder !== lastConfigRef.current.currentProgramOrder ||
          config.currentCompetitionEvent !== lastConfigRef.current.currentCompetitionEvent;
        
        if (configChanged && competitionSongs.length > 0) {
          lastConfigRef.current = {
            currentProgramOrder: config.currentProgramOrder,
            currentCompetitionEvent: config.currentCompetitionEvent
          };
          const displaySongId = competitionSongs[firstUnscoredIndex]._id;
          setCurrentIndex(firstUnscoredIndex);
          if (allScored) {
            setLastLoadedSongId(null);
          } else {
            setScores({
              entryExit: 0,
              lyricsAccuracy: 0,
              voiceHarmony: 0,
              performanceFlow: 0,
              audienceSupport: 0
            });
            setReward('');
            setCurrentScoreId(null);
            setLastLoadedSongId(displaySongId);
          }
        }
        
        setSongs(prevSongs => {
          const prevIds = prevSongs.map(s => s._id).join(',');
          const newIds = competitionSongs.map(s => s._id).join(',');
          const prevOrders = prevSongs.map(s => ({ id: s._id, order: s.programOrder })).join(',');
          const newOrders = competitionSongs.map(s => ({ id: s._id, order: s.programOrder })).join(',');
          const songsChanged = prevIds !== newIds || prevOrders !== newOrders;
          
          if (configChanged) {
            return competitionSongs;
          }
          if (songsChanged && prevSongs.length > 0) {
            const currentSongId = prevSongs[currentIndex]?._id;
            const newIndex = competitionSongs.findIndex(s => s._id === currentSongId);
            if (newIndex >= 0 && newIndex !== currentIndex) {
              setTimeout(() => setCurrentIndex(newIndex), 100);
            } else if (newIndex === -1 || currentIndex >= competitionSongs.length) {
              setTimeout(() => setCurrentIndex(firstUnscoredIndex), 100);
            }
          } else if (competitionSongs.length > 0 && prevSongs.length === 0) {
            setTimeout(() => setCurrentIndex(firstUnscoredIndex), 100);
          }
          
          return competitionSongs;
        });
      } catch (error) {
        console.error('Error loading songs:', error);
      }
    };
    
    // Initial load
    loadSongs();
    
    // Poll for updates every 3 seconds
    const pollInterval = setInterval(loadSongs, 3000);
    
    // Also check when window becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadSongs();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    // Don't load scores if we're currently submitting
    if (isSubmitting) return;
    
    if (songs.length > 0 && currentJudge) {
      const currentSong = songs[currentIndex];
      if (!currentSong) return;

      // Only load if we're on a different song
      if (lastLoadedSongId === currentSong._id) return;

      const loadExistingScore = async () => {
        try {
          const response = await fetch(`${API_BASE}/scores/song/${currentSong._id}`);
          const data = await response.json();
          const judgeScore = data.find(score => score.judgeName === currentJudge.name);
          
          if (judgeScore) {
            setScores({
              entryExit: judgeScore.criteria.entryExit,
              lyricsAccuracy: judgeScore.criteria.lyricsAccuracy,
              voiceHarmony: judgeScore.criteria.voiceHarmony,
              performanceFlow: judgeScore.criteria.performanceFlow,
              audienceSupport: judgeScore.criteria.audienceSupport
            });
            setReward(judgeScore.reward || '');
            setCurrentScoreId(judgeScore._id);
          } else {
            setScores({
              entryExit: 0,
              lyricsAccuracy: 0,
              voiceHarmony: 0,
              performanceFlow: 0,
              audienceSupport: 0
            });
            setReward('');
            setCurrentScoreId(null);
          }
          setLastLoadedSongId(currentSong._id);
        } catch (error) {
          console.error('Error loading existing score:', error);
        }
      };
      
      loadExistingScore();
    }
  }, [songs, currentIndex, currentJudge, isSubmitting, lastLoadedSongId]);


  const handleScoreChange = (criterion, value) => {
    // Value is already a number from the click handler
    setScores({ ...scores, [criterion]: value });
  };

  const totalScore = Object.values(scores).reduce((sum, score) => {
    const numScore = typeof score === 'number' ? score : 0;
    return sum + numScore;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (songs.length === 0) {
      showMessage('No songs available', 'error');
      return;
    }

    const currentSong = songs[currentIndex];
    if (!currentSong) return;

    setIsSubmitting(true);

    // Validate all scores are numbers between 0-5 (supporting decimals)
    const entryExit = typeof scores.entryExit === 'number' ? scores.entryExit : 0;
    const lyricsAccuracy = typeof scores.lyricsAccuracy === 'number' ? scores.lyricsAccuracy : 0;
    const voiceHarmony = typeof scores.voiceHarmony === 'number' ? scores.voiceHarmony : 0;
    const performanceFlow = typeof scores.performanceFlow === 'number' ? scores.performanceFlow : 0;
    const audienceSupport = typeof scores.audienceSupport === 'number' ? scores.audienceSupport : 0;

    const scoreData = {
      songId: currentSong._id,
      judgeName: currentJudge.name,
      criteria: {
        entryExit: Math.max(0, Math.min(5, entryExit)),
        lyricsAccuracy: Math.max(0, Math.min(5, lyricsAccuracy)),
        voiceHarmony: Math.max(0, Math.min(5, voiceHarmony)),
        performanceFlow: Math.max(0, Math.min(5, performanceFlow)),
        audienceSupport: Math.max(0, Math.min(5, audienceSupport))
      },
      reward: reward
    };

    try {
      const response = await fetch(`${API_BASE}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scoreData)
      });

      const result = await response.json();

      if (response.ok) {
        showMessage('Success!', 'success');
        setScoredSongs(new Set([...scoredSongs, currentSong._id]));
        
        // Update currentScoreId if it was a new score
        if (!currentScoreId && result._id) {
          setCurrentScoreId(result._id);
        }
        
        // Reload the score from server to ensure it's saved correctly
        try {
          const reloadResponse = await fetch(`${API_BASE}/scores/song/${currentSong._id}`);
          const reloadData = await reloadResponse.json();
          const reloadedScore = reloadData.find(score => score.judgeName === currentJudge.name);
          
          if (reloadedScore) {
            setScores({
              entryExit: reloadedScore.criteria.entryExit,
              lyricsAccuracy: reloadedScore.criteria.lyricsAccuracy,
              voiceHarmony: reloadedScore.criteria.voiceHarmony,
              performanceFlow: reloadedScore.criteria.performanceFlow,
              audienceSupport: reloadedScore.criteria.audienceSupport
            });
            setReward(reloadedScore.reward || '');
            setCurrentScoreId(reloadedScore._id);
            setLastLoadedSongId(currentSong._id);
          }
        } catch (reloadError) {
          console.error('Error reloading score:', reloadError);
        }
        
        setIsSubmitting(false);
        
        // Move to next song if available
        if (currentIndex < songs.length - 1) {
          setTimeout(() => {
            setCurrentIndex(currentIndex + 1);
          }, 1000);
        }
      } else {
        showMessage(result.message || 'Error submitting score', 'error');
        setIsSubmitting(false);
      }
    } catch (error) {
      showMessage('Error submitting score. Please try again.', 'error');
      console.error('Error:', error);
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < songs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentJudge');
    navigate('/judge');
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  if (!currentJudge) {
    return <div className="loading">Loading...</div>;
  }

  if (songs.length === 0) {
    return (
      <div className="container">
        <header>
          <h1>🎵 Judge Scoring Panel</h1>
          <div className="header-links">
            <a href="/admin" className="link-btn">Admin Panel</a>
          </div>
        </header>
        <div className="page">
          <div className="judge-info">
            <span>Logged in as: <strong>{currentJudge.name}</strong></span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
          <div className="loading">No songs in competition. Please wait for admin to add songs.</div>
        </div>
      </div>
    );
  }

  const currentSong = songs[currentIndex];
  const isScored = scoredSongs.has(currentSong._id);
  const progress = ((currentIndex + 1) / songs.length) * 100;

  return (
    <div className="container">
      <header>
        <h1>🎵 Judge Scoring Panel</h1>
        <div className="header-links">
          <a href="/admin" className="link-btn">Admin Panel</a>
        </div>
      </header>

      <div className="page">
        <div className="judge-info">
          <span>Logged in as: <strong>{currentJudge.name}</strong></span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-info">
            <span>Song {currentIndex + 1} of {songs.length}</span>
            {isScored && <span className="scored-badge">✓ Scored</span>}
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Current Song Info */}
        <div
          className="current-song-card"
          style={{
            '--card-bg-image': `url(${process.env.PUBLIC_URL || ''}/bg.jpg)`
          }}
        >
          <div className="song-order-badge">#{currentSong.programOrder || currentIndex + 1}</div>
          <div className="song-details">
            <h2>{currentSong.title}</h2>
            <p><strong>Competitor:</strong> {currentSong.singer || currentSong.artist || 'N/A'}</p>
            {currentSong.artist && <p><strong>Artist:</strong> {currentSong.artist}</p>}
          </div>
        </div>

        <form className="scoring-form" onSubmit={handleSubmit}>
          
          <div className="criteria-scoring">
            <h3>Scoring Criteria (0-5 points each, 0.5 increments)</h3>
            <div className="criterion">
              <label>(က) သီချင်း အဝင်/အထွက် မှန်/မမှန် (Entry/Exit Accuracy)</label>
              <div className="score-boxes">
                {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`score-box ${scores.entryExit === value ? 'active' : ''}`}
                    onClick={() => handleScoreChange('entryExit', value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div className="criterion">
              <label>(ခ) သီချင်းစာသား မှန်/မမှန် (Lyrics Accuracy)</label>
              <div className="score-boxes">
                {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`score-box ${scores.lyricsAccuracy === value ? 'active' : ''}`}
                    onClick={() => handleScoreChange('lyricsAccuracy', value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div className="criterion">
              <label>(ဂ) သီချင်းနှင့်သီဆိုသူ၏အသံ ဟန်ချက် ညီ/မညီ (Voice Harmony)</label>
              <div className="score-boxes">
                {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`score-box ${scores.voiceHarmony === value ? 'active' : ''}`}
                    onClick={() => handleScoreChange('voiceHarmony', value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div className="criterion">
              <label>(ဃ) သီချင်းသီဆိုမှုအပေါ် စီးမျောမှု ရှိ/မရှိ (Performance Flow)</label>
              <div className="score-boxes">
                {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`score-box ${scores.performanceFlow === value ? 'active' : ''}`}
                    onClick={() => handleScoreChange('performanceFlow', value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div className="criterion">
              <label>(င) ပရိတ်သတ်များ၏ အားပေးမှု (Audience Support)</label>
              <div className="score-boxes">
                {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`score-box ${scores.audienceSupport === value ? 'active' : ''}`}
                    onClick={() => handleScoreChange('audienceSupport', value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="total-score-display">
            <strong>Total Score: {totalScore.toFixed(1)} / 25</strong>
          </div>

          <div className="form-group">
            <label htmlFor="reward-text">Reward/Comment:</label>
            <textarea
              id="reward-text"
              rows="4"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              placeholder="Enter reward information or comments about the performance..."
            />
          </div>

          <div className="navigation-buttons">
            <button
              type="button"
              className="nav-btn prev-btn"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              ← Previous
            </button>
            <button type="submit" className="submit-btn">
              {isScored ? 'Update Score' : 'Submit Score'}
            </button>
            <button
              type="button"
              className="nav-btn next-btn"
              onClick={handleNext}
              disabled={currentIndex === songs.length - 1}
            >
              Next →
            </button>
          </div>
        </form>
      </div>

      {message.text && (
        <div className={`message ${message.type} show`}>
          <div className="message-box">{message.text}</div>
        </div>
      )}
    </div>
  );
}

export default JudgeScoring;
