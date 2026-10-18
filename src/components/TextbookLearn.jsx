// src/components/TextbookLearn.jsx
// Phase 1: display textbook content for the selected topic.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cleanMathText } from '../utils/mathCleaner';

// Helper to render inline markdown (bold, italic) with math symbol cleaning
const renderInline = (rawText) => {
  if (!rawText) return null;
  const cleaned = cleanMathText(rawText);
  const parts = cleaned.split(/(\*\*.*?\*\*|\*[^*]+?\*)/g);
  return parts.map((part, pIdx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={pIdx} style={{ color: '#0f172a', fontWeight: '700' }}>
          {cleanMathText(part.slice(2, -2))}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={pIdx} style={{ color: '#475569', fontStyle: 'italic' }}>
          {cleanMathText(part.slice(1, -1))}
        </em>
      );
    }
    return cleanMathText(part);
  });
};

export default function TextbookLearn({ user }) {
  const navigate = useNavigate();
  const sessionId  = sessionStorage.getItem('currentSessionId');
  const topicKey   = sessionStorage.getItem('currentTopicKey');
  const language   = sessionStorage.getItem('currentLanguage') || 'English';

  const [content, setContent]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [readConfirmed, setReadConfirmed] = useState(false);

  useEffect(() => {
    if (!sessionId || !topicKey) {
      navigate('/topic-select');
      return;
    }

    const fetchContent = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/textbook/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic_key: topicKey, language }),
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        setContent(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const handleStartTest = () => {
    sessionStorage.setItem('examPhase', 'baseline');
    navigate('/exam/baseline');
  };

  const renderTable = (block, idx) => {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.startsWith('|') && l.endsWith('|'));
    if (lines.length < 2) return null;

    const headerLine = lines[0];
    const dataLines = lines.slice(1).filter(l => l.replace(/[\|\-\s]/g, '') !== '');

    const parseCells = (row) =>
      row.slice(1, -1).split('|').map(c => c.trim());

    const headers = parseCells(headerLine);

    return (
      <div key={idx} style={{ overflowX: 'auto', margin: '1.5rem 0', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#ffffff', fontSize: '0.96rem' }}>
          <thead>
            <tr style={{ background: '#eff6ff', borderBottom: '2px solid #bfdbfe' }}>
              {headers.map((h, hIdx) => (
                <th key={hIdx} style={{ padding: '12px 16px', color: '#1e40af', fontWeight: '700', borderRight: '1px solid #e2e8f0' }}>
                  {renderInline(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataLines.map((row, rIdx) => {
              const cells = parseCells(row);
              return (
                <tr key={rIdx} style={{ background: rIdx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  {cells.map((cell, cIdx) => (
                    <td key={cIdx} style={{ padding: '10px 16px', color: '#334155', borderRight: '1px solid #f1f5f9' }}>
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page" style={{ justifyContent: 'center', paddingTop: '4rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📖</div>
          <h2 className="glow-text">Loading Textbook Content...</h2>
          <p style={{ color: '#64748b' }}>Extracting chapter content from TN State Board Class 6 Science PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page" style={{ paddingTop: '2rem' }}>
        <button className="btn back-btn" onClick={() => navigate('/topic-select')}>← Back to Topic Selection</button>
        <div className="card" style={{ textAlign: 'center', color: '#ef4444', marginTop: '2rem' }}>
          <p style={{ fontSize: '1.2rem' }}>⚠️ Could not load textbook content</p>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>{error}</p>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '1rem' }}>
            Please ensure the Python backend (port 8000) is running and the PDF files are present in the books/ folder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingTop: '2rem', maxWidth: '860px' }}>
      <button className="btn back-btn" onClick={() => navigate('/topic-select')}>← Back to Topic Selection</button>

      {/* Header */}
      <div style={{ width: '100%', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{
            background: '#eff6ff', color: '#2563eb', padding: '4px 12px',
            borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700
          }}>
            📚 Phase 1: Textbook Learning
          </span>
          <span style={{
            background: language === 'English' ? '#f0fdf4' : '#fef3c7',
            color: language === 'English' ? '#059669' : '#d97706',
            padding: '4px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700
          }}>
            {language === 'English' ? '🌐 English' : '🇮🇳 Tamil'}
          </span>
        </div>
        <h2 className="glow-text section-title" style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>
          {content?.title}
        </h2>
        <p style={{ fontSize: '0.88rem', color: '#64748b' }}>{content?.source_note}</p>
      </div>

      {/* Content or unavailability notice */}
      {content?.content_available ? (
        <div className="card" style={{ borderTop: '5px solid #2563eb', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.6rem' }}>📖</span>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: '#0f172a', fontWeight: '800' }}>
                  {content.title}
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                  Parsed from Class 6 Science Textbook with AI Guidance
                </div>
              </div>
            </div>
            <span style={{
              background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
              padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700'
            }}>
              ✓ Verified Curriculum
            </span>
          </div>

          <div style={{
            fontFamily: language === 'Tamil' ? "'Noto Sans Tamil', sans-serif, var(--font-body)" : 'var(--font-body)',
            lineHeight: '1.8', color: '#1e293b', fontSize: '1.05rem',
          }}>
            {/* Diagram and Illustrations Gallery */}
            {content?.images && content.images.length > 0 && (
              <div style={{
                margin: '1.5rem 0 2.5rem 0',
                padding: '1.5rem',
                background: '#f8fafc',
                borderRadius: '18px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>📸</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: '800' }}>
                      {language === 'Tamil' ? 'பாடநூல் விளக்கப் படங்கள் மற்றும் வரைபடங்கள்' : 'Textbook Diagrams & Visual Illustrations'}
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      {language === 'Tamil' ? 'அறிவியல் கருத்துக்களை எளிதாகப் புரிந்துகொள்ள பாடநூலிலிருந்து பெறப்பட்ட படங்கள்' : 'Visual representations extracted directly from your Class 6 textbook'}
                    </div>
                  </div>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '16px'
                }}>
                  {content.images.map((imgUrl, iIdx) => (
                    <div key={iIdx} style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      padding: '10px',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.04)',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img
                        src={`http://localhost:8000${imgUrl}`}
                        alt={`Figure ${iIdx + 1}`}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '180px',
                          objectFit: 'contain',
                          borderRadius: '8px'
                        }}
                        onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
                      />
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '8px', fontWeight: 600 }}>
                        {language === 'Tamil' ? `படம் ${iIdx + 1}` : `Figure ${iIdx + 1}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {content.content.split('\n\n').map((block, idx) => {
              const rawTrimmed = block.trim();
              if (!rawTrimmed) return null;

              // Check if block is a Markdown table
              if (rawTrimmed.includes('|') && rawTrimmed.split('\n').filter(l => l.trim().startsWith('|')).length >= 2) {
                return renderTable(rawTrimmed, idx);
              }

              const trimmed = cleanMathText(rawTrimmed);
              if (!trimmed) return null;

              // H2 Heading (## Title)
              if (trimmed.startsWith('## ')) {
                const headingText = trimmed.replace(/^##\s+/, '');
                return (
                  <h2 key={idx} style={{
                    fontSize: '1.35rem', fontWeight: '800', color: '#1e293b',
                    margin: '2rem 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '8px',
                    borderBottom: '2px solid #f1f5f9', paddingBottom: '8px'
                  }}>
                    {renderInline(headingText)}
                  </h2>
                );
              }

              // H3 Heading (### Title)
              if (trimmed.startsWith('### ')) {
                const headingText = trimmed.replace(/^###\s+/, '');
                return (
                  <h3 key={idx} style={{
                    fontSize: '1.18rem', fontWeight: '700', color: '#2563eb',
                    margin: '1.5rem 0 0.6rem 0'
                  }}>
                    {renderInline(headingText)}
                  </h3>
                );
              }

              // H4 Heading (#### Title)
              if (trimmed.startsWith('#### ')) {
                const headingText = trimmed.replace(/^####\s+/, '');
                return (
                  <h4 key={idx} style={{
                    fontSize: '1.05rem', fontWeight: '700', color: '#0f172a',
                    margin: '1.2rem 0 0.4rem 0'
                  }}>
                    {renderInline(headingText)}
                  </h4>
                );
              }

              // Callout / Did you know block
              const lower = trimmed.toLowerCase();
              if (lower.includes('did you know') || lower.includes('உங்களுக்குத் தெரியுமா') || lower.startsWith('note:') || lower.startsWith('important:')) {
                return (
                  <div key={idx} style={{
                    background: '#eff6ff', border: '1px solid #bfdbfe', borderLeft: '5px solid #2563eb',
                    borderRadius: '14px', padding: '1.1rem 1.4rem', margin: '1.4rem 0',
                    color: '#1e3a8a', fontSize: '0.98rem', boxShadow: '0 2px 6px rgba(37,99,235,0.05)'
                  }}>
                    {renderInline(trimmed)}
                  </div>
                );
              }

              // Process lines within the block to guarantee lists are never lumped into paragraphs
              const lines = trimmed.split('\n');
              const segments = [];
              let currentList = null; // { type: 'ul' | 'ol', items: [] }
              let currentParaLines = [];

              const flushPara = () => {
                if (currentParaLines.length > 0) {
                  segments.push({ type: 'para', text: currentParaLines.join(' ') });
                  currentParaLines = [];
                }
              };
              const flushList = () => {
                if (currentList) {
                  segments.push(currentList);
                  currentList = null;
                }
              };

              for (const line of lines) {
                const lTrim = line.trim();
                if (!lTrim) continue;

                if (lTrim.startsWith('- ') || lTrim.startsWith('* ')) {
                  flushPara();
                  if (!currentList || currentList.type !== 'ul') {
                    flushList();
                    currentList = { type: 'ul', items: [] };
                  }
                  currentList.items.push(lTrim.replace(/^[-*]\s+/, ''));
                } else if (/^\d+\.\s+/.test(lTrim)) {
                  flushPara();
                  if (!currentList || currentList.type !== 'ol') {
                    flushList();
                    currentList = { type: 'ol', items: [] };
                  }
                  currentList.items.push(lTrim.replace(/^\d+\.\s+/, ''));
                } else {
                  flushList();
                  currentParaLines.push(lTrim);
                }
              }
              flushPara();
              flushList();

              return (
                <div key={idx} style={{ marginBottom: '1.2rem' }}>
                  {segments.map((seg, sIdx) => {
                    if (seg.type === 'para') {
                      return (
                        <p key={sIdx} style={{ margin: '0 0 0.8rem 0', lineHeight: '1.8' }}>
                          {renderInline(seg.text)}
                        </p>
                      );
                    }
                    if (seg.type === 'ul') {
                      return (
                        <ul key={sIdx} style={{
                          margin: '0.6rem 0 1rem 1.4rem', paddingLeft: '0.5rem',
                          color: '#334155', lineHeight: '1.75'
                        }}>
                          {seg.items.map((it, iIdx) => (
                            <li key={iIdx} style={{ marginBottom: '8px' }}>
                              {renderInline(it)}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    if (seg.type === 'ol') {
                      return (
                        <ol key={sIdx} style={{
                          margin: '0.6rem 0 1rem 1.4rem', paddingLeft: '0.5rem',
                          color: '#334155', lineHeight: '1.75'
                        }}>
                          {seg.items.map((it, iIdx) => (
                            <li key={iIdx} style={{ marginBottom: '8px' }}>
                              {renderInline(it)}
                            </li>
                          ))}
                        </ol>
                      );
                    }
                    return null;
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{
          background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: '16px',
          padding: '2rem', width: '100%', marginBottom: '2rem', textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>📚</div>
          <h3 style={{ color: '#92400e', marginBottom: '0.5rem' }}>Textbook Content Not Extracted</h3>
          <p style={{ color: '#78350f', fontSize: '0.95rem', lineHeight: '1.6' }}>
            {content?.source_note}
          </p>
          <div style={{
            background: 'white', borderRadius: '12px', padding: '1.2rem',
            marginTop: '1.2rem', border: '1px solid #fde68a', textAlign: 'left'
          }}>
            <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '8px' }}>
              📌 What you should do:
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.4rem', color: '#78350f', lineHeight: '1.7' }}>
              <li>Open your Class 6 Science textbook ({language}).</li>
              <li>Read <strong>{content?.title}</strong> carefully from the chapter.</li>
              <li>Take notes on key definitions, examples, and diagrams.</li>
              <li>Return here when you are ready to take the test.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Read confirmation and proceed */}
      <div style={{
        width: '100%', marginTop: '1rem',
        background: 'white', border: '2px solid #e2e8f0', borderRadius: '16px',
        padding: '1.5rem'
      }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={readConfirmed}
            onChange={e => setReadConfirmed(e.target.checked)}
            style={{ width: '20px', height: '20px', marginTop: '2px', cursor: 'pointer' }}
          />
          <span style={{ color: '#334155', fontSize: '0.97rem', lineHeight: '1.5' }}>
            I have read and understood the content about <strong>{content?.title}</strong>.
            I am ready to take the baseline examination (Test A).
          </span>
        </label>

        <div style={{ marginTop: '1.2rem' }}>
          <button
            onClick={handleStartTest}
            disabled={!readConfirmed}
            className="btn primary-btn"
            style={{ width: '100%', opacity: readConfirmed ? 1 : 0.5, cursor: readConfirmed ? 'pointer' : 'not-allowed' }}
          >
            I have finished learning — Start Test A 📝
          </button>
        </div>
      </div>

      <div style={{ height: '3rem' }} />
    </div>
  );
}
