import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import './Login.css';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ username: '', email: '', password: '', role: 'staff' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await API.post('/auth/signup', form);
      setSuccess('Account created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div className="auth-wrapper fade-in">
        <div className="card auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Create account</h1>
            <p className="auth-subtitle">Select your role carefully — admin accounts access the analytics dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error   && <div className="error-msg">{error}</div>}
            {success && (
              <div className="error-msg" style={{ background:'rgba(16,185,129,0.1)', borderColor:'rgba(16,185,129,0.3)', color:'#6ee7b7' }}>
                {success}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Role</label>
              <div className="role-selector">
                <button
                  type="button"
                  className={`role-btn ${form.role === 'staff' ? 'role-active' : ''}`}
                  onClick={() => setForm(p => ({ ...p, role: 'staff' }))}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="10.8" cy="6.3" r="3.6"></circle>
                  </svg>
                  Field Employee
                </button>
                <button
                  type="button"
                  className={`role-btn ${form.role === 'admin' ? 'role-active' : ''}`}
                  onClick={() => setForm(p => ({ ...p, role: 'admin' }))}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2.7" y="9.9" width="16.2" height="9.9" rx="1.8" ry="1.8"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  Admin
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input id="username" name="username" type="text" required autoFocus minLength={3}
                className="form-input" placeholder="john_doe"
                value={form.username} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" required
                className="form-input" placeholder="you@example.com"
                value={form.email} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required minLength={6}
                className="form-input" placeholder="Min. 6 characters"
                value={form.password} onChange={handleChange} />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Creating account…</> : `Create ${form.role === 'admin' ? 'Admin' : 'Employee'} Account`}
            </button>
          </form>

          <div className="divider">or</div>
          <p className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
        <p className="page-tag">Field Visit Monitoring System</p>
      </div>
    </>
  );
}
