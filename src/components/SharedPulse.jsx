import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { subscribePresence } from '../firebase/services'

// ─── Mood tier helpers ──────────────────────────────────
export function getMoodTier(pct = 50) {
  if (pct <= 30) return 'drained'
  if (pct <= 70) return 'neutral'
  return 'radiant'
}

function getMoodColor(pct = 50) {
  if (pct <= 30) return 'var(--text-dim)'
  if (pct <= 70) return 'var(--rose-glow)'
  return 'var(--rose)'
}

function getMoodGlow(pct = 50) {
  if (pct <= 30) return 'none'
  if (pct <= 70) return '0 0 14px var(--rose-dim)'
  return '0 0 22px var(--rose-glow), 0 0 6px var(--rose-dim)'
}

function getMoodFilter(pct = 50) {
  if (pct <= 30) return 'grayscale(0.7) brightness(0.8)'
  if (pct <= 70) return 'grayscale(0.1)'
  return 'saturate(1.15) brightness(1.05)'
}

// ─── ECG wave paths by tier ─────────────────────────────
const ECG_PATHS = {
  drained: 'M0,30 C20,30 40,30 60,30 C70,28 75,30 80,30 C85,32 90,30 100,30 C120,30 160,30 200,30 C220,28 225,30 230,30 C235,32 240,30 280,30',
  neutral: 'M0,30 L40,30 L44,30 L46,22 L50,38 L52,30 L60,30 L62,26 L64,30 L100,30 L140,30 L144,30 L146,22 L150,38 L152,30 L160,30 L162,26 L164,30 L200,30 L240,30 L244,30 L246,22 L250,38 L252,30 L260,30 L262,26 L264,30 L280,30',
  radiant: 'M0,30 L24,30 L26,26 L28,34 L30,30 L32,10 L34,50 L36,30 L38,24 L40,30 L60,30 L84,30 L86,26 L88,34 L90,30 L92,10 L94,50 L96,30 L98,24 L100,30 L120,30 L144,30 L146,26 L148,34 L150,30 L152,10 L154,50 L156,30 L158,24 L160,30 L180,30 L204,30 L206,26 L208,34 L210,30 L212,10 L214,50 L216,30 L218,24 L220,30 L240,30 L264,30 L266,26 L268,34 L270,30 L272,12 L274,50 L276,30 L278,26 L280,30',
}

const ECG_COLORS = {
  drained: 'var(--text-dim)',
  neutral: 'var(--rose-glow)',
  radiant: 'var(--rose)',
}

const ECG_DURATIONS = { drained: 4.5, neutral: 2.8, radiant: 1.6 }

