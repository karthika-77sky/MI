// src/components/TopicSelect.jsx
// Step after Results: student selects a Class 6 Science topic and preferred language.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TERM_COLORS = { 1: '#2563eb', 2: '#059669', 3: '#7c3aed' };
const TERM_LABELS = { 1: 'Term 1', 2: 'Term 2', 3: 'Term 3' };

export default function TopicSelect({ user }) {
  const navigate = useNavigate();
  const [topics, setTopics]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [language, setLanguage]         = useState('English');
  const [dominantIntel, setDominantIntel] = useState(null);
  const [creating, setCreating]         = useState(false);

  // Fetch topics and user's dominant intelligence
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [topicsRes, assessRes] = await Promise.all([
          fetch('http://localhost:8000/api/topics'),
          fetch(`http://localhost:3001/api/assessments/${user.id}`, { cache: 'no-store' }),
        ]);
        const topicsData = await topicsRes.json();
        const assessData = await assessRes.json();

        setTopics(topicsData.topics || []);

        // Calculate dominant intelligence
        if (Array.isArray(assessData) && assessData.length) {
          const sorted = [...assessData].sort((a, b) => b.score - a.score);
          setDominantIntel(sorted[0].type);
        }
      } catch (e) {
        setError('Failed to load topics. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user.id]);

  const handleStart = async () => {
    if (!selectedTopic || !dominantIntel) return;
    setCreating(true);

    try {
      const res = await fetch('http://localhost:3001/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          topic: language === 'English' ? selectedTopic.titleEn : selectedTopic.titleTa,
          topicKey: selectedTopic.key,
          language,
          dominantIntelligence: dominantIntel,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create session');
      }

      const session = await res.json();
      // Clear stale exam results from any previous session so they cannot bleed into this new one
      sessionStorage.removeItem('examResult_baseline');
      sessionStorage.removeItem('examResult_final');
      sessionStorage.removeItem('spatialDashboardDone');
      // Store session ID in sessionStorage so it survives page navigation
      sessionStorage.setItem('currentSessionId', String(session.id));
      sessionStorage.setItem('currentTopicKey', selectedTopic.key);
      sessionStorage.setItem('currentTopicTitle', language === 'English' ? selectedTopic.titleEn : selectedTopic.titleTa);
      sessionStorage.setItem('currentLanguage', language);

      navigate('/textbook-learn');
    } catch (e) {
      alert(e.message);
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📚</div>
          <h2 className="glow-text">Loading Topics...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: 'center', color: '#ef4444' }}>
          <p>⚠️ {error}</p>
          <button className="btn back-btn" onClick={() => navigate('/results')}>← Back to Results</button>
        </div>
      </div>
    );
  }

  // Group topics by term
  const grouped = topics.reduce((acc, t) => {
    if (!acc[t.term]) acc[t.term] = [];
    acc[t.term].push(t);
    return acc;
  }, {});

  const topicTitle = selectedTopic
    ? (language === 'English' ? selectedTopic.titleEn : selectedTopic.titleTa)
    : null;

  return (
    <div className="page" style={{ paddingTop: '2rem', maxWidth: '860px' }}>
      <button className="btn back-btn" onClick={() => navigate('/results')}>← Back to Results</button>

      <h2 className="glow-text section-title" style={{ fontSize: '2.2rem' }}>
        🎯 Choose Your Learning Topic
      </h2>

      {/* Dominant Intelligence Banner */}
      {dominantIntel && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(139,92,246,0.12) 100%)',
          border: '1px solid rgba(37,99,235,0.35)',
          borderRadius: '16px', padding: '1rem 1.5rem',
          marginBottom: '2rem', width: '100%', textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.05rem', color: '#2563eb', fontWeight: 700 }}>
            🧠 Your Dominant Intelligence: <span style={{ color: '#7c3aed' }}>{dominantIntel}</span>
          </div>
          <div style={{ fontSize: '0.92rem', color: '#64748b', marginTop: '4px' }}>
            After learning from the textbook and completing Test A, you'll receive
            content tailored specifically to your <strong>{dominantIntel}</strong> intelligence style.
          </div>
        </div>
      )}

      {/* Instruction banner */}
      <div style={{
        background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: '14px',
        padding: '1rem 1.4rem', marginBottom: '2rem', width: '100%'
      }}>
        <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>📌 Important Instructions</div>
        <ul style={{ margin: 0, paddingLeft: '1.4rem', color: '#78350f', fontSize: '0.93rem', lineHeight: '1.7' }}>
          <li>Please select a topic that you have <strong>not studied before</strong>.</li>
          <li>You will first read the textbook content, then take <strong>Test A</strong>.</li>
          <li>After Test A, you'll learn through your dominant intelligence, then take <strong>Test B</strong>.</li>
          <li>The same topic is used throughout the entire experiment.</li>
        </ul>
      </div>

      {/* Language Selection */}
      <div style={{ width: '100%', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '0.8rem', fontFamily: 'var(--font-display)' }}>
          🌐 Select Your Preferred Language
        </h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {['English', 'Tamil'].map(lang => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              style={{
                flex: 1, padding: '0.9rem', borderRadius: '12px', fontWeight: 700,
                fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s',
                border: language === lang ? '2px solid #2563eb' : '2px solid #e2e8f0',
                background: language === lang ? '#eff6ff' : 'white',
                color: language === lang ? '#2563eb' : '#64748b',
                boxShadow: language === lang ? '0 0 0 4px rgba(37,99,235,0.15)' : 'none',
              }}
            >
              {lang === 'English' ? '🌐 English' : '🇮🇳 Tamil'}
            </button>
          ))}
        </div>
      </div>

      {/* Topic Cards by Term */}
      <div style={{ width: '100%' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '1.2rem', fontFamily: 'var(--font-display)' }}>
          📖 Class 6 Science Topics
        </h3>
        {[1, 2, 3].map(term => (
          <div key={term} style={{ marginBottom: '1.5rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: `${TERM_COLORS[term]}18`, border: `1px solid ${TERM_COLORS[term]}40`,
              borderRadius: '20px', padding: '4px 14px', marginBottom: '0.8rem',
              color: TERM_COLORS[term], fontWeight: 700, fontSize: '0.88rem'
            }}>
              📅 {TERM_LABELS[term]}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {(grouped[term] || []).map(topic => {
                const title = language === 'English' ? topic.titleEn : topic.titleTa;
                const isSelected = selectedTopic?.key === topic.key;
                return (
                  <div
                    key={topic.key}
                    onClick={() => setSelectedTopic(topic)}
                    style={{
                      padding: '1rem 1.3rem', borderRadius: '14px', cursor: 'pointer',
                      transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '1rem',
                      border: isSelected ? `2px solid ${TERM_COLORS[term]}` : '2px solid #e2e8f0',
                      background: isSelected ? `${TERM_COLORS[term]}10` : 'white',
                      boxShadow: isSelected ? `0 0 0 3px ${TERM_COLORS[term]}25` : '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: `${TERM_COLORS[term]}20`, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: TERM_COLORS[term], fontWeight: 800, fontSize: '0.95rem',
                      flexShrink: 0
                    }}>
                      {topic.chapter}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>{title}</div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                        Chapter {topic.chapter}
                      </div>
                    </div>
                    {isSelected && (
                      <div style={{ color: TERM_COLORS[term], fontSize: '1.3rem' }}>✓</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Start Button */}
      <div style={{ width: '100%', marginTop: '1.5rem', paddingBottom: '3rem' }}>
        {selectedTopic ? (
          <button
            onClick={handleStart}
            disabled={creating}
            style={{
              width: '100%', padding: '1.1rem', borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              color: 'white', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(37,99,235,0.35)', transition: 'all 0.2s',
              opacity: creating ? 0.7 : 1,
            }}
          >
            {creating
              ? '⏳ Setting up session...'
              : `📚 Start Learning "${topicTitle}" in ${language} →`
            }
          </button>
        ) : (
          <div style={{
            textAlign: 'center', padding: '1rem', color: '#94a3b8',
            border: '2px dashed #e2e8f0', borderRadius: '14px', fontSize: '0.95rem'
          }}>
            ☝️ Please select a topic above to continue
          </div>
        )}
      </div>
    </div>
  );
}
