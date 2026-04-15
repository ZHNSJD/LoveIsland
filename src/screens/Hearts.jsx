import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Clock, Sparkles } from 'lucide-react'
import { sendHeart, subscribeHearts } from '../firebase/services'

import { auth } from '../firebase/config'
import { MY_UID } from '../firebase/services'

export default function Hearts() {
  const [history, setHistory] = useState([])
  const [sending, setSending] = useState(null)

  useEffect(() => {
    // Start listening to the history feed when the screen loads
    const unsub = subscribeHearts(setHistory)
    return unsub
  }, [])

  const handleSend = async (type) => {
    if (sending) return // Prevent double-tapping
    setSending(type)
    
    // Trigger Phone Vibration (50ms sharp thump)
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50) 
    }
    
    try {
      await sendHeart(type)
      // Keep the "sent" state active for 2 seconds so the particle animation finishes
      setTimeout(() => setSending(null), 2000)
    } catch (e) {
      console.error("Failed to send heart:", e)
      setSending(null)
    }
  }

  const cards = [
    { id: 'thinking', label: 'Thinking of you', sub: 'Sends a soft notification', icon: '❤️', color: '#ff4d6d' },
    { id: 'miss', label: "Can't wait to see you", sub: 'Countdown to next time', icon: '✨', color: '#70d6ff' }
  ]

  return (
    <div style={{ position: 'relative', minHeight: '80vh', paddingBottom: '100px', overflow: 'hidden' }}>
      
      {/* 1. THE PULSE BACKGROUND */}
      <motion.div 
        animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)',
          width: '350px', height: '350px', borderRadius: '50%',
          background: 'radial-gradient(circle, var(--rose) 0%, transparent 70%)',
          filter: 'blur(50px)', zIndex: -1, pointerEvents: 'none'
        }}
      />

      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 34, color: 'var(--text)', margin: 0 }}>
          Send a little love
        </h1>
        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-dim)', marginTop: 8 }}>
          She gets notified right away
        </p>
      </header>

      {/* 2. THE HERO CARDS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {cards.map((card) => (
          <motion.div
            key={card.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleSend(card.id)}
            style={{
              background: 'var(--surf2)',
              borderRadius: '28px',
              padding: '24px',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              position: 'relative',
              boxShadow: sending === card.id ? `0 0 40px ${card.color}33` : 'none',
              transition: 'box-shadow 0.4s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '40px', filter: sending === card.id ? `drop-shadow(0 0 10px ${card.color})` : 'none', transition: '0.3s' }}>
                  {card.icon}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text)' }}>{card.label}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{card.sub}</span>
                </div>
              </div>

              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AnimatePresence mode="wait">
                  {sending === card.id ? (
                    <motion.div key="sparkle" initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                      <Sparkles size={20} color={card.color} />
                    </motion.div>
                  ) : (
                    <motion.div key="send" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Send size={18} color="var(--text-dim)" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* 3. THE PARTICLE EXPLOSION EFFECT */}
            {sending === card.id && (
              <div style={{ position: 'absolute', top: '50%', right: '40px', pointerEvents: 'none', zIndex: 1 }}>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 1, x: 0, y: 0, scale: 0.5 }}
                    animate={{
                      opacity: 0,
                      x: (Math.random() - 0.5) * 120, // Explode outwards
                      y: -60 - Math.random() * 80,    // Float upwards
                      scale: 1 + Math.random()
                    }}
                    transition={{ duration: 1 + Math.random() * 0.5, ease: "easeOut" }}
                    style={{ position: 'absolute', fontSize: '20px' }}
                  >
                    {card.icon}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* 4. THE HISTORY OF LOVE FEED */}
      <div style={{ marginTop: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', opacity: 0.6 }}>
          <Clock size={12} color="var(--text-dim)" />
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-dim)' }}>Recent Interactions</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.length > 0 ? history.map((item, i) => {
            // Check if the person logged in is the one who sent it
            const isMe = item.sentBy === auth.currentUser?.uid;

            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1 - (i * 0.25), y: 0 }} // Fades out older items automatically!
                key={i}
                style={{ 
                  padding: '14px 20px', 
                  background: 'var(--bg2)', 
                  borderRadius: '16px',
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  border: '1px solid var(--border2)',
                }}
              >
                <span style={{ fontSize: '13px', color: 'var(--text)' }}>
                  {/* The Clean Label */}
                  <span style={{ fontWeight: 600, opacity: 0.8, marginRight: '6px' }}>
                    {isMe ? "You sent:" : "She sent:"}
                  </span>
                  {/* The Action */}
                  {item.type === 'thinking' ? '❤️ Thinking of you' : '✨ Miss you'}
                </span>
                
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  {item.sentAt?.toDate ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(item.sentAt.toDate()) : 'Now'}
                </span>
              </motion.div>
            )
          }) : (
            <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--border2)', borderRadius: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>No love sent yet today. Be the first!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}