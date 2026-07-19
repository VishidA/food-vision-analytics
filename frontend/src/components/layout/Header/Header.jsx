import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import './Header.css';

export default function Header() {
  const { isAuthenticated, username, logout } = useAuth();

  return (
    <header className="masthead">
      <div className="wrap masthead__row">
        <Link to="/" className="wordmark">
          <span className="wordmark__main">FOOD VISION</span>
          <span className="wordmark__sub">ANALYTICS</span>
        </Link>

        {isAuthenticated && (
          <nav className="masthead__nav">
            <Link to="/upload" className="masthead__link">Завантажити</Link>
            <Link to="/history" className="masthead__link">Історія</Link>
            <span className="user-bar__name">{username}</span>
            <button className="btn btn--ghost btn--small" onClick={logout}>Вийти</button>
          </nav>
        )}
      </div>
    </header>
  );
}