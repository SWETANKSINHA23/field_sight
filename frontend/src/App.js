import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar      from './components/Navbar';
import Login       from './pages/Login';
import Signup      from './pages/Signup';
import Submit      from './pages/Submit';
import Response    from './pages/Response';
import Dashboard   from './pages/Dashboard';
import ReportDetail from './pages/ReportDetail';

function RequireAuth({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }) {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'admin') return <Navigate to="/submit" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <div className="page-content">
          <Routes>
            <Route path="/"                   element={<Navigate to="/login" replace />} />
            <Route path="/login"              element={<Login />} />
            <Route path="/signup"             element={<Signup />} />
            <Route path="/submit"             element={<RequireAuth><Submit /></RequireAuth>} />
            <Route path="/response"           element={<RequireAuth><Response /></RequireAuth>} />
            <Route path="/dashboard"          element={<RequireAdmin><Dashboard /></RequireAdmin>} />
            <Route path="/dashboard/report/:id" element={<RequireAdmin><ReportDetail /></RequireAdmin>} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
