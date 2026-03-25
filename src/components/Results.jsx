import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Results({ user }) {
  const navigate = useNavigate();
  const [data, setData] = useState({ Spatial: 0, Linguistic: 0, Musical: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:3001/api/assessments/${user.id}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(rows => {
        const scores = { Spatial: 0, Linguistic: 0, Musical: 0 };
        if (Array.isArray(rows)) {
            rows.forEach(r => { 
                if (scores[r.type] !== undefined) scores[r.type] = r.score; 
            });
        }
        setData(scores);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <div className="page"><h2 className="glow-text">Loading Analysis...</h2></div>;

  const intelligences = [
    { name: 'Spatial', score: data.Spatial, path: '/learn-spatial', insights: "You excel at visualizing the world in 3D. You likely enjoy puzzles, maps, and designing things." },
    { name: 'Linguistic', score: data.Linguistic, path: '/learn-linguistic', insights: "You have a strong affinity for words, reading, and storytelling. Communication is your forte." },
    { name: 'Musical', score: data.Musical, path: '/learn-musical', insights: "You have a deep connection with rhythm and sound. Music often guides your thoughts and emotions." }
  ];

  // Sort descending
  intelligences.sort((a, b) => b.score - a.score);

  return (
    <div className="page" id="page-results" style={{ paddingTop: '2rem' }}>
      <div style={{ width: '100%', display: 'flex' }}>
        <button className="btn back-btn" onClick={() => navigate('/dashboard')}>← Dashboard</button>
      </div>
      <h2 className="glow-text section-title">Your Intelligence Profile</h2>
      
      <div className="main-result-card card mt-4" style={{ textAlign: 'center', position: 'relative', borderTop: '5px solid var(--primary-color)' }}>
        <h3 className="result-rank-badge" style={{ background: 'var(--primary-color)', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '20px', display: 'inline-block', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
          PRIMARY DOMINANT
        </h3>
        <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', color: '#0f172a', marginBottom: '0.5rem', fontWeight: '800' }}>{intelligences[0].name}</div>
        <div className="result-score" style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--primary-color)' }}>{intelligences[0].score}%</div>
        <p className="mt-4" style={{ fontStyle: 'italic', color: 'var(--text-main)', maxWidth: '600px', margin: '1.5rem auto' }}>{intelligences[0].insights}</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '2rem' }}>
        <div className="card text-center" style={{ flex: 1, padding: '2rem', borderTop: '4px solid #64748b' }}>
          <h4 style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem' }}>Secondary Dominant</h4>
          <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', color: '#1e293b', marginBottom: '0.5rem', fontWeight: '700' }}>{intelligences[1].name}</div>
          <div style={{ fontSize: '1.5rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>{intelligences[1].score}%</div>
          <p className="mt-4" style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>{intelligences[1].insights}</p>
        </div>
        <div className="card text-center" style={{ flex: 1, padding: '1.5rem' }}>
          <h4 className="result-rank-badge-secondary">3rd</h4>
          <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: '#1e293b', marginBottom: '0.2rem' }}>{intelligences[2].name}</div>
          <div style={{ fontSize: '1.2rem', color: 'var(--primary-color)' }}>{intelligences[2].score}%</div>
          <p className="mt-4" style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{intelligences[2].insights}</p>
        </div>
      </div>

      <h3 className="mt-4 section-title" style={{ borderBottom: 'none', marginBottom: '1rem', marginTop: '3rem' }}>Personalized Learning Paths</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
        {intelligences.map((int, idx) => (
          <div 
            key={idx} 
            className="card" 
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '1.5rem', transition: 'all 0.3s' }}
            onClick={() => navigate(int.path)}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.transform = 'translateX(10px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)', marginRight: '1.5rem', width: '40px' }}>
              {idx === 0 ? '1st:' : idx === 1 ? '2nd:' : '3rd:'}
            </div>
            <div style={{ fontSize: '1.3rem', color: '#0f172a', fontWeight: 600 }}>
              {int.name} Learning Path
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
