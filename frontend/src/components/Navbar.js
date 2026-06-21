import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav className="global-navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to={token ? (role === 'admin' ? '/dashboard' : '/submit') : '/login'} className="navbar-brand">
            <svg xmlns="http://www.w3.org/2000/svg" width="21.6" height="21.6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="brand-icon">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span className="brand-name">Site</span>
          </Link>
        </div>
        
        <div className="navbar-right">
          {token ? (
            <button className="nav-btn nav-btn-outline" onClick={handleLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16.2" height="16.2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="18.9" y1="10.8" x2="8.1" y2="10.8"></line>
              </svg>
              Logout
            </button>
          ) : (
            <>
              {location.pathname !== '/login' && (
                <Link to="/login" className="nav-btn nav-btn-text">
                  Login
                </Link>
              )}
              {location.pathname !== '/signup' && (
                <Link to="/signup" className="nav-btn nav-btn-solid">
                  Sign up
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
