import React from 'react';

export default function Welcome({ onStart }) {
  return (
    <div className="page" id="page-welcome">
      <h1 className="glow-text title">Discover Your Intelligence</h1>
      <p className="subtitle">Spatial • Linguistic • Musical</p>
      <button className="btn primary-btn" onClick={onStart}>Start Assessment</button>
    </div>
  );
}
