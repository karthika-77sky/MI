import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const spatialData = [
  {
    video: '/video1.mp4',
    questions: [
      { text: "What shape did the spinning cloud mostly become?", weight: 1, options: ["A flat disc with a dense middle", "A long straight line", "A cube", "A small dot"], answer: 0 },
      { text: "How did the new Sun look?", weight: 2, options: ["A bright, hot ball", "A cold, dark rock", "A thin sheet of ice", "A tiny cloud"], answer: 0 },
      { text: "Where did colder, outer planets form?", weight: 3, options: ["Far from the center", "Right in the center", "Scattered above", "Inside the Sun"], answer: 0 }
    ]
  },
  {
    video: '/video2.mp4',
    questions: [
      { text: "Why do we sometimes only see part of the Moon?", weight: 1, options: ["Sun only lights up half", "Turns off night light", "Earth blocks all sunlight", "Changes size"], answer: 0 },
      { text: "Which phase is 'first quarter'?", weight: 2, options: ["Completely dark", "Half lit, quarter through", "Completely lit", "Small sliver"], answer: 1 },
      { text: "If the Moon is full, when will it rise?", weight: 3, options: ["Sun rises", "Noon", "Sun sets", "Midnight"], answer: 2 }
    ]
  },
  {
    video: '/video3.mp4',
    questions: [
      { text: "What is the formula for the volume of a pyramid?", weight: 1, options: ["Area base × height", "1/2 × Area × height", "1/3 × Area × height", "Area ÷ height"], answer: 2 },
      { text: "Surface area of a square-based pyramid?", weight: 3, options: ["B² + 2BL", "B² + 4BL", "4B² + 2BL", "1/3 B² + L"], answer: 0 },
      { text: "Area of an equilateral triangle base?", weight: 3, options: ["1/2 × B × height", "(3/4) B²", "(√3/4) B²", "B²"], answer: 2 }
    ]
  },
  {
    video: '/video4.mp4',
    questions: [
      { text: "Describe a hinge joint?", weight: 1, options: ["Ball in socket", "Bones glide slightly", "Moves forward/backward", "Rotates inside ring"], answer: 2 },
      { text: "Tissue covering joint from outside?", weight: 2, options: ["Ligament", "Cartilage", "Muscle", "Tendon"], answer: 1 },
      { text: "Which pair matches joint type with example?", weight: 2, options: ["Pivot — wrist", "Ball and socket — shoulder", "Gliding — elbow", "Hinge — hip"], answer: 1 }
    ]
  },
  {
    video: '/video5.mp4',
    questions: [
      { text: "Longest bone extending hip to knee?", weight: 1, options: ["Tibia", "Femur", "Humerus", "Fibula"], answer: 1 },
      { text: "Curved bones protecting heart?", weight: 2, options: ["Vertebral column", "Sternum", "Ribs", "Pelvic girdle"], answer: 2 },
      { text: "Lateral bone of forearm?", weight: 3, options: ["Ulna", "Humerus", "Radius", "Clavicle"], answer: 2 }
    ]
  }
];

export const maxSpatialScore = spatialData.reduce((acc, v) => acc + v.questions.reduce((sum, q) => sum + q.weight, 0), 0);

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

