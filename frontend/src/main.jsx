import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Auto-recover from stale deployment chunk errors when new versions are deployed to Vercel
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('Vite preload error (new deployment detected). Reloading page...', event)
    const key = 'amen_preload_reload_' + (window.location.pathname || '')
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1')
      window.location.reload()
    }
  })
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('App Error:', error, info)
    const msg = String(error?.message || '')
    // Detect stale deployment dynamic import failure
    if (
      msg.includes('dynamically imported module') ||
      msg.includes('error loading dynamically imported module') ||
      msg.includes('Loading chunk') ||
      msg.includes('failed to fetch') && msg.includes('.js')
    ) {
      const key = 'amen_chunk_reload_' + window.location.pathname
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        window.location.reload()
      }
    }
  }
  render() {
    if (this.state.hasError) {
      const msg = String(this.state.error?.message || '')
      const isChunkError =
        msg.includes('dynamically imported module') ||
        msg.includes('error loading dynamically imported module') ||
        msg.includes('Loading chunk')

      if (isChunkError) {
        return (
          <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #041C0B 0%, #0B3B16 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '24px',
            color: '#fff',
          }}>
            <div style={{
              maxWidth: '460px',
              width: '100%',
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '24px',
              padding: '36px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 20px',
                borderRadius: '50%',
                background: 'rgba(57,211,83,0.15)',
                border: '1px solid rgba(57,211,83,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
              }}>
                ✨
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '10px', color: '#fff' }}>
                New Version Available
              </h2>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>
                A newer version of Amen Events EMS has been published. Click below to load the updated application.
              </p>
              <button
                onClick={() => {
                  sessionStorage.clear()
                  window.location.reload()
                }}
                style={{
                  background: 'linear-gradient(135deg, #188A2E 0%, #39D353 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '13px 28px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 10px 20px -5px rgba(24,138,46,0.5)',
                }}
              >
                Reload Amen Events
              </button>
            </div>
          </div>
        )
      }

      return (
        <div style={{ padding: '40px', fontFamily: 'monospace', fontSize: '14px', color: '#333' }}>
          <h2 style={{ color: 'red' }}>React Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
)
