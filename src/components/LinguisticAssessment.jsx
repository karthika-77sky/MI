import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const linguisticDataRaw = [
    { text: "Synonym: Enormous →", weight: 1, options: ["Heavy", "Huge", "Wide", "Tall"], answer: 1 },
    { text: "Synonym: Silent →", weight: 1, options: ["Quiet", "Loud", "Slow", "Scared"], answer: 0 },
    { text: "Synonym: Fragile →", weight: 2, options: ["Strong", "New", "Breakable", "Sharp"], answer: 2 },
    { text: "Synonym: Cautious →", weight: 2, options: ["Brave", "Careful", "Fast", "Angry"], answer: 1 },
    { text: "Antonym: Ancient →", weight: 1, options: ["Old", "Modern", "Big", "Early"], answer: 1 },
    { text: "Antonym: Generous →", weight: 2, options: ["Kind", "Greedy", "Rich", "Poor"], answer: 1 },
    { text: "Antonym: Permanent →", weight: 2, options: ["Forever", "Temporary", "Solid", "Long"], answer: 1 },
    { text: "Antonym: Optional →", weight: 3, options: ["Required", "Chosen", "Free", "Easy"], answer: 0 },
    { text: "Artist : Brush :: Writer :", weight: 1, options: ["Paper", "Pen", "Book", "Story"], answer: 1 },
    { text: "Chef : Knife :: Farmer :", weight: 2, options: ["Soil", "Crop", "Tractor", "Rain"], answer: 2 },
    { text: "Doctor : Stethoscope :: Astronomer :", weight: 2, options: ["Star", "Telescope", "Space", "Night"], answer: 1 },
    { text: "Carpenter : Saw :: Tailor :", weight: 2, options: ["Cloth", "Needle", "Suit", "Thread"], answer: 1 },
    { text: "Photographer : Camera :: Musician :", weight: 2, options: ["Song", "Instrument", "Stage", "Notes"], answer: 1 },
    { text: "Teacher : Chalkboard :: Pilot :", weight: 3, options: ["Plane", "Controls", "Sky", "Map"], answer: 0 },
    { text: "Hunger : Eat :: Thirst :", weight: 1, options: ["Water", "Drink", "Juice", "Throat"], answer: 1 },
    { text: "Rain : Mud :: Snow :", weight: 2, options: ["Cold", "Slush", "Winter", "White"], answer: 1 },
    { text: "Sun : Burn :: Ice :", weight: 2, options: ["Cold", "Freeze", "Water", "Melt"], answer: 3 },
    { text: "Joke : Laughter :: Sadness :", weight: 1, options: ["Happy", "Tears", "Face", "Sleep"], answer: 1 },
    { text: "Study : Grades :: Practice :", weight: 2, options: ["Game", "Skill", "Play", "Coach"], answer: 1 },
    { text: "Switch : Light :: Key :", weight: 2, options: ["Lock", "Unlock", "Metal", "Door"], answer: 0 },
    { text: "Which sentence uses 'Object' as a verb?", weight: 3, options: ["Mysterious object flew", "Must object to lawyer", "Main object of experiment", "Direct objects follow"], answer: 1 },
    { text: "'The river overflowed its bank' What does 'Bank' mean here?", weight: 3, options: ["Keep money", "Rising ground bordering water", "Row of similar objects", "Tilt aircraft"], answer: 1 },
    { text: "Which 'Critical' means essential?", weight: 3, options: ["Critical report", "Critical that you finish", "Critical condition"], answer: 1 },
    { text: "What does 'Solution' mean in 'test tube'?", weight: 3, options: ["Math answer", "Liquid mixture", "Act of solving"], answer: 1 },
    { text: "In 'weather the storm,' 'weather' means:", weight: 3, options: ["Temperature outside", "Wear away", "Endure difficult situation"], answer: 2 }
];

export const maxLinguisticScore = linguisticDataRaw.reduce((acc, q) => acc + q.weight, 0);

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

export default function LinguisticAssessment({ user }) {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-test instructions & proctoring timer state
  const [testStarted, setTestStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes (1800s)
  const [tabWarnings, setTabWarnings] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    const shuffledData = shuffleArray(linguisticDataRaw).map(q => ({
      ...q,
      options: shuffleArray(q.options.map((opt, i) => ({ text: opt, originalIndex: i })))
    }));
    setData(shuffledData);
  }, []);

  // 30-Minute Countdown Timer
  useEffect(() => {
    if (!testStarted) return;

    if (timeLeft <= 0) {
      alert("⏰ Time is up! Submitting your Linguistic assessment automatically...");
      calculateAndSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [testStarted, timeLeft]);

  // Anti-Cheat: Detect Tab Switch & Blur
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

  const totalQuestions = data.length;
  const answeredCount = Object.keys(answers).length;

  const handleSelect = (qIdx, valueIndex) => {
    setAnswers({ ...answers, [qIdx]: valueIndex });
  };

  const calculateAndSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    let score = 0;
    const answersToPost = [];

    data.forEach((q, qIdx) => {
      if (answers[qIdx] !== undefined) {
          const isCorrect = answers[qIdx] === q.answer;
          if (isCorrect) score += q.weight;
          answersToPost.push({
            questionId: `linguistic_${qIdx}`,
            selectedOption: answers[qIdx],
            isCorrect
          });
      }
    });

    const normalizedScore = Math.round((score / maxLinguisticScore) * 100);

    try {
        const res = await fetch('http://localhost:3001/api/assessments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, type: 'Linguistic', score: normalizedScore })
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
            Linguistic Intelligence Assessment Instructions 📚
          </h1>

          <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            Welcome! Before starting your Linguistic Intelligence Assessment, please review the rules and timing details carefully.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2.5rem' }}>
            
            <div style={{ background: '#151c2c', border: '1px solid #28354e', borderRadius: '16px', padding: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ fontSize: '1.8rem' }}>⏱️</div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#38bdf8' }}>30-Minute Time Limit</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  You have <strong>30 minutes</strong> to answer all 25 verbal, vocabulary, and vocabulary analogy questions.
                </p>
              </div>
            </div>

            <div style={{ background: '#151c2c', border: '1px solid #28354e', borderRadius: '16px', padding: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ fontSize: '1.8rem' }}>🚫</div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#ef4444' }}>Anti-Cheat & Tab Locking</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  Do not switch browser tabs or minimize the window! <strong>3 warnings will automatically submit your assessment.</strong>
                </p>
              </div>
            </div>

            <div style={{ background: '#151c2c', border: '1px solid #28354e', borderRadius: '16px', padding: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ fontSize: '1.8rem' }}>🤖</div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#a855f7' }}>No AI Tools or External Assistance</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  Copying text, pasting, right-clicking, and online dictionaries/AI tools are disabled. Complete all questions independently.
                </p>
              </div>
            </div>

          </div>

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
            Linguistic Intelligence Test
          </h2>
        </div>

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

      <div className="card">
        {data.map((q, qIdx) => (
          <div key={qIdx} className="question-card">
            <div className="weight-badge">Weight: {q.weight}</div>
            <div className="question-text">{q.text}</div>
            <div className="options-container">
              {q.options.map((opt, oIdx) => (
                <label key={oIdx} className={`option-label ${answers[qIdx] === opt.originalIndex ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    className="option-input"
                    name={`q_${qIdx}`}
                    onChange={() => handleSelect(qIdx, opt.originalIndex)}
                    checked={answers[qIdx] === opt.originalIndex}
                  />
                  <div className="custom-radio"></div>
                  <span className="option-text">{opt.text}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

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
          {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
        </button>
      </div>

      {/* Anti-Cheat Warning Modal */}
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
