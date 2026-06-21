import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', form);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role',  data.role);
      if (data.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/submit');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div className="auth-wrapper fade-in">
        <div className="card auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to continue. Admins are redirected to the dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="error-msg">{error}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" required autoFocus
                className="form-input" placeholder="you@example.com"
                value={form.email} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required
                className="form-input" placeholder="••••••••"
                value={form.password} onChange={handleChange} />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <div className="divider">or</div>
          <p className="auth-footer">
            Don't have an account?{' '}
            <Link to="/signup" className="auth-link">Create one</Link>
          </p>
        </div>
        <p className="page-tag">Field Visit Monitoring System</p>
      </div>
    </>
  );
}
