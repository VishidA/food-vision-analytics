import { apiFetch } from './client.js';

export function registerUser({ username, name, password }) {
  return apiFetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, name, password }),
  });
}

export function loginUser({ username, password }) {
  const body = new URLSearchParams();
  body.set('username', username);
  body.set('password', password);

  return apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
}
