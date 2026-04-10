import { useState } from 'react';
import { authenticate } from './auth';

const PRIMARY = '#1a3a5c';
const ACCENT  = '#2563eb';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!username.trim() || !password) { setError('Inserisci username e password.'); return; }
    setLoading(true); setError('');
    // Simulate brief async (in case we add real auth later)
    await new Promise(r => setTimeout(r, 300));
    const user = authenticate(username.trim(), password);
    setLoading(false);
    if (user) {
      localStorage.setItem('gdpr:user', JSON.stringify(user));
      onLogin(user);
    } else {
      setError('Credenziali non valide. Riprova.');
      setPassword('');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f1f35 0%, #1a3a5c 60%, #1e4976 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Inter", system-ui, sans-serif', padding: 16,
    }}>
      {/* Background decoration */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(37,99,235,0.08)' }}/>
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(37,99,235,0.06)' }}/>
      </div>

      <div style={{
        background: '#fff', borderRadius: 20, padding: '44px 40px',
        width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, marginBottom: 14, boxShadow: '0 8px 20px rgba(37,99,235,0.3)',
          }}>🔐</div>
          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
            GDPR Manager
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Accedi per gestire la conformità privacy
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.4px' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="es. admin"
              autoComplete="username"
              autoFocus
              style={{
                width: '100%', padding: '10px 13px', border: '1.5px solid #dde3ec',
                borderRadius: 10, fontSize: 14, boxSizing: 'border-box', outline: 'none',
                fontFamily: 'inherit', background: '#fafafa', transition: 'border-color .15s',
              }}
              onFocus={e => e.target.style.borderColor = ACCENT}
              onBlur={e => e.target.style.borderColor = '#dde3ec'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.4px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%', padding: '10px 42px 10px 13px', border: '1.5px solid #dde3ec',
                  borderRadius: 10, fontSize: 14, boxSizing: 'border-box', outline: 'none',
                  fontFamily: 'inherit', background: '#fafafa', transition: 'border-color .15s',
                }}
                onFocus={e => e.target.style.borderColor = ACCENT}
                onBlur={e => e.target.style.borderColor = '#dde3ec'}
              />
              <button
                type="button"
                onClick={() => setShowPwd(p => !p)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
                  color: '#94a3b8', padding: 4,
                }}
              >
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 14px', background: '#fef2f2',
              border: '1px solid #fecaca', borderRadius: 8, fontSize: 13,
              color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px', border: 'none', borderRadius: 10,
              background: loading ? '#93c5fd' : `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`,
              color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
              fontFamily: 'inherit', boxShadow: loading ? 'none' : '0 4px 14px rgba(37,99,235,0.35)',
              transition: 'all .2s',
            }}
          >
            {loading ? '⏳ Accesso in corso...' : '🔓 Accedi'}
          </button>
        </form>

        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>
            GDPR Manager — Piattaforma di Conformità Privacy & NIS2
          </p>
        </div>
      </div>
    </div>
  );
}
