import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import SpatialAssessment from './components/SpatialAssessment';
import LinguisticAssessment from './components/LinguisticAssessment';
import MusicalAssessment from './components/MusicalAssessment';
import Results from './components/Results';
import LearningSpatial from './components/LearningSpatial';
import LearningLinguistic from './components/LearningLinguistic';
import LearningMusical from './components/LearningMusical';
import SpatialDashboard from './components/SpatialDashboard';

import './index.css';

function App() {
  const [user, setUser] = useState(null);

  // Background stars
  useEffect(() => {
    // Background UI is now handled purely by CSS using .modern-bg
  }, []);

  return (
    <Router>
      <div className="modern-bg">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>
      
      {user && (
        <div style={{
          position: 'absolute', top: '20px', right: '30px', zIndex: 1000,
          display: 'flex', alignItems: 'center', gap: '15px'
        }}>
          <span style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-color)', fontSize: '1.1rem' }}>
            Hello, {user.username} ✦
          </span>
          <button 
            onClick={() => setUser(null)}
            style={{
              background: 'white', border: '1px solid var(--card-border)',
              color: 'var(--text-main)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
              fontSize: '0.9rem', transition: 'all 0.3s', fontWeight: '500', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
            onMouseOver={(e) => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#cbd5e1'; }}
            onMouseOut={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = 'var(--card-border)'; }}
          >
            Sign Out
          </button>
        </div>
      )}

      <main>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Auth onLogin={setUser} />} />
          <Route path="/dashboard" element={user ? <Dashboard user={user} onLogout={() => setUser(null)} /> : <Navigate to="/" />} />
          <Route path="/spatial" element={user ? <SpatialAssessment user={user} /> : <Navigate to="/" />} />
          <Route path="/linguistic" element={user ? <LinguisticAssessment user={user} /> : <Navigate to="/" />} />
          <Route path="/musical" element={user ? <MusicalAssessment user={user} /> : <Navigate to="/" />} />
          <Route path="/results" element={user ? <Results user={user} /> : <Navigate to="/" />} />
          <Route path="/spatial-dashboard" element={user ? <SpatialDashboard user={user} /> : <Navigate to="/" />} />
          <Route path="/learn-spatial" element={user ? <LearningSpatial /> : <Navigate to="/" />} />
          <Route path="/learn-linguistic" element={user ? <LearningLinguistic /> : <Navigate to="/" />} />
          <Route path="/learn-musical" element={user ? <LearningMusical /> : <Navigate to="/" />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
