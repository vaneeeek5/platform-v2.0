'use client'
import { useEffect, useState } from 'react'

type ReportData = {
  kpi: { totalLeads: number; totalSpend: number; cpl: number }
  leadsBySource: { source: string | null; cnt: number }[]
  leadsByStatus: { status: string | null; cnt: number }[]
  dateRange: { from: string; to: string }
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Новые',
  in_progress: 'В работе',
  qualified: 'Квалифицированы',
  lost: 'Потеряны',
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(() => new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0])

  function load() {
    const activeId = localStorage.getItem('activeProjectId') || '1'
    setLoading(true)
    fetch(`/api/reports?projectId=${activeId}&from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(load, [])

  async function exportExcel() {
    const { utils, writeFile } = await import('xlsx')
    const rows = [
      ['Дата от', from, 'Дата до', to],
      [],
      ['KPI'],
      ['Всего лидов', data?.kpi.totalLeads],
      ['Расходы (₽)', data?.kpi.totalSpend],
      ['CPL (₽)', data?.kpi.cpl],
      [],
      ['Лиды по источникам'],
      ['Источник', 'Количество'],
      ...(data?.leadsBySource || []).map((r) => [r.source || 'Неизвестно', r.cnt]),
    ]
    const ws = utils.aoa_to_sheet(rows)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Отчёт')
    writeFile(wb, `marketing_report_${from}_${to}.xlsx`)
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Отчёты</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>KPI и аналитика по выбранному периоду</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ width: '150px' }} />
          <span style={{ color: 'var(--muted)' }}>—</span>
          <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: '150px' }} />
          <button className="btn btn-primary" onClick={load}>Применить</button>
          <button className="btn btn-ghost" onClick={exportExcel} disabled={!data}>📥 Excel</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" />
        </div>
      ) : data ? (
        <>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Всего лидов</div>
              <div className="kpi-value" style={{ color: 'var(--accent)' }}>{data.kpi.totalLeads.toLocaleString('ru')}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Расходы</div>
              <div className="kpi-value" style={{ color: 'var(--warning)' }}>
                {data.kpi.totalSpend.toLocaleString('ru', { maximumFractionDigits: 0 })} ₽
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">CPL (стоимость лида)</div>
              <div className="kpi-value" style={{ color: 'var(--primary)' }}>
                {data.kpi.cpl.toLocaleString('ru', { maximumFractionDigits: 0 })} ₽
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div className="card">
              <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 1rem' }}>По источникам</h2>
              {data.leadsBySource.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Нет данных</div>
              ) : (
                data.leadsBySource.map((row) => (
                  <div key={row.source} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <span>{row.source || 'Неизвестно'}</span>
                    <span style={{ fontWeight: '600', color: 'var(--accent)' }}>{row.cnt}</span>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 1rem' }}>По статусам</h2>
              {data.leadsByStatus.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Нет данных</div>
              ) : (
                data.leadsByStatus.map((row) => (
                  <div key={row.status} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <span>{STATUS_LABELS[row.status || 'new'] || row.status}</span>
                    <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{row.cnt}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>
          Ошибка загрузки данных
        </div>
      )}
    </div>
  )
}
