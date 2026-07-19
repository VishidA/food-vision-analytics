import { apiFetch } from './client.js';

export function uploadPhoto({ file, weightGrams, token }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('weight_grams', weightGrams);

  return apiFetch('/consumption/upload', {
    method: 'POST',
    body: formData,
    token,
  });
}

export function fetchHistory({ skip = 0, limit = 10, token }) {
  return apiFetch(`/consumption/history?skip=${skip}&limit=${limit}`, { token });
}
