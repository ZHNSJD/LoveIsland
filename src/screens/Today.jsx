import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getAllQuotes } from '../firebase/services'
import SharedPulse from '../components/SharedPulse'
import { Palette, ArrowRight } from 'lucide-react';

export default function Today({ onLongPressMe }) {
  // 1. THIS IS THE LINE THAT WAS MISSING! We need 'quotes' (plural array)
  const [quotes, setQuotes] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showThemes, setShowThemes] = useState(false);

  const themes = [
    { id: 'midnight', label: 'Midnight Garden', color: '#e84a70' },
    { id: 'golden', label: 'Golden Hour', color: '#e5ab60' },
    { id: 'deepsea', label: 'Deep Sea', color: '#4ddbd0' },
    { id: 'twilight', label: 'Twilight', color: '#c59df5' },
    { id: 'mistysage', label: 'Misty Sage', color: '#2b5c38' },
    { id: 'sakura', label: 'Sakura', color: '#9c2340' },
    { id: 'skylight', label: 'Skylight', color: '#1e4c82' },
  ];

  const changeTheme = (id) => {
    document.documentElement.setAttribute('data-theme', id);
    localStorage.setItem('love-app-theme', id);
    setShowThemes(false);
  };

  useEffect(() => {
    // Fetch all quotes once when the app loads
    getAllQuotes()
      .then((data) => {
        if (data && data.length > 0) {
          setQuotes(data);
          // Default to the "Daily Math" index when it first loads
          const now = new Date();
          const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
          setCurrentIndex(seed % data.length);
        } else {
          // Fallback if database is empty
          setQuotes([{ text: 'You are my today and all of my tomorrows.', author: 'Leo Christopher' }]);
        }
      })
      .catch(() => setQuotes([{ text: 'You are my today and all of my tomorrows.', author: 'Leo Christopher' }]))
      .finally(() => setLoading(false))
  }, [])

  // The function to cycle to the next quote
  const handleNextQuote = () => {
    if (quotes.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }
  };

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  
  // Grab the specific quote we are currently looking at
  const currentQuote = quotes[currentIndex];

  return (
    <>
      <SharedPulse onLongPressMe={onLongPressMe} />

      {/* ── Clean, Combined Header ── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 300, fontSize: 30, color: 'var(--text)', margin: 0 }}>
            Today
          </h1>
          <span style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 300 }}>
            {today}
          </span>
        </div>

        {/* Theme Switcher Button */}
        <div style={{ position: 'relative' }}>
          <button 
            type="button"
            onClick={() => setShowThemes(!showThemes)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '8px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Palette size={20} color="var(--rose)" strokeWidth={1.5} />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showThemes && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute', right: 0, top: '40px',
                  background: 'var(--surface)', border: '1px solid var(--border2)',
                  borderRadius: '16px', padding: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                  zIndex: 100, minWidth: '150px'
                }}
              >
                {themes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => changeTheme(t.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 12px', background: 'transparent', border: 'none',
                      cursor: 'pointer', borderRadius: '10px', transition: 'background 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--surf2)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ 
                      width: '16px', height: '16px', borderRadius: '50%', 
                      background: t.color, border: '1px solid var(--border2)' 
                    }} />
                    <span style={{ 
                      fontSize: '11px', textTransform: 'uppercase', 
                      letterSpacing: '0.1em', color: 'var(--text)', fontWeight: 300 
                    }}>
                      {t.label}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ── Quote Panel ── */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 24px', marginTop: '10px' }}>
        {loading ? (
          <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
              style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--border2)', borderTopColor: 'var(--rose)' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        ) : (
          <motion.div 
            key={currentIndex} 
            initial={{ opacity: 0, y: 8 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
          >
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 60, fontWeight: 300, color: 'var(--rose)', opacity: 0.55, lineHeight: 1, marginBottom: 8, alignSelf: 'flex-start' }}>
              "
            </span>
            <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 300, fontSize: 21, lineHeight: 1.6, color: 'var(--text)', textAlign: 'center' }}>
              {currentQuote?.text}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', margin: '18px 0 14px' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--rose)', flexShrink: 0 }} />
              <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
            </div>
            <span style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--rose-lt)', fontWeight: 300 }}>
              {currentQuote?.author}
            </span>

            {/* ── The Next Quote Button ── */}
            {quotes.length > 1 && (
              <button
                onClick={handleNextQuote}
                style={{
                  marginTop: '24px',
                  background: 'transparent',
                  border: '1px solid var(--border2)',
                  color: 'var(--text-dim)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => { 
                  e.currentTarget.style.color = 'var(--rose)'; 
                  e.currentTarget.style.borderColor = 'var(--rose)'; 
                }}
                onMouseOut={(e) => { 
                  e.currentTarget.style.color = 'var(--text-dim)'; 
                  e.currentTarget.style.borderColor = 'var(--border2)'; 
                }}
              >
                Next Quote <ArrowRight size={14} />
              </button>
            )}
          </motion.div>
        )}
      </div>
    </>
  )
}