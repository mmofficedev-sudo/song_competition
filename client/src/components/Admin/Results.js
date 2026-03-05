import React, { useState, useEffect } from 'react';
import './Results.css';

const API_BASE = '/api';

function Results() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: 'totalScore', direction: 'desc' });
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [filters, setFilters] = useState({
    title: '',
    singer: '',
    competitionGroup: '',
    competitionEvent: [], // multiple selected events
    totalScore: { operator: '=', value: '' },
    entryExit: { operator: '=', value: '' },
    lyricsAccuracy: { operator: '=', value: '' },
    voiceHarmony: { operator: '=', value: '' },
    performanceFlow: { operator: '=', value: '' },
    audienceSupport: { operator: '=', value: '' }
  });
  const [competitionEvents, setCompetitionEvents] = useState([]);

  useEffect(() => {
    loadResults();
    loadCompetitionConfig();
  }, []);

  const loadCompetitionConfig = async () => {
    try {
      const response = await fetch(`${API_BASE}/competition-config`);
      const data = await response.json();
      setCompetitionEvents(data.competitionEvents || []);
    } catch (error) {
      console.error('Error loading competition config:', error);
    }
  };

  const loadResults = async () => {
    try {
      const response = await fetch(`${API_BASE}/results/rankings`);
      const data = await response.json();
      setResults(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading results:', error);
      setLoading(false);
    }
  };

  const toggleRow = (songId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(songId)) {
      newExpanded.delete(songId);
    } else {
      newExpanded.add(songId);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCompetitionEventToggle = (eventName) => {
    setFilters(prev => {
      const current = prev.competitionEvent || [];
      const isSelected = current.includes(eventName);
      const next = isSelected ? current.filter(e => e !== eventName) : [...current, eventName];
      return { ...prev, competitionEvent: next };
    });
  };

  const handleNumericFilterChange = (key, field, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const getValue = (result, key) => {
    if (key === 'rank') {
      // For filtering, use the original rank from results array
      return (results.indexOf(result) + 1).toString();
    } else if (key === 'totalScore') {
      return result.totalScore;
    } else if (key.startsWith('totalCriteria.')) {
      const criteriaKey = key.replace('totalCriteria.', '');
      return result.totalCriteria[criteriaKey];
    } else if (['title', 'singer', 'competitionGroup', 'competitionEvent'].includes(key)) {
      return (result.song[key] || '').toString().toLowerCase();
    }
    return '';
  };

  const matchesFilter = (result) => {
    return Object.keys(filters).every(filterKey => {
      const filter = filters[filterKey];
      
      // Multiple selected events filter
      if (filterKey === 'competitionEvent' && Array.isArray(filter)) {
        if (filter.length === 0) return true;
        return filter.includes((result.song.competitionEvent || '').trim());
      }

      // Handle numeric filters with operators
      if (typeof filter === 'object' && filter !== null && filter.operator && filter.value !== undefined) {
        const filterValue = filter.value.trim();
        if (!filterValue) return true;

        const numericValue = parseFloat(filterValue);
        if (isNaN(numericValue)) return true;

        let resultValue;
        if (filterKey === 'totalScore') {
          resultValue = result.totalScore;
        } else if (filterKey === 'entryExit') {
          resultValue = result.totalCriteria.entryExit;
        } else if (filterKey === 'lyricsAccuracy') {
          resultValue = result.totalCriteria.lyricsAccuracy;
        } else if (filterKey === 'voiceHarmony') {
          resultValue = result.totalCriteria.voiceHarmony;
        } else if (filterKey === 'performanceFlow') {
          resultValue = result.totalCriteria.performanceFlow;
        } else if (filterKey === 'audienceSupport') {
          resultValue = result.totalCriteria.audienceSupport;
        } else {
          return true;
        }

        switch (filter.operator) {
          case '=':
            return resultValue === numericValue;
          case '>':
            return resultValue > numericValue;
          case '>=':
            return resultValue >= numericValue;
          case '<':
            return resultValue < numericValue;
          case '<=':
            return resultValue <= numericValue;
          default:
            return true;
        }
      } else {
        // Handle text filters
        const filterValue = filter.toLowerCase().trim();
        if (!filterValue) return true;

        const resultValue = getValue(result, filterKey).toString().toLowerCase();
        return resultValue.includes(filterValue);
      }
    });
  };

  const filteredResults = results.filter(matchesFilter);

  const selectedEvents = filters.competitionEvent || [];
  const selectedEventCount = selectedEvents.length;
  const aggregateByCompetitor = selectedEventCount > 1;

  // When multiple events selected: only show competitors who appear in ALL selected events (AND)
  const filteredResultsForMultiEvent = selectedEventCount > 1
    ? (() => {
        const competitorsByEvent = new Map();
        for (const eventName of selectedEvents) {
          const competitors = new Set(
            filteredResults
              .filter(r => (r.song?.competitionEvent || '').trim() === eventName)
              .map(r => (r.song?.singer || r.song?.artist || 'N/A').trim())
          );
          competitorsByEvent.set(eventName, competitors);
        }
        const firstSet = competitorsByEvent.get(selectedEvents[0]) || new Set();
        const inAllEvents = selectedEvents.reduce(
          (acc, eventName) => acc.filter(c => (competitorsByEvent.get(eventName) || new Set()).has(c)),
          Array.from(firstSet)
        );
        const inAllSet = new Set(inAllEvents);
        return filteredResults.filter(r =>
          inAllSet.has((r.song?.singer || r.song?.artist || 'N/A').trim())
        );
      })()
    : filteredResults;

  function aggregateResultsByCompetitor(filtered) {
    const bySinger = new Map();
    for (const result of filtered) {
      const key = (result.song.singer || result.song.artist || 'N/A').trim();
      if (!bySinger.has(key)) {
        bySinger.set(key, []);
      }
      bySinger.get(key).push(result);
    }
    return Array.from(bySinger.entries()).map(([singerKey, group]) => {
      const first = group[0];
      const totalScore = group.reduce((sum, r) => sum + (r.totalScore || 0), 0);
      const totalCriteria = {
        entryExit: group.reduce((s, r) => s + (r.totalCriteria?.entryExit || 0), 0),
        lyricsAccuracy: group.reduce((s, r) => s + (r.totalCriteria?.lyricsAccuracy || 0), 0),
        voiceHarmony: group.reduce((s, r) => s + (r.totalCriteria?.voiceHarmony || 0), 0),
        performanceFlow: group.reduce((s, r) => s + (r.totalCriteria?.performanceFlow || 0), 0),
        audienceSupport: group.reduce((s, r) => s + (r.totalCriteria?.audienceSupport || 0), 0)
      };
      const titles = [...new Set(group.map(r => r.song?.title).filter(Boolean))];
      const events = [...new Set(group.map(r => r.song?.competitionEvent).filter(Boolean))];
      const groups = [...new Set(group.map(r => r.song?.competitionGroup).filter(Boolean))];
      const song = {
        _id: `agg-${encodeURIComponent(singerKey)}`,
        title: titles.join(', '),
        singer: first.song?.singer || first.song?.artist || 'N/A',
        artist: first.song?.artist || '',
        competitionGroup: groups.join(', '),
        competitionEvent: events.join(', ')
      };
      const judgeRewards = group.flatMap(r =>
        (r.judgeRewards || []).map(jr => ({ ...jr, event: r.song?.competitionEvent || '' }))
      );
      return {
        song,
        totalScore,
        totalCriteria,
        judgeRewards,
        isAggregated: true
      };
    });
  }

  const resultsToShow = aggregateByCompetitor
    ? aggregateResultsByCompetitor(filteredResultsForMultiEvent)
    : filteredResults;

  const sortedResults = [...resultsToShow].sort((a, b) => {
    if (sortConfig.key === 'rank') {
      const aIndex = resultsToShow.indexOf(a);
      const bIndex = resultsToShow.indexOf(b);
      return sortConfig.direction === 'asc' ? aIndex - bIndex : bIndex - aIndex;
    } else if (sortConfig.key === 'totalScore' || sortConfig.key.startsWith('totalCriteria.')) {
      const aValue = sortConfig.key.startsWith('totalCriteria.') 
        ? a.totalCriteria[sortConfig.key.replace('totalCriteria.', '')]
        : a[sortConfig.key];
      const bValue = sortConfig.key.startsWith('totalCriteria.')
        ? b.totalCriteria[sortConfig.key.replace('totalCriteria.', '')]
        : b[sortConfig.key];
      
      if (sortConfig.direction === 'asc') {
        return aValue - bValue;
      }
      return bValue - aValue;
    } else if (['title', 'singer', 'competitionGroup', 'competitionEvent'].includes(sortConfig.key)) {
      const aValue = (a.song[sortConfig.key] || '').toString();
      const bValue = (b.song[sortConfig.key] || '').toString();
      
      if (sortConfig.direction === 'asc') {
        return aValue.localeCompare(bValue);
      }
      return bValue.localeCompare(aValue);
    }
    return 0;
  });

  const handleCellClick = (songId, field, currentValue) => {
    setEditingCell({ songId, field });
    setEditValue(currentValue || '');
  };

  const handleCellBlur = async (songId, field) => {
    if (editingCell && editingCell.songId === songId && editingCell.field === field) {
      // Update the song in the database
      try {
        const response = await fetch(`${API_BASE}/songs/${songId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: editValue.trim() })
        });

        if (response.ok) {
          const updatedSong = await response.json();
          // Update local state with the full updated song
          setResults(prevResults => 
            prevResults.map(result => 
              result.song._id === songId
                ? { ...result, song: updatedSong }
                : result
            )
          );
        } else {
          const errorData = await response.json();
          console.error('Error updating song:', errorData.message || 'Unknown error');
          alert('Failed to save: ' + (errorData.message || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error updating song:', error);
        alert('Failed to save changes. Please try again.');
      }
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleCellKeyDown = (e, songId, field) => {
    if (e.key === 'Enter') {
      handleCellBlur(songId, field);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '⇅';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="page">
        <h2>Competition Results</h2>
        <div className="loading">Loading results...</div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="page">
        <h2>Competition Results</h2>
        <div className="loading">No results yet. Scores need to be submitted first.</div>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Competition Results</h2>
      <div className="table-container">
        <table className="results-table interactive-table">
          <thead>
            <tr>
              <th>
                <div className="header-content">
                  <span>No.</span>
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('title')}>
                <div className="header-content">
                  <span>Song Title {getSortIcon('title')}</span>
                </div>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Filter Title..."
                  value={filters.title}
                  onChange={(e) => handleFilterChange('title', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </th>
              <th className="sortable" onClick={() => handleSort('singer')}>
                <div className="header-content">
                  <span>Competitor {getSortIcon('singer')}</span>
                </div>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Filter Competitor..."
                  value={filters.singer}
                  onChange={(e) => handleFilterChange('singer', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </th>
              <th className="sortable" onClick={() => handleSort('competitionGroup')}>
                <div className="header-content">
                  <span>Competition Group {getSortIcon('competitionGroup')}</span>
                </div>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Filter Group..."
                  value={filters.competitionGroup}
                  onChange={(e) => handleFilterChange('competitionGroup', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </th>
              <th className="sortable" onClick={() => handleSort('competitionEvent')}>
                <div className="header-content">
                  <span>Competition Event {getSortIcon('competitionEvent')}</span>
                </div>
                <div className="filter-events-multi" onClick={(e) => e.stopPropagation()}>
                  <span className="filter-events-label">Filter by event(s)</span>
                  {competitionEvents.length === 0 ? (
                    <span className="filter-events-hint">Loading events...</span>
                  ) : (
                    <div className="filter-events-checkboxes">
                      {competitionEvents.map(event => (
                        <label key={event} className="filter-event-chip">
                          <input
                            type="checkbox"
                            checked={(filters.competitionEvent || []).includes(event)}
                            onChange={() => handleCompetitionEventToggle(event)}
                          />
                          <span>{event}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {(filters.competitionEvent || []).length > 0 && (
                    <button
                      type="button"
                      className="clear-events-filter"
                      onClick={() => setFilters(prev => ({ ...prev, competitionEvent: [] }))}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('totalScore')}>
                <div className="header-content">
                  <span>Total Score {getSortIcon('totalScore')}</span>
                </div>
                <div className="numeric-filter">
                  <select
                    className="filter-operator"
                    value={filters.totalScore.operator}
                    onChange={(e) => handleNumericFilterChange('totalScore', 'operator', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="=">=</option>
                    <option value=">">&gt;</option>
                    <option value=">=">&gt;=</option>
                    <option value="<">&lt;</option>
                    <option value="<=">&lt;=</option>
                  </select>
                  <input
                    type="number"
                    className="filter-input numeric"
                    placeholder="Value..."
                    value={filters.totalScore.value}
                    onChange={(e) => handleNumericFilterChange('totalScore', 'value', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('totalCriteria.entryExit')}>
                <div className="header-content">
                  <span>Entry/Exit {getSortIcon('totalCriteria.entryExit')}</span>
                </div>
                <div className="numeric-filter">
                  <select
                    className="filter-operator"
                    value={filters.entryExit.operator}
                    onChange={(e) => handleNumericFilterChange('entryExit', 'operator', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="=">=</option>
                    <option value=">">&gt;</option>
                    <option value=">=">&gt;=</option>
                    <option value="<">&lt;</option>
                    <option value="<=">&lt;=</option>
                  </select>
                  <input
                    type="number"
                    className="filter-input numeric"
                    placeholder="Value..."
                    value={filters.entryExit.value}
                    onChange={(e) => handleNumericFilterChange('entryExit', 'value', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('totalCriteria.lyricsAccuracy')}>
                <div className="header-content">
                  <span>Lyrics {getSortIcon('totalCriteria.lyricsAccuracy')}</span>
                </div>
                <div className="numeric-filter">
                  <select
                    className="filter-operator"
                    value={filters.lyricsAccuracy.operator}
                    onChange={(e) => handleNumericFilterChange('lyricsAccuracy', 'operator', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="=">=</option>
                    <option value=">">&gt;</option>
                    <option value=">=">&gt;=</option>
                    <option value="<">&lt;</option>
                    <option value="<=">&lt;=</option>
                  </select>
                  <input
                    type="number"
                    className="filter-input numeric"
                    placeholder="Value..."
                    value={filters.lyricsAccuracy.value}
                    onChange={(e) => handleNumericFilterChange('lyricsAccuracy', 'value', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('totalCriteria.voiceHarmony')}>
                <div className="header-content">
                  <span>Voice Harmony {getSortIcon('totalCriteria.voiceHarmony')}</span>
                </div>
                <div className="numeric-filter">
                  <select
                    className="filter-operator"
                    value={filters.voiceHarmony.operator}
                    onChange={(e) => handleNumericFilterChange('voiceHarmony', 'operator', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="=">=</option>
                    <option value=">">&gt;</option>
                    <option value=">=">&gt;=</option>
                    <option value="<">&lt;</option>
                    <option value="<=">&lt;=</option>
                  </select>
                  <input
                    type="number"
                    className="filter-input numeric"
                    placeholder="Value..."
                    value={filters.voiceHarmony.value}
                    onChange={(e) => handleNumericFilterChange('voiceHarmony', 'value', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('totalCriteria.performanceFlow')}>
                <div className="header-content">
                  <span>Performance Flow {getSortIcon('totalCriteria.performanceFlow')}</span>
                </div>
                <div className="numeric-filter">
                  <select
                    className="filter-operator"
                    value={filters.performanceFlow.operator}
                    onChange={(e) => handleNumericFilterChange('performanceFlow', 'operator', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="=">=</option>
                    <option value=">">&gt;</option>
                    <option value=">=">&gt;=</option>
                    <option value="<">&lt;</option>
                    <option value="<=">&lt;=</option>
                  </select>
                  <input
                    type="number"
                    className="filter-input numeric"
                    placeholder="Value..."
                    value={filters.performanceFlow.value}
                    onChange={(e) => handleNumericFilterChange('performanceFlow', 'value', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('totalCriteria.audienceSupport')}>
                <div className="header-content">
                  <span>Audience Support {getSortIcon('totalCriteria.audienceSupport')}</span>
                </div>
                <div className="numeric-filter">
                  <select
                    className="filter-operator"
                    value={filters.audienceSupport.operator}
                    onChange={(e) => handleNumericFilterChange('audienceSupport', 'operator', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="=">=</option>
                    <option value=">">&gt;</option>
                    <option value=">=">&gt;=</option>
                    <option value="<">&lt;</option>
                    <option value="<=">&lt;=</option>
                  </select>
                  <input
                    type="number"
                    className="filter-input numeric"
                    placeholder="Value..."
                    value={filters.audienceSupport.value}
                    onChange={(e) => handleNumericFilterChange('audienceSupport', 'value', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </th>              
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result, index) => {
              const isExpanded = expandedRows.has(result.song._id);
              const originalIndex = index;
              const displayNumber = index + 1;
              const isAggregated = result.isAggregated === true;
              return (
                <React.Fragment key={result.song._id}>
                  <tr className={originalIndex < 3 ? `rank-${originalIndex + 1}-row` : ''}>
                    <td className="rank-cell no-column">
                      <div className="rank-container">
                        
                        <button
                          className="expand-btn"
                          onClick={() => toggleRow(result.song._id)}
                          title={isExpanded ? 'Collapse details' : 'Expand details'}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                        <span className={`rank-badge ${originalIndex < 3 ? `rank-${originalIndex + 1}` : ''}`}>
                          {displayNumber}
                        </span>
                      </div>
                    </td>
                    <td><strong>{result.song.title}</strong></td>
                    <td>{result.song.singer || result.song.artist || 'N/A'}</td>
                    <td 
                      className={isAggregated ? '' : 'editable-cell'}
                      onClick={!isAggregated ? () => handleCellClick(result.song._id, 'competitionGroup', result.song.competitionGroup) : undefined}
                      onBlur={!isAggregated ? () => handleCellBlur(result.song._id, 'competitionGroup') : undefined}
                    >
                      {!isAggregated && editingCell && editingCell.songId === result.song._id && editingCell.field === 'competitionGroup' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => handleCellKeyDown(e, result.song._id, 'competitionGroup')}
                          autoFocus
                          className="cell-input"
                        />
                      ) : (
                        result.song.competitionGroup || <span className="empty-cell">{isAggregated ? '' : 'Click to edit'}</span>
                      )}
                    </td>
                    <td 
                      className={isAggregated ? '' : 'editable-cell'}
                      onClick={!isAggregated ? () => handleCellClick(result.song._id, 'competitionEvent', result.song.competitionEvent) : undefined}
                      onBlur={!isAggregated ? () => handleCellBlur(result.song._id, 'competitionEvent') : undefined}
                    >
                      {!isAggregated && editingCell && editingCell.songId === result.song._id && editingCell.field === 'competitionEvent' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => handleCellKeyDown(e, result.song._id, 'competitionEvent')}
                          autoFocus
                          className="cell-input"
                        />
                      ) : (
                        result.song.competitionEvent || <span className="empty-cell">{isAggregated ? '' : 'Click to edit'}</span>
                      )}
                    </td>
                    <td className="cell-total-score"><strong>{result.totalScore}</strong></td>
                    <td className="cell-criterion">{result.totalCriteria.entryExit}</td>
                    <td className="cell-criterion">{result.totalCriteria.lyricsAccuracy}</td>
                    <td className="cell-criterion">{result.totalCriteria.voiceHarmony}</td>
                    <td className="cell-criterion">{result.totalCriteria.performanceFlow}</td>
                    <td className="cell-criterion">{result.totalCriteria.audienceSupport}</td>
                    
                  </tr>
                  {isExpanded && (
                    <tr className="expanded-row">
                      <td colSpan="11">
                        <div className="expanded-content">
                          <h4>Individual Judge Scores{isAggregated ? ' (all events)' : ''}</h4>
                          <div className="judge-scores-grid">
                            {result.judgeRewards && result.judgeRewards.length > 0 ? (
                              result.judgeRewards.map((jr, idx) => (
                                <div key={idx} className="judge-score-card">
                                  <div className="judge-score-header">
                                    <strong>{jr.judgeName}</strong>
                                    {jr.event ? <span className="judge-event-tag">{jr.event}</span> : null}
                                    <span className="judge-total-score">Total: {jr.totalScore}/25</span>
                                  </div>
                                  <div className="judge-criteria">
                                    <div className="criteria-item">
                                      <span className="criteria-label">Entry/Exit:</span>
                                      <span className="criteria-value">{jr.criteria?.entryExit || 'N/A'}</span>
                                    </div>
                                    <div className="criteria-item">
                                      <span className="criteria-label">Lyrics:</span>
                                      <span className="criteria-value">{jr.criteria?.lyricsAccuracy || 'N/A'}</span>
                                    </div>
                                    <div className="criteria-item">
                                      <span className="criteria-label">Voice Harmony:</span>
                                      <span className="criteria-value">{jr.criteria?.voiceHarmony || 'N/A'}</span>
                                    </div>
                                    <div className="criteria-item">
                                      <span className="criteria-label">Performance Flow:</span>
                                      <span className="criteria-value">{jr.criteria?.performanceFlow || 'N/A'}</span>
                                    </div>
                                    <div className="criteria-item">
                                      <span className="criteria-label">Audience Support:</span>
                                      <span className="criteria-value">{jr.criteria?.audienceSupport || 'N/A'}</span>
                                    </div>
                                  </div>
                                  <div className="judge-reward">
                                    <strong>Reward/Comment:</strong>
                                    <p>{jr.reward || 'No reward specified'}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p>No judge scores available</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Results;
