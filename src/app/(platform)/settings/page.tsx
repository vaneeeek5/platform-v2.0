'use client'
import { useState, useEffect } from 'react'

type Settings = {
  metrikaToken: string
  metrikaCounterId: string
  directToken: string
  openrouterKey: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    metrikaToken: '',
    metrikaCounterId: '',
    directToken: '',
    openrouterKey: '',
  })
  const [saved, setSaved] = useState(false)
  const [params, setParams] = useState<{ success?: string; error?: string }>({})

  useEffect(() => {
    const activeId = localStorage.getItem('activeProjectId')
    if (activeId) {
      fetch(`/api/projects?id=${activeId}`)
        .then(r => r.json())
        .then(data => {
          if (data) {
            setSettings({
              metrikaToken: data.metrikaToken || '',
              metrikaCounterId: data.metrikaCounterId || '',
              directToken: data.directToken || '',
              openrouterKey: data.openrouterKey || '',
            })
          }
        })
    }

    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('success') || urlParams.get('error')) {
      setParams({
        success: urlParams.get('success') || undefined,
        error: urlParams.get('error') || undefined,
      })
    }
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const activeId = localStorage.getItem('activeProjectId')
    if (!activeId) return

    const res = await fetch(`/api/projects?id=${activeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })

    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  function handleConnectYandex() {
    const activeId = localStorage.getItem('activeProjectId')
    if (!activeId) {
      alert('Сначала выберите или создайте клиента!')
      return
    }
    window.location.href = `/api/auth/yandex/login?projectId=${activeId}`
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Настройки</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
          Конфигурация интеграций и токенов
        </p>
      </div>

      {params.success && (
        <div className="card" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--success)', color: 'var(--success)', marginBottom: '1.5rem' }}>
          ✅ Яндекс успешно подключен! Токены обновлены.
        </div>
      )}
      {params.error && (
        <div className="card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--danger)', color: 'var(--danger)', marginBottom: '1.5rem' }}>
          ❌ Ошибка авторизации: {params.error}
        </div>
      )}

      <form onSubmit={handleSave} style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📊 Яндекс.Метрика & Директ
            </h2>
            <button 
              type="button" 
              className="btn btn-primary btn-sm" 
              onClick={handleConnectYandex}
              style={{ background: 'linear-gradient(135deg, #f33, #f00)' }}
            >
              🔗 Подключить Яндекс
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>
                ID Счётчика Метрики
              </label>
              <input
                className="input"
                value={settings.metrikaCounterId}
                onChange={(e) => setSettings((s) => ({ ...s, metrikaCounterId: e.target.value }))}
                placeholder="93215285"
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>
              💡 Рекомендуется использовать кнопку «Подключить Яндекс» выше для автоматического получения токенов.
            </p>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>
                Ручной ввод OAuth Token (необязательно)
              </label>
              <input
                className="input"
                value={settings.metrikaToken}
                onChange={(e) => setSettings((s) => ({ ...s, metrikaToken: e.target.value }))}
                placeholder="y0__xXX..."
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🎯 Яндекс.Директ
          </h2>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>
              OAuth Token
            </label>
            <input
              className="input"
              value={settings.directToken}
              onChange={(e) => setSettings((s) => ({ ...s, directToken: e.target.value }))}
              placeholder="y0__xXX..."
            />
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🤖 AI Рекомендации (OpenRouter)
          </h2>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>
              API Key
            </label>
            <input
              className="input"
              type="password"
              value={settings.openrouterKey}
              onChange={(e) => setSettings((s) => ({ ...s, openrouterKey: e.target.value }))}
              placeholder="sk-or-..."
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-primary" type="submit">
            💾 Сохранить настройки
          </button>
          {saved && (
            <span style={{ color: 'var(--success)', fontSize: '0.875rem', fontWeight: '500' }}>
              ✓ Сохранено!
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
