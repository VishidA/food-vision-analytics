import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { uploadPhoto } from '../../api/consumption.js';
import './UploadPage.css';

function formatClassName(rawName) {
  if (!rawName) return '';
  return rawName
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function productLabel(entry) {
  if (entry.predicted_class) return formatClassName(entry.predicted_class);
  if (entry.product_name) return formatClassName(entry.product_name);
  return `Product #${entry.product_id}`;
}

function fmt(value, decimals = 1) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(decimals) : '-';
}

function fmtDateTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function UploadPage() {
  const { token } = useAuth();
  const [preview, setPreview] = useState(null);
  const [weight, setWeight] = useState(100);
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState({ text: '', error: false });
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);
  const log = result?.consumption_log;

  function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const file = fileInputRef.current.files[0];

    if (!file) {
      setMsg({ text: 'Обери фото перед відправкою.', error: true });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMsg({ text: 'Файл більший за 10 МБ - за FR-2 це поза лімітом.', error: true });
      return;
    }

    setBusy(true);
    setMsg({ text: '', error: false });
    setResult(null);

    try {
      const entry = await uploadPhoto({ file, weightGrams: weight, token });
      setResult(entry);
      setMsg({ text: 'Готово, збережено в історію.', error: false });
    } catch (err) {
      setMsg({ text: err.message, error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <h2 className="panel__title">Завантажити фото страви</h2>

      <form className="stack" onSubmit={handleSubmit}>
        <label className="dropzone">
          <input
            type="file"
            accept="image/jpeg,image/png"
            ref={fileInputRef}
            onChange={handleFileChange}
            required
          />
          {!preview && <span className="dropzone__hint">Обери фото (JPEG / PNG, до 10 МБ)</span>}
          {preview && <img className="dropzone__preview" src={preview} alt="Попередній перегляд" />}
        </label>

        <label className="field">
          <span className="field__label">Вага порції, г</span>
          <input
            type="number"
            min="1"
            step="1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            required
          />
        </label>

        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Розпізнаємо…' : 'Розпізнати та зберегти'}
        </button>
        <p className={`form-msg ${msg.error ? 'is-error' : 'is-ok'}`}>{msg.text}</p>
      </form>

      {result && log && (
        <div className="nutrition-label">
          <div className="nutrition-label__eyebrow">Результат розпізнавання</div>
          <div className="nutrition-label__title">{productLabel(result)}</div>
          {typeof result.confidence === 'number' && (
            <div className="nutrition-label__warning">
              впевненість {(result.confidence * 100).toFixed(0)}%
            </div>
          )}
          <div className="nutrition-label__row nutrition-label__row--big">
            <span className="nutrition-label__key">Калорії</span>
            <span className="nutrition-label__val">{fmt(log.log_calories)} ккал</span>
          </div>
          <div className="nutrition-label__row">
            <span className="nutrition-label__key">Білки</span>
            <span className="nutrition-label__val">{fmt(log.log_protein)} г</span>
          </div>
          <div className="nutrition-label__row">
            <span className="nutrition-label__key">Жири</span>
            <span className="nutrition-label__val">{fmt(log.log_fat)} г</span>
          </div>
          <div className="nutrition-label__row">
            <span className="nutrition-label__key">Вуглеводи</span>
            <span className="nutrition-label__val">{fmt(log.log_carbs)} г</span>
          </div>
          <div className="nutrition-label__meta">
            Порція: {fmt(log.weight, 0)} г · {fmtDateTime(log.consumed_time)} · запис #{log.id}
          </div>
        </div>
      )}
    </div>
  );
}