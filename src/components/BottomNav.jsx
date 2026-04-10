// SVG icons: message-bubble, image-frame, heart, list

const icons = {
  today: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  gallery: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  hearts: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  plans: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
}

const tabs = [
  { id: 'today',   label: 'Today'   },
  { id: 'gallery', label: 'Gallery' },
  { id: 'hearts',  label: 'Hearts'  },
  { id: 'plans',   label: 'Plans'   },
]

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'var(--bg2)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 100
    }}>
      {tabs.map(({ id, label }) => {
        const active = activeTab === id
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '10px 4px 8px', background: 'none',
              border: 'none', cursor: 'pointer', gap: 4
            }}
          >
            <div style={{
              width: 38, height: 32, display: 'flex', alignItems: 'center',
              justifyContent: 'center', borderRadius: 12,
              background: active ? 'var(--rose-dim)' : 'transparent',
              transition: 'background 0.2s'
            }}>
              <div style={{
                stroke: active ? 'var(--rose)' : 'var(--text-dim)',
                transition: 'stroke 0.2s',
                display: 'flex'
              }}>
                {icons[id]}
              </div>
            </div>
            <span style={{
              fontSize: 9, letterSpacing: '0.08em', fontWeight: 300,
              color: active ? 'var(--rose-lt)' : 'var(--text-dim)',
              fontFamily: "'Outfit', sans-serif",
              transition: 'color 0.2s',
              textTransform: 'lowercase'
            }}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
