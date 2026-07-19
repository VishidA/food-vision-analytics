export const API_BASE = 'http://127.0.0.1:8080/api/v1';

export async function apiFetch(path, { token, ...options } = {}) {
  const headers = options.headers || {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // no JSON body
    }
    throw new Error(detail);
  }

  if (response.status === 204) return null;
  return response.json();
}