// ─── SVG Face Avatar ────────────────────────────────────
function AvatarFace({ label, pct = 50, isMe = false, onLongPress }) {
  const tier     = getMoodTier(pct)
  const color    = getMoodColor(pct)
  const glow     = getMoodGlow(pct)
  const filter   = getMoodFilter(pct)
  const pressTimer = useRef(null)

  const eyes = {
    drained: (
      <>
        <path d="M13,20 Q16,22 19,20" fill="none" stroke="var(--text-dim)" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M29,20 Q32,22 35,20" fill="none" stroke="var(--text-dim)" strokeWidth="1.8" strokeLinecap="round"/>
      </>
    ),
    neutral: (
      <>
        <circle cx="16" cy="20" r="2.2" fill="var(--text-mid)"/>
        <circle cx="32" cy="20" r="2.2" fill="var(--text-mid)"/>
      </>
    ),
    radiant: (
      <>
        <circle cx="16" cy="19" r="2.5" fill="var(--text)"/>
        <circle cx="32" cy="19" r="2.5" fill="var(--text)"/>
        <circle cx="17.5" cy="17.8" r="0.9" fill="var(--surface)"/>
        <circle cx="33.5" cy="17.8" r="0.9" fill="var(--surface)"/>
      </>
    ),
  }

  const mouth = {
    drained: <path d="M16,32 Q24,30 32,32" fill="none" stroke="var(--text-dim)" strokeWidth="1.6" strokeLinecap="round"/>,
    neutral: <path d="M16,32 Q24,33 32,32" fill="none" stroke="var(--text-mid)" strokeWidth="1.6" strokeLinecap="round"/>,
    radiant: <path d="M15,31 Q24,37 33,31" fill="none" stroke="var(--text)" strokeWidth="1.8" strokeLinecap="round"/>,
  }

  function startPress() {
    if (!isMe || !onLongPress) return
    pressTimer.current = setTimeout(onLongPress, 600)
  }
  function cancelPress() {
    clearTimeout(pressTimer.current)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <motion.div
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        animate={{ boxShadow: glow }}
        transition={{ duration: 1.2 }}
        style={{
          width: 58, height: 58, borderRadius: '50%',
          border: `1.5px solid ${color}`,
          background: 'var(--surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: isMe ? 'pointer' : 'default',
          filter,
          transition: 'filter 1s, border-color 1s',
          position: 'relative',
          userSelect: 'none',
        }}
      >
        {tier === 'radiant' && (
          <motion.div
            style={{
              position: 'absolute', inset: -5, borderRadius: '50%',
              border: '1px solid var(--rose)', opacity: 0.3,
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <svg width="48" height="48" viewBox="0 0 48 48">
          {eyes[tier]}
          {mouth[tier]}
        </svg>

        {isMe && (
          <div style={{
            position: 'absolute', bottom: 2, right: 2,
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--rose)', opacity: 0.6,
            border: '1px solid var(--bg)',
          }}/>
        )}
      </motion.div>

      <span style={{
        fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--text-dim)', fontWeight: 300,
      }}>
        {label}
      </span>

      <span style={{
        fontSize: 11, color: color, fontWeight: 300,
        transition: 'color 1s',
        letterSpacing: '0.04em',
      }}>
        {Math.round(pct)}%
      </span>
    </div>
  )
}

// ─── ECG Wave ───────────────────────────────────────────
function ECGWave({ avgPct = 50 }) {
  const tier     = getMoodTier(avgPct)
  const path     = ECG_PATHS[tier]
  const color    = ECG_COLORS[tier]
  const duration = ECG_DURATIONS[tier]

  const dashLen = 600

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', margin: '-2px -8px 0 -8px' }}>
      <svg
        width="100%" viewBox="0 0 280 60" preserveAspectRatio="none"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <clipPath id="ecgClip">
            <rect x="0" y="0" width="280" height="60"/>
          </clipPath>
        </defs>

        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.15"
          clipPath="url(#ecgClip)"
        />

        <motion.path
          key={tier} // Forces animation to restart smoothly when tier changes
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          clipPath="url(#ecgClip)"
          style={{ strokeDasharray: dashLen }}
          animate={{ strokeDashoffset: [0, -dashLen] }}
          transition={{ duration, repeat: Infinity, ease: 'linear' }}
        />

        <motion.circle
          key={`dot-${tier}`}
          r="3"
          fill={color}
          initial={{ cx: 0, cy: 30 }}
          animate={{ cx: 280, cy: 30 }}
          transition={{ duration, repeat: Infinity, ease: 'linear' }}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
    </div>
  )
}

// ─── Main SharedPulse component ─────────────────────────
// ─── Main SharedPulse component ─────────────────────────
export default function SharedPulse({ onLongPressMe }) {
  const [presence, setPresence] = useState({ me: null, partner: null })

  useEffect(() => {
    const unsub = subscribePresence(setPresence)
    return unsub
  }, [])

  if (!presence.me || !presence.partner) return <div style={{ height: 100 }} />

  // 1. THE ECG FIX: Calculate the true average of both your moods
  const myMood = presence.me.moodPercentage ?? 50;
  const partnerMood = presence.partner.moodPercentage ?? 50;
  const sharedMoodAverage = Math.round((myMood + partnerMood) / 2.5);

  return (
    <div className="panel" style={{ 
      display: 'flex', 
      alignItems: 'flex-start', 
      justifyContent: 'space-between', 
      padding: '24px 20px', 
      borderRadius: '32px', 
      marginBottom: '20px',
      background: 'var(--surf2)' 
    }}>
      
      {/* ── THE "ME" AVATAR ── */}
      <AvatarFace 
        label="Me" 
        pct={myMood} 
        isMe={true} 
        // 2. THE MENU FIX: Pass the exact current mood out to the parent!
        onLongPress={() => onLongPressMe(myMood)} 
      />

      {/* ── THE HEARTBEAT ECG WAVE ── */}
      <ECGWave avgPct={sharedMoodAverage} />

      {/* ── THE "YOU" AVATAR ── */}
      <AvatarFace 
        label="You" 
        pct={partnerMood} 
        isMe={false} 
      />

    </div>
  )
}