import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState({
    Spatial: false,
    Linguistic: false,
    Musical: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:3001/api/assessments/${user.id}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        const comp = { Spatial: null, Linguistic: null, Musical: null };
        if (Array.isArray(data)) {
            data.forEach(assessment => {
                if (comp[assessment.type] !== undefined) comp[assessment.type] = assessment.score;
            });
        }
        setCompleted(comp);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.id]);

  const allCompleted = completed.Spatial && completed.Linguistic && completed.Musical;

  if (loading) return <div className="page"><h2 className="glow-text">Loading...</h2></div>;

  return (
    <div className="page" id="page-dashboard">
      <h2 className="glow-text section-title" style={{ fontSize: '2.5rem', marginTop: '2rem' }}>Welcome, {user.username}!</h2>
      <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
        Select an intelligence module to begin your assessment.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '600px' }}>
        
        <div 
          className={`interactive-card ${completed.Spatial ? 'completed' : ''}`} 
          style={{ cursor: completed.Spatial ? 'default' : 'pointer', opacity: completed.Spatial ? 0.7 : 1, borderColor: completed.Spatial ? 'var(--success-color)' : '', maxWidth: '100%' }}
          onClick={() => !completed.Spatial && navigate('/spatial')}
        >
          <div className="card-icon">🧠</div>
          <div style={{ flex: 1 }}>
            <div className="card-title">Spatial Intelligence</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{completed.Spatial !== null ? `Completed: ${completed.Spatial}%` : '3 Videos, 9 Questions'}</div>
          </div>
        </div>

        <div 
          className={`interactive-card ${completed.Linguistic ? 'completed' : ''}`} 
          style={{ cursor: completed.Linguistic ? 'default' : 'pointer', opacity: completed.Linguistic ? 0.7 : 1, borderColor: completed.Linguistic ? 'var(--success-color)' : '', maxWidth: '100%' }}
          onClick={() => !completed.Linguistic && navigate('/linguistic')}
        >
          <div className="card-icon">📚</div>
          <div style={{ flex: 1 }}>
            <div className="card-title">Linguistic Intelligence</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{completed.Linguistic !== null ? `Completed: ${completed.Linguistic}%` : '25 Questions'}</div>
          </div>
        </div>

        <div 
          className={`interactive-card ${completed.Musical ? 'completed' : ''}`} 
          style={{ cursor: completed.Musical ? 'default' : 'pointer', opacity: completed.Musical ? 0.7 : 1, borderColor: completed.Musical ? 'var(--success-color)' : '', maxWidth: '100%' }}
          onClick={() => !completed.Musical && navigate('/musical')}
        >
          <div className="card-icon">🎵</div>
          <div style={{ flex: 1 }}>
            <div className="card-title">Musical Intelligence</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{completed.Musical !== null ? `Completed: ${completed.Musical}%` : '20 Questions'}</div>
          </div>
        </div>

      </div>

      <div style={{ marginTop: '3rem', width: '100%', maxWidth: '600px', display: 'flex', justifyContent: 'center' }}>
        <button 
          className="btn primary-btn" 
          style={{ width: '100%' }}
          onClick={() => navigate('/results')}
        >
          View Dashboard Analysis
        </button>
      </div>

    </div>
  );
}
