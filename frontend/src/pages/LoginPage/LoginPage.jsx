import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import './LoginPage.css';

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [loginMsg, setLoginMsg] = useState({ text: '', error: false });
  const [registerMsg, setRegisterMsg] = useState({ text: '', error: false });
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogin(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    setLoginMsg({ text: 'Входимо…', error: false });
    try {
      await login(form.get('username'), form.get('password'));
      const target = location.state?.from?.pathname || '/upload';
      navigate(target, { replace: true });
    } catch (err) {
      setLoginMsg({ text: err.message, error: true });
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    setRegisterMsg({ text: 'Створюємо акаунт…', error: false });
    try {
      await register({
        username: form.get('username'),
        name: form.get('name'),
        password: form.get('password'),
      });
      setRegisterMsg({ text: 'Акаунт створено. Тепер увійди на вкладці «Увійти».', error: false });
      event.target.reset();
      setTab('login');
    } catch (err) {
      setRegisterMsg({ text: err.message, error: true });
    }
  }

  return (
    <section className="panel panel--narrow">
      <div className="tabs">
        <button
          className={`tab ${tab === 'login' ? 'is-active' : ''}`}
          onClick={() => setTab('login')}
          type="button"
        >
          Увійти
        </button>
        <button
          className={`tab ${tab === 'register' ? 'is-active' : ''}`}
          onClick={() => setTab('register')}
          type="button"
        >
          Реєстрація
        </button>
      </div>

      {tab === 'login' ? (
        <form className="stack" onSubmit={handleLogin}>
          <label className="field">
            <span className="field__label">Логін</span>
            <input type="text" name="username" required autoComplete="username" />
          </label>
          <label className="field">
            <span className="field__label">Пароль</span>
            <input type="password" name="password" required autoComplete="current-password" />
          </label>
          <button type="submit" className="btn btn--primary">Увійти</button>
          <p className={`form-msg ${loginMsg.error ? 'is-error' : 'is-ok'}`}>{loginMsg.text}</p>
        </form>
      ) : (
        <form className="stack" onSubmit={handleRegister}>
          <label className="field">
            <span className="field__label">Логін</span>
            <input type="text" name="username" required />
          </label>
          <label className="field">
            <span className="field__label">Ім'я</span>
            <input type="text" name="name" required />
          </label>
          <label className="field">
            <span className="field__label">Пароль</span>
            <input type="password" name="password" required autoComplete="new-password" />
          </label>
          <button type="submit" className="btn btn--primary">Створити акаунт</button>
          <p className={`form-msg ${registerMsg.error ? 'is-error' : 'is-ok'}`}>{registerMsg.text}</p>
        </form>
      )}
    </section>
  );
}