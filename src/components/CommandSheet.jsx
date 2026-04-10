import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { updatePresence, addPlan, addQuote } from '../firebase/services'


// ─── Mood slider colour interpolation ─────────────────
function moodColor(pct) {
  if (pct <= 30) return '#9d7ab8' // lavender-dim
  if (pct <= 70) return '#c47090' // mid-rose
  return '#d4607a'                // rose
}

function moodLabel(pct) {
  if (pct <= 10) return 'Exhausted'
  if (pct <= 30) return 'Drained'
  if (pct <= 50) return 'Low'
  if (pct <= 70) return 'Okay'
  if (pct <= 85) return 'Good'
  if (pct <= 94) return 'Great'
  return 'Radiant ✦'
}

// ─── Tactile Mood Slider ───────────────────────────────
function MoodSlider({ value, onChange }) {
  const color = moodColor(value)

  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'baseline', marginBottom: 10,
      }}>
        <span style={{ fontSize: 9, letterSpacing: '0.20em', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 300 }}>
          Mood
        </span>
        <span style={{
          fontSize: 13, fontWeight: 300,
          color, transition: 'color 0.4s',
          letterSpacing: '0.04em',
          fontFamily: "'Outfit', sans-serif",
        }}>
          {moodLabel(value)} · {value}%
        </span>
      </div>

      {/* Custom slider track */}
      <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}>
        {/* Track background */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 4,
          borderRadius: 2, background: 'var(--border)',
        }}/>
        {/* Filled track */}
        <div style={{
          position: 'absolute', left: 0, height: 4,
          width: `${value}%`, borderRadius: 2,
          background: `linear-gradient(90deg, #9d7ab8, ${color})`,
          transition: 'width 0.05s, background 0.4s',
        }}/>
        {/* Native input for interaction */}
        <input
          type="range"
          min="0" max="100" step="1"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            opacity: 0, cursor: 'pointer', margin: 0,
          }}
        />
        {/* Thumb */}
        <div style={{
          position: 'absolute',
          left: `calc(${value}% - 10px)`,
          width: 20, height: 20, borderRadius: '50%',
          background: 'var(--bg2)',
          border: `2px solid ${color}`,
          boxShadow: `0 0 10px ${color}44`,
          pointerEvents: 'none',
          transition: 'left 0.05s, border-color 0.4s, box-shadow 0.4s',
        }}/>
      </div>

      {/* Tick marks */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {['Drained', 'Neutral', 'Radiant'].map((l, i) => (
          <span key={l} style={{ fontSize: 8.5, letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 300 }}>
            {l}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Section wrapper ───────────────────────────────────
function Section({ title, children }) {
  return (
    <div>
      <div className="section-label" style={{ marginBottom: 10 }}>
        <span>{title}</span>
      </div>
      {children}
    </div>
  )
}

// ─── Pill input ────────────────────────────────────────
function PillInput({ placeholder, value, onChange, maxLength, onSubmit, submitLabel = 'Add' }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSubmit()}
        style={{
          flex: 1, background: 'var(--surf2)',
          border: '1px solid var(--border)', borderRadius: 12,
          padding: '10px 14px', fontSize: 13, color: 'var(--text)',
          fontFamily: "'Outfit', sans-serif", fontWeight: 300,
          outline: 'none',
        }}
      />
      <button
        onClick={onSubmit}
        style={{
          background: 'var(--rose-dim)', border: '1px solid var(--border2)',
          borderRadius: 12, padding: '10px 14px', fontSize: 12,
          color: 'var(--rose-lt)', fontFamily: "'Outfit', sans-serif",
          fontWeight: 300, cursor: 'pointer', letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
        }}
      >
        {submitLabel}
      </button>
    </div>
  )
}

// ─── Toast ─────────────────────────────────────────────
function Toast({ msg }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
        background: 'var(--surf2)', border: '1px solid var(--border2)',
        borderRadius: 10, padding: '8px 16px',
        fontSize: 11, color: 'var(--rose-lt)', letterSpacing: '0.06em',
        whiteSpace: 'nowrap', zIndex: 200,
      }}
    >
      {msg}
    </motion.div>
  )
}

