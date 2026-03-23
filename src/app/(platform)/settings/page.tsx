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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    // In production, this would call an API route to update project settings
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Настройки</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
          Конфигурация интеграций и токенов
        </p>
      </div>

      <form onSubmit={handleSave} style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📊 Яндекс.Метрика
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>
                OAuth Token
              </label>
              <input
                className="input"
                value={settings.metrikaToken}
                onChange={(e) => setSettings((s) => ({ ...s, metrikaToken: e.target.value }))}
                placeholder="y0__xXX..."
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>
                ID Счётчика
              </label>
              <input
                className="input"
                value={settings.metrikaCounterId}
                onChange={(e) => setSettings((s) => ({ ...s, metrikaCounterId: e.target.value }))}
                placeholder="93215285"
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
