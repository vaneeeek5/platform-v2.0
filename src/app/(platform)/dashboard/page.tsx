'use client'
import { useEffect, useState } from 'react'

type KPI = {
  totalLeads: number
  totalSpend: number
  cpl: number
}

export default function DashboardPage() {
  const [kpi, setKpi] = useState<KPI | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const activeId = localStorage.getItem('activeProjectId') || '1'
    fetch(`/api/reports?projectId=${activeId}`)
      .then((r) => r.json())
      .then((d) => { setKpi(d.kpi); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function syncAll() {
    const activeId = localStorage.getItem('activeProjectId') || '1'
    setSyncing(true)
    await Promise.all([
      fetch('/api/sync/metrika', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: parseInt(activeId) }),
      }),
      fetch('/api/sync/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: parseInt(activeId) }),
      }),
    ])
    setSyncing(false)
    alert('Синхронизация запущена в фоне!')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Дашборд</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Обзор ключевых показателей
          </p>
        </div>
        <button className="btn btn-primary" onClick={syncAll} disabled={syncing}>
          {syncing ? <div className="spinner" style={{ width: '14px', height: '14px' }} /> : '🔄'}
          {syncing ? 'Синхронизация...' : 'Синхронизировать'}
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Всего лидов</div>
              <div className="kpi-value" style={{ color: 'var(--accent)' }}>
                {kpi?.totalLeads?.toLocaleString('ru') ?? '—'}
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Расходы</div>
              <div className="kpi-value" style={{ color: 'var(--warning)' }}>
                {kpi?.totalSpend
                  ? `${kpi.totalSpend.toLocaleString('ru', { maximumFractionDigits: 0 })} ₽`
                  : '—'}
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">CPL (стоимость лида)</div>
              <div className="kpi-value" style={{ color: 'var(--primary)' }}>
                {kpi?.cpl ? `${kpi.cpl.toLocaleString('ru', { maximumFractionDigits: 0 })} ₽` : '—'}
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Конверсия</div>
              <div className="kpi-value" style={{ color: 'var(--success)' }}>
                {kpi?.totalLeads && kpi.totalSpend
                  ? `${((kpi.totalLeads / (kpi.totalSpend / kpi.cpl || 1)) * 100).toFixed(1)}%`
                  : '—'}
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {[
              { href: '/leads', label: '👥 Управление лидами', desc: 'Просматривайте и обновляйте статусы лидов' },
              { href: '/expenses', label: '💸 Расходы', desc: 'Анализ затрат по кампаниям' },
              { href: '/reports', label: '📈 Отчёты', desc: 'KPI и экспорт в Excel' },
              { href: '/settings', label: '⚙️ Настройки', desc: 'Интеграции и конфигурация' },
            ].map((item) => (
              <a key={item.href} href={item.href} className="card" style={{ textDecoration: 'none', transition: 'border-color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{item.label}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{item.desc}</div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
