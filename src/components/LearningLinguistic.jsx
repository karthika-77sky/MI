import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LearningLinguistic() {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="page" style={{ paddingTop: '2rem' }}>
      <button className="btn back-btn" onClick={() => navigate('/results')}>← Back to Results</button>
      <h2 className="glow-text section-title">Linguistic Intelligence — Personalized Learning</h2>

      {/* Option 1: Storytelling */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginBottom: '2rem' }}>
        <div className={`interactive-card ${isPlaying ? 'active' : ''}`} onClick={() => setIsPlaying(true)} style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '2rem', maxWidth: '700px', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', borderBottom: '1px solid var(--accent-purple)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <div className="card-icon">🐸</div>
            <div className="card-title" style={{ fontSize: '1.5rem' }}>Storytelling: Freddy Learns About Habitats</div>
          </div>

          <div style={{ color: 'var(--text-main)', lineHeight: '1.6', fontSize: '1.1rem' }}>
            <p>Freddy the frog lived in a small pond. One day, he wanted to learn about different homes of animals.</p><br />
            <p>First, he met a fish in the pond.<br />
              The fish said, “I am an aquatic animal. I live in water.”</p><br />
            <p>Freddy jumped onto the land and saw a lion.<br />
              The lion said, “I am a terrestrial animal. I live on land.”</p><br />
            <p>Then Freddy looked up and saw a bird flying in the sky.<br />
              The bird said, “I am an aerial animal. I fly and live in the air.”</p><br />
            <p>Freddy smiled and said,<br />
              “I can live in water and also on land. I am an amphibian!”</p><br />
            <p>Freddy was happy because he learned that:</p>
            <ul style={{ listStyleType: 'none', paddingLeft: '1rem', margin: '0.5rem 0' }}>
              <li>Aquatic animals live in water 🐟</li>
              <li>Terrestrial animals live on land 🦁</li>
              <li>Aerial animals live in the air 🐦</li>
              <li>Amphibians live both in water and on land 🐸</li>
            </ul><br />
            <p>He went back to his pond and shared this with his friends.</p>
          </div>

          <div style={{ marginTop: '1.5rem', width: '100%', textAlign: 'center', color: 'var(--primary-color)', fontWeight: 'bold' }}>
            {isPlaying ? 'Playing Audio...' : 'Click anywhere on this card to play the audio version'}
          </div>
        </div>
      </div>

      {isPlaying && (
        <div className="player-container" style={{ maxWidth: '700px', margin: '0 auto 2rem auto' }}>
          <audio controls autoPlay className="styled-player" src="/audio7.mpeg" style={{ width: '100%' }} />
        </div>
      )}

      {/* Option 2: Crossword */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginBottom: '2rem' }}>
        <div className="interactive-card" style={{ flexDirection: 'column', padding: '2rem', maxWidth: '700px', cursor: 'pointer', borderTop: '4px solid var(--accent-purple)' }}
             onClick={() => window.open('https://interacty.me/projects/d67c0e59a4629bcd', '_blank')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', borderBottom: '1px solid var(--accent-purple)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <div className="card-icon" style={{ fontSize: '2.5rem' }}>🔡</div>
            <div className="card-title" style={{ fontSize: '1.5rem' }}>Activity: Multi-Intelligence Crossword</div>
          </div>
          <div style={{ color: 'var(--text-main)', lineHeight: '1.6', fontSize: '1.1rem' }}>
            <p>Challenge your linguistic abilities and vocabulary with this specialized crossword puzzle. Test your knowledge of habitats, animals, and multi-intelligence concepts!</p>
          </div>
          <div style={{ marginTop: '1.5rem', width: '100%', textAlign: 'center' }}>
            <button className="btn primary-btn" style={{ background: 'var(--accent-purple)', borderColor: 'var(--accent-purple)' }}>Play Crossword Challenge</button>
          </div>
        </div>
      </div>
    </div>
  );
}
