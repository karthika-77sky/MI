// src/components/ExamResults.jsx
// Shows results after Test A or Test B, with the "Learn Better" CTA for Test A.
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const NODE_URL = 'http://localhost:3001';

export default function ExamResults({ user }) {
  const navigate = useNavigate();
  const { phase } = useParams();   // 'baseline' | 'final'
  const isBaseline = phase === 'baseline';

  const sessionId = sessionStorage.getItem('currentSessionId');
  const language  = sessionStorage.getItem('currentLanguage') || 'English';

  const [result, setResult]   = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { navigate('/topic-select'); return; }

    const stored = sessionStorage.getItem(`examResult_${phase}`);
    if (stored) {
      setResult(JSON.parse(stored));
    }

    // Also fetch session info for dominant intelligence routing
    fetch(`${NODE_URL}/api/sessions/by-id/${sessionId}`)
      .then(r => r.json())
      .then(s => { setSession(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [phase]);

  const handleLearnBetter = () => {
    const intel = session?.dominant_intelligence || 'Spatial';
    if (intel === 'Spatial') {
      navigate('/spatial-learning');
    } else if (intel === 'Musical') {
      navigate('/learn-musical');
    } else if (intel === 'Linguistic') {
      navigate('/learn-linguistic');
    } else {
      navigate('/spatial-learning');
    }
  };

  const handleViewComparison = () => {
    navigate('/compare');
  };

  if (loading || !result) {
    return (
      <div className="page" style={{ justifyContent: 'center', paddingTop: '4rem' }}>
        <h2 className="glow-text">Loading Results...</h2>
      </div>
    );
  }

  const percentage = result.totalMarks > 0
    ? Math.round((result.marksObtained / result.totalMarks) * 100)
    : 0;

  const getScoreColor = (pct) => {
    if (pct >= 80) return '#059669';
    if (pct >= 60) return '#2563eb';
    if (pct >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreEmoji = (pct) => {
    if (pct >= 80) return '🎉';
    if (pct >= 60) return '👍';
    if (pct >= 40) return '📚';
    return '💪';
  };

  const scoreColor = getScoreColor(percentage);
  const dominantIntel = session?.dominant_intelligence || 'Spatial';

  const learningRouteLabel = {
    Spatial: 'Spatial Learning Dashboard (YouTube Videos)',
    Musical: 'Musical Learning Dashboard',
    Linguistic: 'Linguistic Learning Dashboard',
  }[dominantIntel] || 'Spatial Learning Dashboard';

  return (
    <div className="page" style={{ paddingTop: '2rem', maxWidth: '700px' }}>

      {/* Header */}
      {isBaseline ? (
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
          border: '2px solid #bfdbfe',
          borderRadius: '24px', padding: '2.2rem 2rem', width: '100%', textAlign: 'center', marginBottom: '2rem',
          boxShadow: '0 8px 24px rgba(37,99,235,0.08)'
        }}>
          <div style={{
            display: 'inline-block', padding: '5px 16px', borderRadius: '20px',
            background: '#2563eb', color: 'white',
            fontSize: '0.82rem', fontWeight: 700, marginBottom: '1.2rem', textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            📝 Test A (Baseline) — Completed
          </div>

          <div style={{ fontSize: '3.5rem', marginBottom: '0.8rem' }}>
            🔒
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e3a8a', margin: '0 0 0.5rem 0' }}>
            Answers Submitted &amp; Saved
          </h2>
          <p style={{ color: '#475569', fontSize: '0.96rem', maxWidth: '520px', margin: '0 auto 1.2rem auto', lineHeight: 1.6 }}>
            Your baseline responses for <strong>{session?.topic}</strong> have been recorded for AI evaluation.
          </p>

          <div style={{
            background: '#ffffff', border: '1px solid #bfdbfe', borderRadius: '16px',
            padding: '1.1rem 1.4rem', textAlign: 'left', color: '#1e40af', fontSize: '0.88rem',
            lineHeight: 1.6, maxWidth: '560px', margin: '0 auto'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🔬</span> Experimental Evaluation Protocol:
            </div>
            To scientifically measure the learning boost from <strong>3D spatial &amp; visual media</strong>,
            Test A marks and evaluations are kept confidential. Both your <strong>Test A &amp; Test B</strong> scores,
            detailed breakdowns, and Gemini AI evaluations will be revealed together after you complete Test B.
          </div>
        </div>
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, #f5f3ff 0%, #faf5ff 100%)',
          border: '2px solid #c4b5fd',
          borderRadius: '24px', padding: '2rem', width: '100%', textAlign: 'center', marginBottom: '2rem'
        }}>
          <div style={{
            display: 'inline-block', padding: '4px 14px', borderRadius: '20px',
            background: '#7c3aed', color: 'white',
            fontSize: '0.82rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase'
          }}>
            🎯 Test B — Final Results
          </div>

          <div style={{ fontSize: '4rem', fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
            {result.marksObtained}
            <span style={{ fontSize: '1.8rem', color: '#94a3b8' }}>/{result.totalMarks}</span>
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: scoreColor, marginTop: '6px' }}>
            {percentage}% {getScoreEmoji(percentage)}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.92rem', marginTop: '8px' }}>
            Topic: <strong>{session?.topic}</strong> · Language: <strong>{language}</strong>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', width: '100%', marginBottom: '2rem' }}>
        {[
          { label: 'Questions', value: result.questionsCount || '10', icon: '❓' },
          { label: isBaseline ? 'Submission Status' : 'Marks Obtained', value: isBaseline ? 'Recorded ✅' : result.marksObtained, icon: isBaseline ? '📝' : '✅' },
          { label: 'Time Taken', value: result.timeTakenSecs ? `${Math.floor(result.timeTakenSecs/60)}m ${result.timeTakenSecs%60}s` : '—', icon: '⏱️' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px',
            padding: '1.2rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ fontSize: '1.6rem', marginBottom: '4px' }}>{stat.icon}</div>
            <div style={{ fontSize: isBaseline && stat.label === 'Submission Status' ? '1.05rem' : '1.4rem', fontWeight: 800, color: '#0f172a' }}>{stat.value}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Phase-specific CTA */}
      {isBaseline ? (
        <div style={{ width: '100%' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.08) 100%)',
            border: '1px solid rgba(37,99,235,0.3)', borderRadius: '20px',
            padding: '1.8rem', textAlign: 'center', marginBottom: '1.5rem'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: '#0f172a', marginBottom: '0.5rem' }}>
              Phase 1 Complete!
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              You have completed the baseline examination. Now it's time to learn about
              <strong> {session?.topic}</strong> in a way that suits your
              <strong> {dominantIntel}</strong> intelligence.
            </p>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              You will be taken to: <strong>{learningRouteLabel}</strong>
            </p>
            <button
              onClick={handleLearnBetter}
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                color: 'white', border: 'none', padding: '1.1rem 2rem',
                borderRadius: '14px', fontSize: '1.1rem', fontWeight: 800,
                cursor: 'pointer', boxShadow: '0 8px 20px rgba(37,99,235,0.35)',
                width: '100%', transition: 'all 0.2s'
              }}
            >
              🎥 Proceed to Spatial Learning Dashboard (Watch 3D Animated Lessons) →
            </button>
          </div>
        </div>
      ) : (
        <div style={{ width: '100%' }}>
          <div style={{
            background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: '20px',
            padding: '1.8rem', textAlign: 'center', marginBottom: '1.5rem'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏆</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: '#4c1d95', marginBottom: '0.5rem' }}>
              Phase 2 Complete!
            </h3>
            <p style={{ color: '#6b21a8', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Excellent work! Both phases of the learning experiment are complete.
              View your full performance comparison below.
            </p>
            <button
              onClick={handleViewComparison}
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
                color: 'white', border: 'none', padding: '1rem 2rem',
                borderRadius: '14px', fontSize: '1.08rem', fontWeight: 800,
                cursor: 'pointer', boxShadow: '0 8px 20px rgba(124,58,237,0.4)',
                width: '100%'
              }}
            >
              📊 View Performance Comparison →
            </button>
          </div>
        </div>
      )}

      <button className="btn back-btn" onClick={() => navigate('/results')}>
        ← Back to Intelligence Results
      </button>
      <div style={{ height: '2rem' }} />
    </div>
  );
}
