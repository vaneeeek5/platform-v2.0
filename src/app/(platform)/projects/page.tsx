'use client'
import { useState, useEffect } from 'react'

type Project = {
  id: number
  name: string
  slug: string
  metrikaCounterId: string
  createdAt: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    const res = await fetch('/api/projects')
    const data = await res.json()
    setProjects(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    })
    if (res.ok) {
      setNewName('')
      setIsAdding(false)
      fetchProjects()
    }
  }

  function setActiveProject(id: number) {
    localStorage.setItem('activeProjectId', String(id))
    window.location.reload()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Клиенты</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Управление проектами и рекламными аккаунтами
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
          ➕ Добавить клиента
        </button>
      </div>

      {isAdding && (
        <div className="card" style={{ marginBottom: '2rem', maxWidth: '500px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 1rem' }}>Новый клиент</h2>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              className="input"
              placeholder="Название компании / проекта"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" type="submit">Создать</button>
              <button className="btn btn-ghost" type="button" onClick={() => setIsAdding(false)}>Отмена</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="spinner" />
      ) : projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📎</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 0.5rem' }}>У вас пока нет клиентов</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
            Добавьте первого клиента, чтобы начать собирать данные и формировать отчёты.
          </p>
          <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
            ➕ Добавить первого клиента
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {/* ... existing table ... */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Название</th>
                <th style={{ padding: '1rem' }}>ID счетчика</th>
                <th style={{ padding: '1rem' }}>Дата создания</th>
                <th style={{ padding: '1rem' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{p.name}</td>
                  <td style={{ padding: '1rem', color: 'var(--muted)' }}>{p.metrikaCounterId || '—'}</td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                    {new Date(p.createdAt).toLocaleDateString('ru')}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button className="btn btn-ghost" onClick={() => setActiveProject(p.id)}>
                      🎯 Выбрать
                    </button>
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
