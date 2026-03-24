'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isStaging } from '@/lib/env'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Дашборд', icon: '📊' },
  { href: '/projects', label: 'Клиенты', icon: '📎' },
  { href: '/leads', label: 'Лиды', icon: '👥' },
  { href: '/expenses', label: 'Расходы', icon: '💸' },
  { href: '/reports', label: 'Отчёты', icon: '📈' },
  { href: '/settings', label: 'Настройки', icon: '⚙️' },
]

async function handleLogout() {
  await fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = '/login'
}

export function Sidebar() {
  const pathname = usePathname()
  const [projects, setProjects] = useState<any[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects).catch(() => {})
    setActiveId(localStorage.getItem('activeProjectId'))
  }, [])

  const activeProject = projects.find(p => String(p.id) === activeId)

  function handleSwitch(id: string) {
    localStorage.setItem('activeProjectId', id)
    setActiveId(id)
    window.location.reload()
  }

  return (
    <nav className="sidebar">
      {isStaging && (
        <div className="staging-banner" style={{ margin: '0 0 1rem' }}>
          ⚠️ Тестовая версия
        </div>
      )}

      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', flexShrink: 0,
          }}>📊</div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Marketing</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Platform v2.0</div>
          </div>
        </div>
      </div>

      {/* Project Switcher */}
      <div style={{ padding: '0 1rem 1.5rem' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase' }}>
          Активный клиент
        </div>
        <select 
          className="input" 
          style={{ width: '100%', fontSize: '0.85rem' }}
          value={activeId || ''}
          onChange={(e) => handleSwitch(e.target.value)}
        >
          <option value="" disabled>Выберите клиента...</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div style={{ flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${pathname.startsWith(item.href) ? ' active' : ''}`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      <div style={{ padding: '0 1rem' }}>
        <button
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleLogout}
        >
          🚪 Выйти
        </button>
      </div>
    </nav>
  )
}
