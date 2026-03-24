'use client'
import { useEffect, useState } from 'react'

type Lead = {
  id: number
  date: string
  name: string | null
  phone: string | null
  source: string | null
  status: string | null
  goalName: string | null
  managerNotes: string | null
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  qualified: 'Квалифицирован',
  lost: 'Потерян',
}

const STATUS_BADGE: Record<string, string> = {
  new: 'badge-new',
  in_progress: 'badge-progress',
  qualified: 'badge-qualified',
  lost: 'badge-lost',
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<number | null>(null)
  const [editNote, setEditNote] = useState('')

  useEffect(() => {
    const activeId = localStorage.getItem('activeProjectId') || '1'
    fetch(`/api/leads?projectId=${activeId}&limit=100`)
      .then((r) => r.json())
      .then((d) => { setLeads(d.leads || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/leads?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l))
  }

  async function saveNote(id: number) {
    await fetch(`/api/leads?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ managerNotes: editNote }),
    })
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, managerNotes: editNote } : l))
    setEditId(null)
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Лиды</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
          Управление входящими заявками
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" />
        </div>
      ) : leads.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <div>Лидов пока нет. Запустите синхронизацию на дашборде.</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Имя</th>
                <th>Телефон</th>
                <th>Источник</th>
                <th>Цель</th>
                <th>Статус</th>
                <th>Заметка</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td style={{ color: 'var(--muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {lead.date ? new Date(lead.date).toLocaleDateString('ru') : '—'}
                  </td>
                  <td style={{ fontWeight: '500' }}>{lead.name || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{lead.phone || '—'}</td>
                  <td>{lead.source || '—'}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{lead.goalName || '—'}</td>
                  <td>
                    <select
                      className="input"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                      value={lead.status || 'new'}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                    >
                      {Object.entries(STATUS_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {editId === lead.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          className="input"
                          style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          autoFocus
                        />
                        <button className="btn btn-primary btn-sm" onClick={() => saveNote(lead.id)}>✓</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>✕</button>
                      </div>
                    ) : (
                      <div
                        style={{ cursor: 'pointer', fontSize: '0.8rem', color: lead.managerNotes ? 'var(--foreground)' : 'var(--muted)' }}
                        onClick={() => { setEditId(lead.id); setEditNote(lead.managerNotes || '') }}
                      >
                        {lead.managerNotes || '+ добавить'}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
