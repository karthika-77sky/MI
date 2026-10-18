// src/components/Examination.jsx
// Handles both Test A (baseline) and Test B (final).
// For Test B: fetches the exact saved Test A questions from the backend — never generates new ones.
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cleanMathText } from '../utils/mathCleaner';

const PYTHON_URL = 'http://localhost:8000';
const NODE_URL   = 'http://localhost:3001';

export default function Examination({ user }) {
  const navigate = useNavigate();
  const { phase } = useParams();   // 'baseline' | 'final'
  const isBaseline = phase === 'baseline';

  const sessionId  = sessionStorage.getItem('currentSessionId');
  const topicKey   = sessionStorage.getItem('currentTopicKey');
  const language   = sessionStorage.getItem('currentLanguage') || 'English';

  const [questions, setQuestions]   = useState([]);
  const [answers, setAnswers]       = useState({});  // { questionIndex: studentAnswerString }
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [topicTitle, setTopicTitle] = useState('');
  const [totalMarks, setTotalMarks] = useState(0);
  const [startTime]                 = useState(Date.now());

  // Anti-cheat: tab switch warning for Test A
  const [tabWarnings, setTabWarnings] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (!sessionId || !topicKey) { navigate('/topic-select'); return; }
    loadQuestions();
  }, []);

  // Tab switch detection (only during active test)
  useEffect(() => {
    if (loading || submitting) return;
    const handleVisibility = () => {
      if (document.hidden && !isSubmittingRef.current) {
        setTabWarnings(prev => {
          const next = prev + 1;
          setShowWarning(true);
          if (next >= 3) { alert('⚠️ Too many tab switches. Submitting automatically.'); handleSubmit(); }
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [loading, submitting]);

  const loadQuestions = async () => {
    try {
      if (isBaseline) {
        // Generate questions via Gemini (or fallback)
        // First get topic title from topics list
        const topicsRes = await fetch(`${PYTHON_URL}/api/topics`);
        const topicsData = await topicsRes.json();
        const topic = (topicsData.topics || []).find(t => t.key === topicKey);
        const title = topic ? (language === 'English' ? topic.titleEn : topic.titleTa) : topicKey;
        setTopicTitle(title);

        const genRes = await fetch(`${PYTHON_URL}/api/exam/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic_key: topicKey, language, topic_title: title }),
        });
        if (!genRes.ok) throw new Error(`Question generation failed (${genRes.status})`);
        const genData = await genRes.json();

        setQuestions(genData.questions);
        setTotalMarks(genData.total_marks);
        setTopicTitle(genData.topic_title);

        // Save questions to the backend immediately (so Test B can reuse them)
        const questionsPayload = genData.questions.map(q => ({
          type: q.type, text: q.text, options: q.options,
          correctAnswer: q.correctAnswer, marks: q.marks,
        }));
        const saveRes = await fetch(`${NODE_URL}/api/sessions/${sessionId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions: questionsPayload }),
        });
        if (!saveRes.ok) {
          const errData = await saveRes.json().catch(() => ({}));
          // 409 = already saved; that's fine (re-entry into baseline page)
          if (saveRes.status !== 409) {
            console.warn('Question save warning:', errData.error);
          }
        }
      } else {
        // Test B: load EXACTLY the saved questions — no regeneration
        const savedRes = await fetch(`${NODE_URL}/api/sessions/${sessionId}/questions`);
        if (!savedRes.ok) throw new Error('Could not retrieve saved questions from server');
        const savedQuestions = await savedRes.json();
        if (!savedQuestions.length) throw new Error('No saved questions found. Please complete Test A first.');

        setQuestions(savedQuestions.map(q => ({
          index: q.index,
          type: q.type,
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          marks: q.marks,
        })));
        setTotalMarks(savedQuestions.reduce((s, q) => s + q.marks, 0));

        // Get topic title from session
        const sessRes = await fetch(`${NODE_URL}/api/sessions/by-id/${sessionId}`);
        const sess = await sessRes.json();
        setTopicTitle(sess.topic || '');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (qIndex, value) => {
    setAnswers(prev => ({ ...prev, [String(qIndex)]: value }));
  };

  const allAnswered = () => {
    return questions.every((_, i) => {
      const ans = answers[String(i)];
      return ans !== undefined && ans !== null && String(ans).trim() !== '';
    });
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setSubmitting(true);

    try {
      // Evaluate each answer
      let totalObtained = 0;
      const savedQuestions = await fetch(`${NODE_URL}/api/sessions/${sessionId}/questions`)
        .then(r => r.json()).catch(() => []);

      const answersPayload = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const studentAns = String(answers[String(i)] || '');
        const dbQuestion = savedQuestions[i] || null;
        const questionId = dbQuestion?.id || null;

        let evalRes;
        try {
          const evalResponse = await fetch(`${PYTHON_URL}/api/exam/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question_type: q.type,
              question_text: q.text,
              correct_answer: q.correctAnswer,
              student_answer: studentAns,
              marks: q.marks,
              language,
            }),
          });
          evalRes = await evalResponse.json();
        } catch {
          // Fallback: 0 marks
          evalRes = { marks_awarded: 0, feedback: 'Evaluation unavailable.' };
        }

        totalObtained += evalRes.marks_awarded || 0;
        if (questionId) {
          answersPayload.push({
            questionId,
            studentAnswer: studentAns,
            marksAwarded: evalRes.marks_awarded || 0,
            feedback: evalRes.feedback || '',
          });
        }
      }

      // Save attempt
      const attemptRes = await fetch(`${NODE_URL}/api/sessions/${sessionId}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: isBaseline ? 'baseline' : 'final',
          answers: answersPayload,
          totalMarksPossible: totalMarks,
          marksObtained: Math.round(totalObtained * 10) / 10,
        }),
      });

      if (!attemptRes.ok) {
        const errData = await attemptRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save attempt');
      }

      const attemptData = await attemptRes.json();

      // Store result for the results page
      sessionStorage.setItem(`examResult_${phase}`, JSON.stringify({
        marksObtained: Math.round(totalObtained * 10) / 10,
        totalMarks,
        phase,
        attemptId: attemptData.attemptId,
        questionsCount: questions.length,
        timeTakenSecs: Math.floor((Date.now() - startTime) / 1000),
      }));

      navigate(`/exam-results/${phase}`);
    } catch (e) {
      alert('Submission error: ' + e.message);
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ justifyContent: 'center', paddingTop: '4rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            {isBaseline ? '⚙️' : '📋'}
          </div>
          <h2 className="glow-text">
            {isBaseline ? 'Generating Examination Questions...' : 'Loading Examination...'}
          </h2>
          <p style={{ color: '#64748b', maxWidth: '500px', margin: '0 auto' }}>
            {isBaseline
              ? 'AI is creating a structured examination based on the textbook topic. This may take a moment.'
              : 'Retrieving your original Test A questions to ensure a fair comparison.'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page" style={{ paddingTop: '2rem' }}>
        <div className="card" style={{ textAlign: 'center', color: '#ef4444' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
          <h3>Examination Load Error</h3>
          <p style={{ color: '#64748b' }}>{error}</p>
          <button className="btn back-btn" style={{ marginTop: '1.5rem' }}
            onClick={() => navigate(isBaseline ? '/textbook-learn' : '/spatial-learning')}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const mcqQuestions   = questions.filter(q => q.type === 'mcq');
  const shortQuestions = questions.filter(q => q.type === 'short');
  const descQuestions  = questions.filter(q => q.type === 'descriptive');
  const answeredCount  = Object.keys(answers).filter(k => String(answers[k]).trim() !== '').length;

  return (
    <div className="page" style={{ paddingTop: '1.5rem', maxWidth: '860px' }}>

      {/* Tab switch warning modal */}
      {showWarning && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '2rem',
            maxWidth: '420px', width: '90%', textAlign: 'center', border: '3px solid #ef4444'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🚨</div>
            <h3 style={{ color: '#ef4444' }}>Tab Switch Detected!</h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Warning {tabWarnings} of 3. Switching tabs during the examination is not permitted.
              Auto-submit will occur on the third warning.
            </p>
            <button
              onClick={() => setShowWarning(false)}
              style={{ marginTop: '1rem', background: '#ef4444', color: 'white', border: 'none',
                padding: '10px 24px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
              Resume Examination
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        width: '100%', background: isBaseline
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #1a0530 0%, #2d0a4e 100%)',
        borderRadius: '20px', padding: '1.5rem',
        border: isBaseline ? '2px solid #38bdf8' : '2px solid #a855f7',
        marginBottom: '2rem', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
            color: isBaseline ? '#38bdf8' : '#a855f7', marginBottom: '4px' }}>
            {isBaseline ? '📝 Test A — Baseline Examination' : '🎯 Test B — Final Examination'}
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white' }}>{topicTitle}</div>
          <div style={{
            display: 'inline-block', marginTop: '6px', padding: '3px 12px',
            background: isBaseline ? 'rgba(56,189,248,0.15)' : 'rgba(168,85,247,0.15)',
            border: isBaseline ? '1px solid #38bdf8' : '1px solid #a855f7',
            borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
            color: isBaseline ? '#38bdf8' : '#a855f7',
          }}>
            📚 Topic: {topicTitle}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '6px' }}>
            Language: {language} · {questions.length} questions · {totalMarks} total marks
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Answered</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900,
            color: answeredCount === questions.length ? '#34d399' : '#f59e0b' }}>
            {answeredCount}/{questions.length}
          </div>
        </div>
      </div>

      {!isBaseline && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px',
          padding: '0.8rem 1.2rem', marginBottom: '1.5rem', width: '100%',
          color: '#166534', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          ℹ️ <strong>Test B uses the exact same questions as Test A</strong> — same wording, same options, same marks.
        </div>
      )}

      {/* Instructions */}
      <div style={{
        background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: '12px',
        padding: '1rem 1.3rem', marginBottom: '2rem', width: '100%', fontSize: '0.9rem', color: '#78350f'
      }}>
        <strong>📌 Instructions:</strong> Answer all questions carefully.
        MCQs are worth 1 mark each. Short-answer questions are worth 2 marks each.
        Descriptive questions are worth 5 marks each. Total marks: <strong>{totalMarks}</strong>.
      </div>

      {/* MCQ Section */}
      {mcqQuestions.length > 0 && (
        <div style={{ width: '100%', marginBottom: '2rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: '#0f172a',
            borderBottom: '2px solid #2563eb', paddingBottom: '8px', marginBottom: '1.2rem' }}>
            Section A — Multiple Choice Questions (1 mark each)
          </h3>
          {mcqQuestions.map((q, sectionIdx) => {
            const globalIdx = questions.indexOf(q);
            return (
              <div key={globalIdx} className="question-card" style={{ marginBottom: '1.2rem' }}>
                <div className="weight-badge">1 mark</div>
                <div className="question-text" style={{ fontSize: '1.05rem', paddingRight: '80px' }}>
                  Q{sectionIdx + 1}. {cleanMathText(q.text)}
                </div>
                <div className="options-container">
                  {(q.options || []).map((opt, oIdx) => (
                    <label key={oIdx}
                      className={`option-label ${answers[String(globalIdx)] === String(oIdx) ? 'selected' : ''}`}>
                      <input type="radio" className="option-input"
                        name={`q_${globalIdx}`}
                        onChange={() => handleAnswer(globalIdx, String(oIdx))}
                        checked={answers[String(globalIdx)] === String(oIdx)} />
                      <div className="custom-radio" />
                      <span className="option-text">
                        <span style={{ fontWeight: 700, marginRight: '6px' }}>
                          {String.fromCharCode(65 + oIdx)}.
                        </span>
                        {cleanMathText(opt)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Short Answer Section */}
      {shortQuestions.length > 0 && (
        <div style={{ width: '100%', marginBottom: '2rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: '#0f172a',
            borderBottom: '2px solid #059669', paddingBottom: '8px', marginBottom: '1.2rem' }}>
            Section B — Short Answer Questions (2 marks each)
          </h3>
          {shortQuestions.map((q, sectionIdx) => {
            const globalIdx = questions.indexOf(q);
            return (
              <div key={globalIdx} className="question-card" style={{ marginBottom: '1.2rem' }}>
                <div className="weight-badge" style={{ background: '#f0fdf4', color: '#059669', borderColor: '#86efac' }}>
                  2 marks
                </div>
                <div className="question-text" style={{ fontSize: '1.05rem', paddingRight: '80px' }}>
                  Q{mcqQuestions.length + sectionIdx + 1}. {cleanMathText(q.text)}
                </div>
                <textarea
                  placeholder="Write your answer here (2-3 sentences)..."
                  value={answers[String(globalIdx)] || ''}
                  onChange={e => handleAnswer(globalIdx, e.target.value)}
                  rows={4}
                  style={{
                    width: '100%', padding: '0.9rem', borderRadius: '10px',
                    border: '1.5px solid #e2e8f0', fontFamily: 'var(--font-body)',
                    fontSize: '1rem', outline: 'none', resize: 'vertical', color: '#1e293b',
                    background: '#f8fafc', lineHeight: '1.6',
                    fontFamily: language === 'Tamil' ? "'Noto Sans Tamil', sans-serif" : 'inherit'
                  }}
                  onFocus={e => e.target.style.borderColor = '#059669'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Descriptive Section */}
      {descQuestions.length > 0 && (
        <div style={{ width: '100%', marginBottom: '2rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: '#0f172a',
            borderBottom: '2px solid #7c3aed', paddingBottom: '8px', marginBottom: '1.2rem' }}>
            Section C — Descriptive Questions (5 marks each)
          </h3>
          {descQuestions.map((q, sectionIdx) => {
            const globalIdx = questions.indexOf(q);
            return (
              <div key={globalIdx} className="question-card" style={{ marginBottom: '1.2rem' }}>
                <div className="weight-badge" style={{ background: '#f5f3ff', color: '#7c3aed', borderColor: '#c4b5fd' }}>
                  5 marks
                </div>
                <div className="question-text" style={{ fontSize: '1.05rem', paddingRight: '80px' }}>
                  Q{mcqQuestions.length + shortQuestions.length + sectionIdx + 1}. {cleanMathText(q.text)}
                </div>
                <textarea
                  placeholder="Write a detailed answer (1-2 paragraphs with examples)..."
                  value={answers[String(globalIdx)] || ''}
                  onChange={e => handleAnswer(globalIdx, e.target.value)}
                  rows={8}
                  style={{
                    width: '100%', padding: '0.9rem', borderRadius: '10px',
                    border: '1.5px solid #e2e8f0', fontFamily: 'var(--font-body)',
                    fontSize: '1rem', outline: 'none', resize: 'vertical', color: '#1e293b',
                    background: '#f8fafc', lineHeight: '1.7',
                    fontFamily: language === 'Tamil' ? "'Noto Sans Tamil', sans-serif" : 'inherit'
                  }}
                  onFocus={e => e.target.style.borderColor = '#7c3aed'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Submit */}
      <div style={{ width: '100%', marginBottom: '3rem' }}>
        {!allAnswered() && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
            padding: '0.8rem 1.2rem', marginBottom: '1rem', color: '#b91c1c', fontSize: '0.9rem'
          }}>
            ⚠️ Please answer all {questions.length} questions before submitting.
            ({answeredCount}/{questions.length} answered)
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={submitting || !allAnswered()}
          className="btn primary-btn"
          style={{
            width: '100%', fontSize: '1.1rem',
            background: submitting ? '#94a3b8'
              : isBaseline ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
              : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
            opacity: (!allAnswered() && !submitting) ? 0.5 : 1,
            cursor: (!allAnswered() && !submitting) ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting
            ? '⏳ Evaluating answers and saving results...'
            : `Submit ${isBaseline ? 'Test A' : 'Test B'} — ${totalMarks} Total Marks`
          }
        </button>
      </div>
    </div>
  );
}
