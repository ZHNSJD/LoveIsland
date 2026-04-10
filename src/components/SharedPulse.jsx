import { useMemo, useEffect, useRef } from 'react'
import { motion, useAnimationControls } from 'framer-motion'

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
// All paths span x 0→280, centred on y=30 in a 280×60 viewBox.
const ECG_PATHS = {
  // Drained: slow, barely-there undulation
  drained: 'M0,30 C20,30 40,30 60,30 C70,28 75,30 80,30 C85,32 90,30 100,30 C120,30 160,30 200,30 C220,28 225,30 230,30 C235,32 240,30 280,30',
  // Neutral: standard single-peak beat
  neutral: 'M0,30 L40,30 L44,30 L46,22 L50,38 L52,30 L60,30 L62,26 L64,30 L100,30 L140,30 L144,30 L146,22 L150,38 L152,30 L160,30 L162,26 L164,30 L200,30 L240,30 L244,30 L246,22 L250,38 L252,30 L260,30 L262,26 L264,30 L280,30',
  // Radiant: sharp double-peak ECG (PQRST-ish)
  radiant: 'M0,30 L24,30 L26,26 L28,34 L30,30 L32,10 L34,50 L36,30 L38,24 L40,30 L60,30 L84,30 L86,26 L88,34 L90,30 L92,10 L94,50 L96,30 L98,24 L100,30 L120,30 L144,30 L146,26 L148,34 L150,30 L152,10 L154,50 L156,30 L158,24 L160,30 L180,30 L204,30 L206,26 L208,34 L210,30 L212,10 L214,50 L216,30 L218,24 L220,30 L240,30 L264,30 L266,26 L268,34 L270,30 L272,12 L274,50 L276,30 L278,26 L280,30',
}

const ECG_COLORS = {
  drained: 'var(--text-dim)',
  neutral: 'var(--rose-glow)',
  radiant: 'var(--rose)',
}

// Duration in seconds for one full scroll cycle
const ECG_DURATIONS = { drained: 4.5, neutral: 2.8, radiant: 1.6 }

// ─── SVG Face Avatar ────────────────────────────────────
function AvatarFace({ label, pct = 50, isMe = false, onLongPress }) {
  const tier    = getMoodTier(pct)
  const color   = getMoodColor(pct)
  const glow    = getMoodGlow(pct)
  const filter  = getMoodFilter(pct)
  const pressTimer = useRef(null)

  // Eye shapes per tier
  const eyes = {
    drained: (
      <>
        {/* Half-closed droopy eyes */}
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
        {/* little sparkle dot - uses surface color to look like a cutout */}
        <circle cx="17.5" cy="17.8" r="0.9" fill="var(--surface)"/>
        <circle cx="33.5" cy="17.8" r="0.9" fill="var(--surface)"/>
      </>
    ),
  }

  // Mouth shapes per tier
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
      {/* Outer glow ring */}
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
        {/* Breathing pulse ring for radiant */}
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

        {/* SVG face */}
        <svg width="48" height="48" viewBox="0 0 48 48">
          {eyes[tier]}
          {mouth[tier]}
        </svg>

        {/* Long-press hint dot for "me" */}
        {isMe && (
          <div style={{
            position: 'absolute', bottom: 2, right: 2,
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--rose)', opacity: 0.6,
            border: '1px solid var(--bg)',
          }}/>
        )}
      </motion.div>

      {/* Name label */}
      <span style={{
        fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--text-dim)', fontWeight: 300,
      }}>
        {label}
      </span>

      {/* Mood % */}
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

  // Approximate total path length for dasharray — 280px wide paths
  const dashLen = 600

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 6px' }}>
      <svg
        width="100%" viewBox="0 0 280 60" preserveAspectRatio="none"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <clipPath id="ecgClip">
            <rect x="0" y="0" width="280" height="60"/>
          </clipPath>
        </defs>

        {/* Static dim ghost path */}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.15"
          clipPath="url(#ecgClip)"
        />

        {/* Animated scrolling path */}
        <motion.path
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

        {/* Glowing head dot */}
        <motion.circle
          r="3"
          fill={color}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          animate={{
            // Approximate the x position as it scrolls
            cx: [0, 280],
            cy: 30, // simplified — stays near center
          }}
          transition={{ duration, repeat: Infinity, ease: 'linear' }}
        />
      </svg>
    </div>
  )
}

// ─── Main SharedPulse component ─────────────────────────
export default function SharedPulse({ myData, herData, onLongPressMe }) {
  const myMood  = myData?.moodPercentage  ?? 50
  const herMood = herData?.moodPercentage ?? 50
  const avgMood = (myMood + herMood) / 2

  const myStatus  = myData?.statusText  || null
  const herStatus = herData?.statusText || null

  const tier = getMoodTier(avgMood)

  const tierLabel = {
    drained: 'Resting',
    neutral: 'In sync',
    radiant: 'Energised',
  }[tier]

  return (
    <div className="panel" style={{ padding: '18px 16px 14px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{
          fontSize: 9, letterSpacing: '0.20em', textTransform: 'uppercase',
          color: 'var(--text-dim)', fontWeight: 300,
        }}>
          Shared Pulse
        </span>
        <span style={{
          fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: tier === 'radiant' ? 'var(--rose)' : 'var(--text-dim)',
          fontWeight: 300, transition: 'color 1s',
        }}>
          {tierLabel}
        </span>
      </div>

      {/* Avatars + ECG row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <AvatarFace
          label="You"
          pct={myMood}
          isMe
          onLongPress={onLongPressMe}
        />
        <ECGWave avgPct={avgMood} />
        <AvatarFace
          label="Her"
          pct={herMood}
        />
      </div>

      {/* Status texts */}
      {(myStatus || herStatus) && (
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: 10, gap: 8,
        }}>
          <span style={{
            fontSize: 10, color: 'var(--text-dim)', fontWeight: 300,
            fontStyle: 'italic', maxWidth: '45%', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {myStatus || ''}
          </span>
          <span style={{
            fontSize: 10, color: 'var(--text-dim)', fontWeight: 300,
            fontStyle: 'italic', maxWidth: '45%', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right',
          }}>
            {herStatus || ''}
          </span>
        </div>
      )}
    </div>
  )
}
