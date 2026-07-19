import React, { createContext, useContext, useState, useCallback } from 'react';
import { loginUser, registerUser } from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('fva_token'));
  const [username, setUsername] = useState(() => localStorage.getItem('fva_username'));
  const [loading] = useState(false); // no async bootstrap needed - token is read synchronously above

  const login = useCallback(async (usernameInput, password) => {
    const data = await loginUser({ username: usernameInput, password });
    setToken(data.access_token);
    setUsername(usernameInput);
    localStorage.setItem('fva_token', data.access_token);
    localStorage.setItem('fva_username', usernameInput);
  }, []);

  const register = useCallback(async ({ username: usernameInput, name, password }) => {
    await registerUser({ username: usernameInput, name, password });
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUsername(null);
    localStorage.removeItem('fva_token');
    localStorage.removeItem('fva_username');
  }, []);

  const value = {
    token,
    username,
    isAuthenticated: Boolean(token),
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}