import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LearningMusical() {
  const navigate = useNavigate();
  const [currentTrack, setCurrentTrack] = useState(null);

  const tracks = [
    { id: 'audio8.mpeg', title: 'Energetic Music', icon: '⚡' },
    { id: 'audio9.mpeg', title: 'Lofi Music', icon: '🌙' },
    { id: 'audio10.mpeg', title: 'Casual Music', icon: '☕' }
  ];

  return (
    <div className="page" style={{ paddingTop: '2rem' }}>
      <button className="btn back-btn" onClick={() => navigate('/results')}>← Back to Results</button>
      <h2 className="glow-text section-title">Musical Intelligence — Personalized Learning</h2>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginBottom: '2rem', gap: '1rem' }}>
        {tracks.map((track) => (
          <div
            key={track.id}
            className={`interactive-card ${currentTrack?.id === track.id ? 'active' : ''}`}
            onClick={() => setCurrentTrack(track)}
          >
            <div className="card-icon">{track.icon}</div>
            <div className="card-title">{track.title}</div>
          </div>
        ))}
      </div>

      {currentTrack && (
        <div className="player-container">
          <div style={{ marginBottom: '1rem', fontFamily: 'var(--font-display)', color: 'var(--accent-color)' }}>
            Now Playing: <span>{currentTrack.title}</span>
          </div>
          <audio controls autoPlay className="styled-player" src={`/${currentTrack.id}`} style={{ width: '100%' }} />
        </div>
      )}
    </div>
  );
}
