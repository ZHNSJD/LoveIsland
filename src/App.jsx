import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BottomNav from './components/BottomNav'
import CommandSheet from './components/CommandSheet'
import Today from './screens/Today'
import Gallery from './screens/Gallery'
import Hearts from './screens/Hearts'
import Plans from './screens/Plans'
import {
  initFCM,
  onForegroundMessage,
  subscribePresence,
  HER_UID,
} from './firebase/services'

export default function App({ user }) {
  const [activeTab,      setActiveTab]      = useState('today')
  const [commandOpen,    setCommandOpen]    = useState(false)
  const [myData,         setMyData]         = useState({ moodPercentage: 50, statusText: '' })
  const [herData,        setHerData]        = useState({ moodPercentage: 50, statusText: '' })

  // ── Presence subscription ───────────────────────────
  useEffect(() => {
    if (!user?.uid || !HER_UID || HER_UID === 'HER_UID_HERE') return
    const unsub = subscribePresence(user.uid, HER_UID, ({ me, her }) => {
      setMyData(me)
      setHerData(her)
    })
    return unsub
  }, [user?.uid])

  // ── Theme Initialization ───────────────────────────
  useEffect(() => {
  const savedTheme = localStorage.getItem('love-app-theme') || 'midnight';
  document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // ── Push notifications ──────────────────────────────
  useEffect(() => {
    initFCM()
    const unsub = onForegroundMessage(payload => {
      console.info('Foreground message:', payload)
    })
    return unsub
  }, [])

  // ── Screen map — Today gets presence props ──────────
  const screens = {
    today: (
      <Today
        myData={myData}
        herData={herData}
        onLongPressMe={() => setCommandOpen(true)}
      />
    ),
    gallery: <Gallery />,
    hearts:  <Hearts user={user} />,
    plans:   <Plans user={user} />,
  }

  return (
    <div style={{
      position: 'relative', height: '100vh', maxWidth: 480,
      margin: '0 auto', background: 'var(--bg)', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400,
        background: 'radial-gradient(circle, var(--rose-glow) 0%, transparent 65%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Screen area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: 0,
              padding: '28px 20px 80px',
              overflowY: 'auto', display: 'flex',
              flexDirection: 'column', gap: 18,
            }}
          >
            {screens[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Command Sheet — rendered outside screen area so it overlays everything */}
      <CommandSheet
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        initialMood={myData?.moodPercentage ?? 50}
        initialStatus={myData?.statusText ?? ''}
  
  
        onInstantMoodChange={(newMood) => {
        setMyData(prev => ({ ...prev, moodPercentage: newMood }))
      }}
      />
    </div>
  )
}
