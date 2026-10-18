// src/components/SpatialLearning.jsx
// Phase 3: Spatial Learning Dashboard — topic-locked YouTube videos (English + Tamil).
// The topic comes from the active session — student cannot change it here.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, X, Clock, BookOpen, Star, Eye, ExternalLink,
  RefreshCw, AlertCircle, Loader2, ChevronLeft, Sparkles,
} from 'lucide-react';

const NODE_URL   = 'http://localhost:3001';
const PYTHON_URL = 'http://localhost:8000';

export default function SpatialLearning({ user }) {
  const navigate = useNavigate();
  const sessionId = sessionStorage.getItem('currentSessionId');
  const language  = sessionStorage.getItem('currentLanguage') || 'English';

  const [session, setSession]           = useState(null);
  const [tamilVideos, setTamilVideos]   = useState([]);
  const [englishVideos, setEnglishVideos] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [activeVideo, setActiveVideo]   = useState(null);
  const [ratings, setRatings]           = useState({});
  const [activeFilter, setActiveFilter] = useState(language === 'Tamil' ? 'Tamil' : 'ALL');
  const [sessionLoaded, setSessionLoaded] = useState(false);

  useEffect(() => {
    if (!sessionId) { navigate('/topic-select'); return; }
    loadSessionThenVideos();
  }, []);

  const loadSessionThenVideos = async () => {
    try {
      const sessRes = await fetch(`${NODE_URL}/api/sessions/by-id/${sessionId}`);
      if (!sessRes.ok) throw new Error('Session not found');
      const sess = await sessRes.json();
      setSession(sess);
      if (sess.language === 'Tamil') {
        setActiveFilter('Tamil');
      }
      setSessionLoaded(true);
      await fetchVideos(sess.topic);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const fetchVideos = async (topic) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${PYTHON_URL}/api/spatial/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, student_id: user?.id ? String(user.id) : 'student' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Video search failed (${res.status})`);
      }
      const data = await res.json();
      setTamilVideos(data.tamil_videos || []);
      setEnglishVideos(data.english_videos || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeTest = () => {
    sessionStorage.setItem('examPhase', 'final');
    navigate('/exam/final');
  };

  const handleRate = (videoId, stars) =>
    setRatings(prev => ({ ...prev, [videoId]: stars }));

  const allVideos     = [...tamilVideos, ...englishVideos];
  const filteredVideos =
    activeFilter === 'Tamil'   ? tamilVideos :
    activeFilter === 'English' ? englishVideos : allVideos;

  // ── Video card ───────────────────────────────────────────────────────────────
  const VideoCard = ({ vid, index }) => {
    const isTamil = vid.language === 'Tamil';
    const accentColor = isTamil ? '#f59e0b' : '#38bdf8';
    return (
      <div style={{
        background: '#151c2c', borderRadius: '20px', border: '1px solid #28354e',
        overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
        display: 'grid', gridTemplateColumns: 'minmax(240px,320px) 1fr',
        gap: '1.2rem', padding: '1rem', transition: 'border-color 0.2s',
      }}
        onMouseOver={e => e.currentTarget.style.borderColor = accentColor}
        onMouseOut={e => e.currentTarget.style.borderColor = '#28354e'}
      >
        {/* Thumbnail */}
        <div onClick={() => setActiveVideo(vid)} style={{
          position: 'relative', borderRadius: '14px', overflow: 'hidden',
          cursor: 'pointer', height: '190px', background: '#0f172a', flexShrink: 0,
        }}>
          <img src={vid.thumbnail_url} alt={vid.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {/* Language badge */}
          <div style={{
            position: 'absolute', top: 8, left: 8,
            background: isTamil ? 'rgba(245,158,11,0.92)' : 'rgba(56,189,248,0.92)',
            color: '#fff', padding: '3px 9px', borderRadius: '8px',
            fontSize: '0.73rem', fontWeight: 800,
          }}>
            {isTamil ? '🇮🇳 Tamil' : '🌐 English'}
          </div>
          {/* Duration */}
          {vid.duration && (
            <div style={{
              position: 'absolute', bottom: 8, right: 8,
              background: 'rgba(0,0,0,0.85)', color: '#fff',
              padding: '3px 7px', borderRadius: '6px',
              fontSize: '0.72rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '3px',
            }}>
              <Clock size={11} /> {vid.duration}
            </div>
          )}
          {/* Play button */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 46, height: 46, borderRadius: '50%',
            background: 'rgba(56,189,248,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 18px rgba(56,189,248,0.5)',
          }}>
            <Play size={22} color="#0f172a" style={{ marginLeft: 3 }} />
          </div>
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ fontSize: '0.83rem', color: accentColor, fontWeight: 700, whiteSpace: 'nowrap' }}>
                📺 {vid.channel_title}
              </span>
              <span style={{
                background: 'rgba(168,85,247,0.18)',
                color: '#c084fc',
                border: '1px solid rgba(168,85,247,0.4)',
                padding: '2px 8px',
                borderRadius: '8px',
                fontSize: '0.73rem',
                fontWeight: 700
              }}>
                ✨ 3D Visual &amp; Concept Animation
              </span>
              {vid.view_count && (
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Eye size={12} /> {vid.view_count}
                </span>
              )}
            </div>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0', lineHeight: 1.35 }}>
              {index + 1}. {vid.title}
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', margin: '0 0 8px 0', lineHeight: 1.5 }}>
              {vid.description}
            </p>
            {/* Study notes */}
            {vid.notes?.length > 0 && (
              <div style={{
                background: '#0f172a', borderRadius: '10px', border: '1px solid #1e293b',
                padding: '0.6rem 0.8rem',
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#a855f7', marginBottom: 4,
                  display: 'flex', alignItems: 'center', gap: 5 }}>
                  <BookOpen size={13} /> Lesson Takeaways
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.55 }}>
                  {vid.notes.slice(0, 3).map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 8, paddingTop: '0.6rem', borderTop: '1px solid #1e293b', marginTop: 8,
          }}>
            {/* Stars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>Rate:</span>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => handleRate(vid.video_id, n)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px' }}>
                  <Star size={16}
                    fill={(ratings[vid.video_id] || 0) >= n ? '#f59e0b' : 'none'}
                    color={(ratings[vid.video_id] || 0) >= n ? '#f59e0b' : '#64748b'} />
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <a href={`https://www.youtube.com/watch?v=${vid.video_id}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155',
                  padding: '5px 10px', borderRadius: '9px', fontSize: '0.82rem',
                  fontWeight: 600, textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                <ExternalLink size={13} /> YouTube
              </a>
              <button onClick={() => setActiveVideo(vid)}
                style={{
                  background: 'linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%)',
                  color: '#fff', border: 'none', padding: '5px 12px',
                  borderRadius: '9px', fontSize: '0.84rem', fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                }}>
                <Play size={13} /> Watch
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Tab styles
  const tabBase = { border: '1px solid', borderRadius: '12px', padding: '7px 16px',
    fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'all 0.2s' };
  const tabActive   = c => ({ ...tabBase, background: c, color: '#fff', borderColor: c });
  const tabInactive = () => ({ ...tabBase, background: '#1e293b', color: '#cbd5e1', borderColor: '#334155' });

  return (
    <div style={{
      minHeight: '100vh', background: '#0b0f19', color: '#f1f5f9',
      fontFamily: 'Inter, system-ui, sans-serif', padding: '2rem 1.5rem 4rem',
      position: 'relative', overflowX: 'hidden',
    }}>
      {/* Ambient glows */}
      <div style={{ position: 'fixed', top: '-10%', left: '20%', width: 400, height: 400, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle,rgba(56,189,248,0.14) 0%,rgba(0,0,0,0) 70%)' }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '15%', width: 500, height: 500, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle,rgba(168,85,247,0.14) 0%,rgba(0,0,0,0) 70%)' }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <button onClick={() => navigate(`/exam-results/baseline`)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#1e293b',
              color: '#cbd5e1', border: '1px solid #334155', padding: '9px 16px',
              borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.92rem' }}
            onMouseOver={e => { e.currentTarget.style.background = '#334155'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#cbd5e1'; }}>
            <ChevronLeft size={17} /> Back to Test A Results
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(56,189,248,0.1)',
            border: '1px solid rgba(56,189,248,0.3)', padding: '5px 13px', borderRadius: '20px',
            fontSize: '0.83rem', color: '#38bdf8' }}>
            <Sparkles size={15} /> Phase 3 — Spatial Learning
          </div>
        </div>

        {/* Session banner */}
        {session && (
          <div style={{
            background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)',
            borderRadius: '16px', padding: '1rem 1.4rem', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>
                Learning session topic (locked)
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                {session.topic}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              <span style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8',
                padding: '4px 10px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600 }}>
                🌐 {session.language}
              </span>
              <span style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.35)',
                color: '#a855f7', padding: '4px 10px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600 }}>
                🧠 {session.dominant_intelligence} Intelligence
              </span>
            </div>
          </div>
        )}

        {/* Hero banner */}
        <div style={{
          background: 'linear-gradient(135deg,rgba(30,41,59,0.92) 0%,rgba(15,23,42,0.97) 100%)',
          borderRadius: '24px', border: '1px solid rgba(56,189,248,0.25)',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5),0 0 20px rgba(56,189,248,0.1)',
          padding: '2rem', marginBottom: '2rem',
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase',
            background: 'linear-gradient(90deg,#38bdf8 0%,#a855f7 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>
            🔭 Spatial Intelligence Learning Hub
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.5rem 0' }}>
            Watch &amp; Learn: {session?.topic || 'Science Topic'} 🎬
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.98rem', margin: 0, lineHeight: 1.5 }}>
            Discover the best educational videos for your topic in both{' '}
            <strong style={{ color: '#f59e0b' }}>Tamil</strong> and{' '}
            <strong style={{ color: '#38bdf8' }}>English</strong>. Watch any videos you like,
            then take <strong style={{ color: '#a855f7' }}>Test B</strong> when you are ready.
          </p>
        </div>

        {/* Loading / Error / Videos */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#151c2c',
            borderRadius: '20px', border: '1px solid #28354e' }}>
            <Loader2 size={44} color="#38bdf8" style={{ animation: 'spin 1s linear infinite' }} />
            <h3 style={{ color: '#fff', marginTop: '1.2rem' }}>Finding Educational Videos...</h3>
            <p style={{ color: '#94a3b8' }}>Searching Tamil &amp; English YouTube videos for "{session?.topic}"</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 2rem', background: 'rgba(239,68,68,0.08)',
            borderRadius: '20px', border: '1px solid rgba(239,68,68,0.3)' }}>
            <AlertCircle size={44} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ color: '#fca5a5' }}>Unable to Load Videos</h3>
            <p style={{ color: '#cbd5e1', maxWidth: 500, margin: '0 auto 1.5rem auto' }}>{error}</p>
            <button onClick={() => fetchVideos(session?.topic || '')}
              style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '9px 20px',
                borderRadius: '12px', fontWeight: 700, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <RefreshCw size={15} /> Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Filter tabs */}
            <div style={{ background: '#151c2c', borderRadius: '18px', border: '1px solid #28354e',
              padding: '1.1rem 1.4rem', marginBottom: '1.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: 0,
                  display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={20} color="#a855f7" /> Videos for "{session?.topic}"
                </h2>
                <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>
                  {tamilVideos.length} Tamil · {englishVideos.length} English · {allVideos.length} Total
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: '0.9rem',
                borderTop: '1px solid #1e293b', paddingTop: '0.9rem' }}>
                <button onClick={() => setActiveFilter('ALL')}
                  style={activeFilter === 'ALL' ? tabActive('#6366f1') : tabInactive()}>
                  🎬 All ({allVideos.length})
                </button>
                <button onClick={() => setActiveFilter('Tamil')}
                  style={activeFilter === 'Tamil' ? tabActive('#f59e0b') : tabInactive()}>
                  🇮🇳 Tamil ({tamilVideos.length})
                </button>
                <button onClick={() => setActiveFilter('English')}
                  style={activeFilter === 'English' ? tabActive('#38bdf8') : tabInactive()}>
                  🌐 English ({englishVideos.length})
                </button>
              </div>
            </div>

            {filteredVideos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 2rem', background: '#151c2c',
                borderRadius: '20px', color: '#94a3b8' }}>
                <h3 style={{ color: '#fff' }}>No videos found under "{activeFilter}"</h3>
                <p>{allVideos.length > 0
                  ? `Try "All" to see ${allVideos.length} other videos.`
                  : 'No educational videos found. Check your internet connection or YouTube API quota.'}</p>
                {allVideos.length > 0 && (
                  <button onClick={() => setActiveFilter('ALL')}
                    style={{ background: '#38bdf8', color: '#0f172a', border: 'none',
                      padding: '8px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                    View All ({allVideos.length})
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem', marginBottom: '2rem' }}>
                {filteredVideos.map((vid, i) => (
                  <VideoCard key={`${vid.video_id}-${i}`} vid={vid} index={i} />
                ))}
              </div>
            )}
          </>
        )}

        {/* "Finished learning — Take Final Test" button */}
        {!loading && (
          <div style={{
            background: 'linear-gradient(135deg,rgba(124,58,237,0.15) 0%,rgba(99,102,241,0.15) 100%)',
            border: '2px solid rgba(124,58,237,0.4)', borderRadius: '24px',
            padding: '2rem', marginTop: '2.5rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎯</div>
            <h3 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Ready to Test Your Learning?
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.93rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              After watching the videos, take <strong style={{ color: '#a855f7' }}>Test B</strong> — the same questions
              as Test A — to see how much your score improves after spatial learning.
            </p>
            <button onClick={handleTakeTest}
              style={{
                background: 'linear-gradient(135deg,#7c3aed 0%,#4c1d95 100%)',
                color: '#fff', border: 'none', padding: '1rem 2.2rem',
                borderRadius: '14px', fontSize: '1.05rem', fontWeight: 800,
                cursor: 'pointer', boxShadow: '0 8px 20px rgba(124,58,237,0.4)',
              }}>
              I have finished learning — Take Final Test 🚀
            </button>
          </div>
        )}
      </div>

      {/* Video modal */}
      {activeVideo && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1.5rem',
        }}>
          <div style={{ background: '#0f172a', borderRadius: '24px', width: '100%', maxWidth: 860,
            border: '1px solid rgba(56,189,248,0.3)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.5rem', borderBottom: '1px solid #1e293b' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', flex: 1, marginRight: '1rem' }}>
                {activeVideo.title}
              </div>
              <button onClick={() => setActiveVideo(null)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px',
                  padding: '6px 10px', cursor: 'pointer', color: '#fff', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
              <iframe
                src={activeVideo.embed_url}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              />
            </div>
            <div style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.88rem' }}>
              📺 {activeVideo.channel_title}
              {activeVideo.duration && ` · ⏱️ ${activeVideo.duration}`}
              {activeVideo.view_count && ` · 👁 ${activeVideo.view_count}`}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
