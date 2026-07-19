import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/layout/Header/Header.jsx';
import LoginPage from './pages/LoginPage/LoginPage.jsx';
import UploadPage from './pages/UploadPage/UploadPage.jsx';
import HistoryPage from './pages/HistoryPage/HistoryPage.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import './App.css';

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="app-loading">Завантаження…</div>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function LoginRedirect({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="app-loading">Завантаження…</div>;
  if (isAuthenticated) {
    const target = location.state?.from?.pathname || '/upload';
    return <Navigate to={target} replace />;
  }
  return children;
}

export default function App() {
  return (
    <div className="app-layout">
      <Header />
      <main className="wrap app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/upload" replace />} />
          <Route path="/upload" element={<RequireAuth><UploadPage /></RequireAuth>} />
          <Route path="/history" element={<RequireAuth><HistoryPage /></RequireAuth>} />
          <Route path="/login" element={<LoginRedirect><LoginPage /></LoginRedirect>} />
        </Routes>
      </main>
    </div>
  );
}
