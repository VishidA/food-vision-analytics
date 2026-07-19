import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { fetchHistory } from '../../api/consumption.js';
import './HistoryPage.css';

const PAGE_SIZE = 10;

function formatClassName(rawName) {
  if (!rawName) return '';
  return rawName
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function productLabel(entry) {
  if (entry.product_name) return formatClassName(entry.product_name);
  return `Product #${entry.product_id}`;
}

function fmt(value, decimals = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(decimals) : '-';
}

function fmtDateTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function HistoryPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchHistory({ skip, limit: PAGE_SIZE, token });
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [skip, token]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = logs.reduce(
    (acc, log) => {
      acc.calories += Number(log.log_calories) || 0;
      acc.protein += Number(log.log_protein) || 0;
      acc.fat += Number(log.log_fat) || 0;
      acc.carbs += Number(log.log_carbs) || 0;
      return acc;
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  return (
    <div className="panel">
      <div className="panel__title-row">
        <h2 className="panel__title">Історія споживання</h2>
        <button className="btn btn--ghost btn--small" onClick={load}>Оновити</button>
      </div>

      {logs.length > 0 && (
        <div className="totals-strip">
          <div className="totals-strip__item">
            <span className="totals-strip__label">Ккал (сторінка)</span>
            <span className="totals-strip__value">{fmt(totals.calories)}</span>
          </div>
          <div className="totals-strip__item">
            <span className="totals-strip__label">Білки</span>
            <span className="totals-strip__value">{fmt(totals.protein)}г</span>
          </div>
          <div className="totals-strip__item">
            <span className="totals-strip__label">Жири</span>
            <span className="totals-strip__value">{fmt(totals.fat)}г</span>
          </div>
          <div className="totals-strip__item">
            <span className="totals-strip__label">Вуглеводи</span>
            <span className="totals-strip__value">{fmt(totals.carbs)}г</span>
          </div>
        </div>
      )}

      <div className="history-list">
        {loading && <div className="empty-state">Завантаження…</div>}
        {!loading && error && <div className="empty-state">Не вдалося завантажити історію: {error}</div>}
        {!loading && !error && logs.length === 0 && (
          <div className="empty-state">Записів поки немає - заванта перше фото.</div>
        )}
        {!loading && !error && logs.map((log) => (
          <div className="history-row" key={log.id}>
            <span className="history-row__product">{productLabel(log)}</span>
            <span className="history-row__time">{fmtDateTime(log.consumed_time)}</span>
            <span className="history-row__weight">{fmt(log.weight)} г</span>
            <span className="history-row__cal">{fmt(log.log_calories)} ккал</span>
          </div>
        ))}
      </div>

      <div className="pager">
        <button
          className="btn btn--ghost btn--small"
          disabled={skip === 0}
          onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
        >
          &larr; Попередні
        </button>
        <span className="pager__label">{skip / PAGE_SIZE + 1}</span>
        <button
          className="btn btn--ghost btn--small"
          disabled={logs.length < PAGE_SIZE}
          onClick={() => setSkip(skip + PAGE_SIZE)}
        >
          Наступні &rarr;
        </button>
      </div>
    </div>
  );
}
