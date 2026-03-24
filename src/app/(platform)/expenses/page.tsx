'use client'
import { useEffect, useState } from 'react'

type Expense = {
  id: number
  date: string
  campaignName: string | null
  clicks: number | null
  impressions: number | null
  spend: string | null
  cpc: string | null
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const activeId = localStorage.getItem('activeProjectId') || '1'
    fetch(`/api/reports?projectId=${activeId}`)
      .then((r) => r.json())
      .then(() => setLoading(false))
      .catch(() => setLoading(false))
    // Load expenses from a dedicated endpoint when we add it
    setLoading(false)
  }, [])

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Расходы</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Яндекс.Директ — затраты по кампаниям
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={async () => {
            const activeId = localStorage.getItem('activeProjectId') || '1'
            await fetch('/api/sync/direct', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ projectId: parseInt(activeId) }),
            })
            alert('Синхронизация Директа запущена!')
          }}
        >
          🔄 Синхронизировать Директ
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💸</div>
          <div style={{ marginBottom: '1rem' }}>Данных о расходах нет</div>
          <p style={{ fontSize: '0.875rem' }}>Нажмите «Синхронизировать Директ» для загрузки данных из Яндекс.Директ</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Кампания</th>
                <th>Показы</th>
                <th>Клики</th>
                <th>Расходы</th>
                <th>CPC</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                    {e.date ? new Date(e.date).toLocaleDateString('ru') : '—'}
                  </td>
                  <td style={{ fontWeight: '500' }}>{e.campaignName || '—'}</td>
                  <td>{e.impressions?.toLocaleString('ru') || '—'}</td>
                  <td>{e.clicks?.toLocaleString('ru') || '—'}</td>
                  <td style={{ color: 'var(--warning)' }}>
                    {e.spend ? `${parseFloat(e.spend).toLocaleString('ru', { maximumFractionDigits: 0 })} ₽` : '—'}
                  </td>
                  <td>{e.cpc ? `${parseFloat(e.cpc).toLocaleString('ru')} ₽` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
