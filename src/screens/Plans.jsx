import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { subscribePlans, togglePlan } from '../firebase/services'

function PlanItem({ plan, onToggle }) {
  return (
    <motion.div
      layout
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 12px', borderRadius: 13, cursor: 'pointer',
        transition: 'background 0.2s'
      }}
      whileHover={{ background: 'rgba(212,96,122,0.05)' }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Circle checkbox */}
      <motion.div
        style={{
          width: 17, height: 17, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s',
          background:  plan.done ? 'var(--rose)' : 'transparent',
          border:      plan.done ? 'none'        : '1.5px solid var(--border2)',
          boxShadow:   plan.done ? '0 0 7px rgba(212,96,122,0.4)' : 'none',
        }}
        animate={{ scale: plan.done ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 0.25 }}
      >
        <AnimatePresence>
          {plan.done && (
            <motion.svg
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              width="8" height="7" viewBox="0 0 8 7" fill="none"
            >
              <polyline points="1,3.5 3,5.5 7,1" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Title */}
      <span style={{
        flex: 1, fontSize: 13, fontWeight: 300,
        color: plan.done ? 'var(--text-dim)' : 'var(--text)',
        textDecoration: plan.done ? 'line-through' : 'none',
        transition: 'all 0.3s'
      }}>
        {plan.title}
      </span>

      {/* Tag */}
      {plan.emoji && (
        <span style={{ fontSize: 14 }}>{plan.emoji}</span>
      )}
    </motion.div>
  )
}

export default function Plans({ user }) {
  const [plans, setPlans] = useState([])

  useEffect(() => {
    const unsub = subscribePlans(setPlans)
    return unsub
  }, [])

  async function handleToggle(plan) {
    const newDone = !plan.done
    // Optimistic update
    setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, done: newDone } : p))
    try {
      await togglePlan(plan.id, newDone)
    } catch (err) {
      // Rollback on error
      console.warn('togglePlan failed, rolling back:', err)
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, done: plan.done } : p))
    }
  }

  const categories = ['Date Night', 'Future Dreams']
  const doneCount  = plans.filter(p => p.done).length

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 300, fontSize: 22, color: 'var(--text)' }}>
          Plans
        </h1>
        <span style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 300 }}>
          {doneCount} done
        </span>
      </div>

      {/* Plans panel */}
      <div className="panel">
        {categories.map((cat, ci) => {
          const catPlans = plans.filter(p => p.category === cat)
          if (catPlans.length === 0) return null
          return (
            <div key={cat} style={{ marginBottom: ci < categories.length - 1 ? 14 : 0 }}>
              <div className="section-label" style={{ marginBottom: 6 }}>
                <span>{cat}</span>
              </div>
              {catPlans.map(plan => (
                <PlanItem
                  key={plan.id}
                  plan={plan}
                  onToggle={() => handleToggle(plan)}
                />
              ))}
            </div>
          )
        })}

        {plans.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-dim)', fontSize: 12, letterSpacing: '0.1em' }}>
            No plans yet — add some in Firebase Console
          </div>
        )}
      </div>
    </>
  )
}