export default function SpatialAssessment({ user }) {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Test Started state (first display instructions before starting)
  const [testStarted, setTestStarted] = useState(false);

  // Proctored Timer & Anti-Cheat state
  const [timeLeft, setTimeLeft] = useState(2700); // 45 minutes (2700s)
  const [tabWarnings, setTabWarnings] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Initialize shuffled questions
  useEffect(() => {
    const shuffledData = spatialData.map(block => ({
      ...block,
      questions: shuffleArray(block.questions).map(q => ({
        ...q,
        options: shuffleArray(q.options.map((opt, i) => ({ text: opt, originalIndex: i })))
      }))
    }));
    setData(shuffledData);
  }, []);

  // 15-Minute Countdown Timer (only ticks when test is started)
  useEffect(() => {
    if (!testStarted) return;

    if (timeLeft <= 0) {
      alert("⏰ Time is up! Submitting your test automatically...");
      calculateAndSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [testStarted, timeLeft]);

  // Anti-Cheat: Detect Tab Switch & Blur (only active when test is started)
  useEffect(() => {
    if (!testStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitting) {
        setTabWarnings(prev => {
          const next = prev + 1;
          setShowWarningModal(true);
          if (next >= 3) {
            alert("🚨 Multiple tab switches detected! Your assessment is auto-submitting due to anti-cheat violation.");
            calculateAndSubmit();
          }
          return next;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [testStarted, isSubmitting]);

  // Prevent Context Menu & Clipboard Copy/Paste
  useEffect(() => {
    if (!testStarted) return;

    const preventAction = (e) => {
      e.preventDefault();
      alert("⚠️ Action blocked! Copy, paste, right-click, and AI tools are disabled during the test.");
    };

    document.addEventListener("contextmenu", preventAction);
    document.addEventListener("copy", preventAction);
    document.addEventListener("paste", preventAction);

    return () => {
      document.removeEventListener("contextmenu", preventAction);
      document.removeEventListener("copy", preventAction);
      document.removeEventListener("paste", preventAction);
    };
  }, [testStarted]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalQuestions = data.reduce((acc, b) => acc + b.questions.length, 0);
  const answeredCount = Object.keys(answers).length;

  const handleSelect = (qIndexStr, valueIndex) => {
    setAnswers({ ...answers, [qIndexStr]: valueIndex });
  };

  const calculateAndSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    let score = 0;
    const answersToPost = [];

    data.forEach((block, bIdx) => {
      block.questions.forEach((q, qIdx) => {
        const key = `${bIdx}_${qIdx}`;
        if (answers[key] !== undefined) {
          const isCorrect = answers[key] === q.answer;
          if (isCorrect) score += q.weight;
          answersToPost.push({
            questionId: `spatial_${key}`,
            selectedOption: answers[key],
            isCorrect
          });
        }
      });
    });

    const normalizedScore = Math.round((score / maxSpatialScore) * 100);

    try {
      const res = await fetch('http://localhost:3001/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, type: 'Spatial', score: normalizedScore })
      });
      const assessmentData = await res.json();
      
      for (const ans of answersToPost) {
        await fetch('http://localhost:3001/api/answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assessmentId: assessmentData.id, ...ans })
        });
      }

      navigate('/results');
    } catch (err) {
      console.error(err);
      alert('Failed to save assessment');
      setIsSubmitting(false);
    }
  };

  // STEP 1: PRE-TEST INSTRUCTIONS SCREEN
  if (!testStarted) {
    return (
      <div className="page" style={{ paddingTop: '2rem' }}>
        <button className="btn back-btn" onClick={() => navigate('/dashboard')}>← Dashboard</button>
        
        <div style={{
          maxWidth: '750px', margin: '1.5rem auto 0 auto',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          border: '2px solid #38bdf8', borderRadius: '24px', padding: '2.5rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(56, 189, 248, 0.15)',
          color: '#ffffff'
        }}>
          <div style={{
            display: 'inline-block', background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid #38bdf8', color: '#38bdf8',
            padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold',
            marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px'
          }}>
            🛡️ PROCTORED TEST GUIDELINES
          </div>

          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0 0 1rem 0', color: '#ffffff' }}>
            Spatial Intelligence Assessment Instructions 🧠
          </h1>

          <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            Welcome! Before starting your Spatial Intelligence Assessment, please read the test instructions and proctoring rules carefully below.
          </p>

          {/* Rules List Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2.5rem' }}>
            
            <div style={{ background: '#151c2c', border: '1px solid #28354e', borderRadius: '16px', padding: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ fontSize: '1.8rem' }}>⏱️</div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#38bdf8' }}>45-Minute Time Limit</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  You have <strong>45 minutes</strong> to watch the concept videos and answer all questions. The countdown timer starts as soon as you click "Start Test".
                </p>
              </div>
            </div>

            <div style={{ background: '#151c2c', border: '1px solid #28354e', borderRadius: '16px', padding: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ fontSize: '1.8rem' }}>🚫</div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#ef4444' }}>Strict Anti-Cheat & Tab Locking</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  Do not switch browser tabs or minimize the window! Leaving the test tab logs an anti-cheat warning. <strong>3 warnings will automatically submit your assessment.</strong>
                </p>
              </div>
            </div>

            <div style={{ background: '#151c2c', border: '1px solid #28354e', borderRadius: '16px', padding: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ fontSize: '1.8rem' }}>🤖</div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#a855f7' }}>No AI Tools or External Assistance</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  Copying text, pasting, right-clicking, and using AI assistant tools are disabled during the test. Complete all answers independently.
                </p>
              </div>
            </div>

            <div style={{ background: '#151c2c', border: '1px solid #28354e', borderRadius: '16px', padding: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ fontSize: '1.8rem' }}>✅</div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#34d399' }}>Answer All Questions Before Submitting</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  Each question carries specific weight. Answer all questions and click <strong>Submit Final Assessment</strong> when done.
                </p>
              </div>
            </div>

          </div>

          {/* Action Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => setTestStarted(true)}
              style={{
                background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                color: '#ffffff', border: 'none', borderRadius: '16px',
                padding: '16px 36px', fontSize: '1.15rem', fontWeight: '800',
                cursor: 'pointer', boxShadow: '0 10px 25px rgba(14, 165, 233, 0.4)',
                transition: 'transform 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              I Understand & Start Assessment 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: ACTIVE TEST ASSESSMENT SCREEN
  return (
    <div className="page" style={{ paddingTop: '1.5rem', userSelect: 'none' }}>
      
      {/* Proctored Header & Timer Bar */}
      <div style={{
        width: '100%', maxWidth: '800px', margin: '0 auto 1.5rem auto',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        border: '2px solid #38bdf8', borderRadius: '16px', padding: '1rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 8px 20px rgba(56, 189, 248, 0.2)'
      }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
            🛡️ PROCTORED ASSESSMENT MODE
          </span>
          <h2 style={{ fontSize: '1.3rem', color: '#ffffff', margin: '2px 0 0 0', fontWeight: '800' }}>
            Spatial Intelligence Test
          </h2>
        </div>

        {/* Timer Display */}
        <div style={{
          background: timeLeft < 120 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.15)',
          border: `1px solid ${timeLeft < 120 ? '#ef4444' : '#38bdf8'}`,
          borderRadius: '12px', padding: '8px 16px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', color: timeLeft < 120 ? '#ef4444' : '#94a3b8', fontWeight: 'bold' }}>TIME REMAINING</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: timeLeft < 120 ? '#ef4444' : '#38bdf8', fontFamily: 'monospace' }}>
            ⏱️ {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Proctoring Rules Alert */}
      <div style={{
        width: '100%', maxWidth: '800px', margin: '0 auto 1.5rem auto',
        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)',
        borderRadius: '12px', padding: '10px 16px', fontSize: '0.88rem', color: '#fca5a5',
        display: 'flex', alignItems: 'center', gap: '10px'
      }}>
        <span>⚠️</span>
        <div>
          <strong>Strict Test Rules:</strong> Do not switch tabs, copy text, or use external AI assistance. Tab switches are logged ({tabWarnings}/3 warnings).
        </div>
      </div>

      {/* Assessment Question Cards */}
      <div className="card" style={{ maxWidth: '800px' }}>
        {data.map((block, bIdx) => (
          <div key={bIdx} className="video-container">
            <video controls className="styled-player" src={block.video} />
            {block.questions.map((q, qIdx) => {
              const globalKey = `${bIdx}_${qIdx}`;
              return (
                <div key={qIdx} className="question-card">
                  <div className="weight-badge">Weight: {q.weight}</div>
                  <div className="question-text">{q.text}</div>
                  <div className="options-container">
                    {q.options.map((opt, oIdx) => (
                      <label key={oIdx} className={`option-label ${answers[globalKey] === opt.originalIndex ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          className="option-input"
                          name={`q_${globalKey}`}
                          onChange={() => handleSelect(globalKey, opt.originalIndex)}
                          checked={answers[globalKey] === opt.originalIndex}
                        />
                        <div className="custom-radio"></div>
                        <span className="option-text">{opt.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Submit Action */}
      <div style={{ marginTop: '2rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <button 
          className="btn primary-btn" 
          onClick={() => {
            if (answeredCount < totalQuestions) {
              alert(`Please answer all questions before submitting. (${answeredCount}/${totalQuestions} answered)`);
              return;
            }
            calculateAndSubmit();
          }} 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting Assessment...' : 'Submit Final Assessment'}
        </button>
      </div>

      {/* Anti-Cheat Tab Switch Warning Modal */}
      {showWarningModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
        }}>
          <div style={{
            background: '#1e293b', border: '2px solid #ef4444', borderRadius: '20px',
            padding: '2rem', maxWidth: '450px', width: '90%', textAlign: 'center', color: '#ffffff'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🚨</div>
            <h3 style={{ fontSize: '1.4rem', color: '#ef4444', margin: '0 0 0.5rem 0' }}>Anti-Cheat Warning!</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 1.5rem 0' }}>
              Tab switch or focus loss was detected! Leaving the assessment window is forbidden.
            </p>
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '10px', color: '#fca5a5', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              Warning {tabWarnings} of 3 (Auto-submits at 3)
            </div>
            <button
              onClick={() => setShowWarningModal(false)}
              style={{
                background: '#ef4444', color: '#ffffff', border: 'none',
                padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              I Understand & Resume Test
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