// ─── Main CommandSheet ─────────────────────────────────
export default function CommandSheet({ open, onClose, initialMood = 50, initialStatus = '', onInstantMoodChange }) {
  const [mood,       setMood]       = useState(initialMood)
  const [status,     setStatus]     = useState(initialStatus)
  const [planText,   setPlanText]   = useState('')
  const [planCat,    setPlanCat]    = useState('Date Night')
  const [quoteText,  setQuoteText]  = useState('')
  const [quoteAuth,  setQuoteAuth]  = useState('')
  const [toast,      setToast]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const saveTimer   = useRef(null)

  // Sync initialMood when sheet opens
  useEffect(() => {
    if (open) {
      setMood(initialMood)
      setStatus(initialStatus)
    }
  }, [open, initialMood, initialStatus])

  // ── Debounced auto-save presence on mood/status change ─
  const debounceSave = useCallback((newMood, newStatus) => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await updatePresence({ moodPercentage: newMood, statusText: newStatus }).catch(() => {})
    }, 600)
  }, [])

  function handleMoodChange(val) {
    setMood(val)
    if (onInstantMoodChange) {
      onInstantMoodChange(val)
    }
    debounceSave(val, status)
  }

  
  async function handleStatusBlur() {
    await updatePresence({ moodPercentage: mood, statusText: status }).catch(() => {})
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  async function handleAddPlan() {
    if (!planText.trim()) return
    setSaving(true)
    try {
      await addPlan({ title: planText.trim(), category: planCat, emoji: '' })
      setPlanText('')
      showToast('Plan added ✓')
    } catch { showToast('Error — try again') }
    finally { setSaving(false) }
  }

  async function handleAddQuote() {
    if (!quoteText.trim()) return
    setSaving(true)
    try {
      await addQuote({ text: quoteText.trim(), author: quoteAuth.trim() || 'Unknown' })
      setQuoteText('')
      setQuoteAuth('')
      showToast('Quote added ✓')
    } catch { showToast('Error — try again') }
    finally { setSaving(false) }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(10,6,14,0.65)',
              zIndex: 200, backdropFilter: 'blur(2px)',
            }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36, mass: 0.9 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              maxWidth: 480, margin: '0 auto',
              background: 'var(--bg2)',
              borderRadius: '24px 24px 0 0',
              border: '1px solid var(--border)',
              borderBottom: 'none',
              padding: '0 20px 48px',
              zIndex: 201,
              maxHeight: '82vh',
              overflowY: 'auto',
            }}
          >
            {/* Handle */}
            <div style={{
              width: 36, height: 4, borderRadius: 2,
              background: 'var(--border2)', margin: '14px auto 20px',
            }}/>

            {/* Title */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{
                fontFamily: "'Playfair Display', serif", fontStyle: 'italic',
                fontWeight: 300, fontSize: 20, color: 'var(--text)',
                marginBottom: 4,
              }}>
                Command Sheet
              </h2>
              <p style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 300 }}>
                Updates reflect for both of you instantly
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>

              {/* ── Mood Slider ── */}
              <Section title="How are you feeling?">
                <MoodSlider value={mood} onChange={handleMoodChange} />
              </Section>

              {/* ── Status Text ── */}
              <Section title="Status">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="In a meeting ☕  (max 20 chars)"
                    value={status}
                    maxLength={20}
                    onChange={e => setStatus(e.target.value)}
                    onBlur={handleStatusBlur}
                    onKeyDown={e => e.key === 'Enter' && handleStatusBlur()}
                    style={{
                      flex: 1, background: 'var(--surf2)',
                      border: '1px solid var(--border)', borderRadius: 12,
                      padding: '10px 14px', fontSize: 13, color: 'var(--text)',
                      fontFamily: "'Outfit', sans-serif", fontWeight: 300,
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', minWidth: 28, textAlign: 'right' }}>
                    {status.length}/20
                  </span>
                </div>
              </Section>

              {/* ── Add a Plan ── */}
              <Section title="Add a Plan">
                {/* Category toggle */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {['Date Night', 'Future Dreams'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setPlanCat(cat)}
                      style={{
                        flex: 1, padding: '8px 10px',
                        borderRadius: 10, fontSize: 11, fontWeight: 300,
                        fontFamily: "'Outfit', sans-serif",
                        letterSpacing: '0.06em', cursor: 'pointer',
                        border: `1px solid ${planCat === cat ? 'var(--rose)' : 'var(--border)'}`,
                        background: planCat === cat ? 'var(--rose-dim)' : 'transparent',
                        color: planCat === cat ? 'var(--rose-lt)' : 'var(--text-dim)',
                        transition: 'all 0.2s',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <PillInput
                  placeholder="e.g. Watch the sunset together"
                  value={planText}
                  onChange={setPlanText}
                  maxLength={60}
                  onSubmit={handleAddPlan}
                  submitLabel={saving ? '…' : 'Add'}
                />
              </Section>

              {/* ── Add a Quote ── */}
              <Section title="Add a Quote">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <textarea
                    placeholder="Quote text…"
                    value={quoteText}
                    onChange={e => setQuoteText(e.target.value)}
                    maxLength={300}
                    rows={3}
                    style={{
                      background: 'var(--surf2)',
                      border: '1px solid var(--border)', borderRadius: 12,
                      padding: '10px 14px', fontSize: 13, color: 'var(--text)',
                      fontFamily: "'Playfair Display', serif", fontStyle: 'italic',
                      fontWeight: 300, outline: 'none', resize: 'none',
                      lineHeight: 1.5,
                    }}
                  />
                  <PillInput
                    placeholder="Author (optional)"
                    value={quoteAuth}
                    onChange={setQuoteAuth}
                    maxLength={50}
                    onSubmit={handleAddQuote}
                    submitLabel={saving ? '…' : 'Save'}
                  />
                </div>
              </Section>

              {/* Close */}
              <button
                onClick={onClose}
                style={{
                  width: '100%', padding: '13px',
                  background: 'transparent', border: '1px solid var(--border)',
                  borderRadius: 14, fontSize: 11, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: 'var(--text-dim)',
                  fontFamily: "'Outfit', sans-serif", fontWeight: 300,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>

            {/* Toast */}
            <AnimatePresence>
              {toast && <Toast msg={toast} />}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
