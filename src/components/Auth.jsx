import React, { useState } from 'react';

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  
  // Sign Up Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');

  // Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Errors
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!fullName) newErrors.fullName = 'Full Name is required';
    if (!validateEmail(email)) newErrors.email = 'Valid email is required';
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!age) newErrors.age = 'Age is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Save to localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.email === email)) {
      setErrors({ global: 'Email already exists' });
      return;
    }

    const newUser = { id: Date.now(), fullName, email, password, age };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Auto-login (pass object compatible with existing layout id)
    onLogin({ id: newUser.id, username: fullName, email });
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!validateEmail(email)) newErrors.email = 'Valid email is required';
    if (!password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      setErrors({ global: 'Invalid email or password' });
      return;
    }

    onLogin({ id: user.id, username: user.fullName, email: user.email });
  };

  const errorStyle = { color: 'var(--error-color)', fontSize: '0.9rem', marginTop: '0.4rem', fontWeight: '500' };

  return (
    <div className="page" id="page-login" style={{ paddingTop: '2rem' }}>
      <h1 className="glow-text title" style={{ fontSize: '3rem', textAlign: 'center' }}>Multi-Intelligence Platform</h1>
      <p className="subtitle" style={{ marginBottom: '2rem' }}>Sign in to discover your potential</p>
      
      <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '2rem' }}>
        <div style={{ display: 'flex', marginBottom: '1.5rem', borderBottom: '1px solid rgba(138, 43, 226, 0.3)' }}>
            <button 
                onClick={() => { setIsLogin(true); setErrors({}); }}
                style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: 'none', color: isLogin ? 'var(--primary-color)' : 'var(--text-muted)', cursor: 'pointer', borderBottom: isLogin ? '2px solid var(--primary-color)' : 'none', fontSize: '1.1rem', fontFamily: 'var(--font-display)', fontWeight: isLogin ? '700' : '500' }}
            >Sign In</button>
            <button 
                onClick={() => { setIsLogin(false); setErrors({}); }}
                style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: 'none', color: !isLogin ? 'var(--primary-color)' : 'var(--text-muted)', cursor: 'pointer', borderBottom: !isLogin ? '2px solid var(--primary-color)' : 'none', fontSize: '1.1rem', fontFamily: 'var(--font-display)', fontWeight: !isLogin ? '700' : '500' }}
            >Sign Up</button>
        </div>

        {errors.global && <div style={{ color: '#ff4c4c', background: 'rgba(255, 76, 76, 0.1)', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ff4c4c', marginBottom: '1rem', textAlign: 'center' }}>{errors.global}</div>}

        <form onSubmit={isLogin ? handleSignIn : handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {!isLogin && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-main)', fontWeight: '500' }}>Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                {errors.fullName && <div style={errorStyle}>{errors.fullName}</div>}
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-main)', fontWeight: '500' }}>Age</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
                {errors.age && <div style={errorStyle}>{errors.age}</div>}
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-main)', fontWeight: '500' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {errors.email && <div style={errorStyle}>{errors.email}</div>}
          </div>
          
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-main)', fontWeight: '500' }}>Password</label>
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '15px', top: '42px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', outline: 'none', fontWeight: 'bold' }}>{showPassword ? 'Hide' : 'Show'}</button>
            {errors.password && <div style={errorStyle}>{errors.password}</div>}
          </div>

          {!isLogin && (
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-main)', fontWeight: '500' }}>Confirm Password</label>
              <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '15px', top: '42px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', outline: 'none', fontWeight: 'bold' }}>{showConfirmPassword ? 'Hide' : 'Show'}</button>
              {errors.confirmPassword && <div style={errorStyle}>{errors.confirmPassword}</div>}
            </div>
          )}

          <button type="submit" className="btn primary-btn gold-hover" style={{ width: '100%', marginTop: '1rem', padding: '1.2rem' }}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
          
        </form>
        
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span style={{ color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setIsLogin(!isLogin); setErrors({}); }}>
                {isLogin ? 'Sign Up' : 'Sign In'}
            </span>
        </div>

      </div>
    </div>
  );
}
