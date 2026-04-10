import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { subscribeGallery, addMediaViaLink, deleteGalleryItem } from '../firebase/services' 
import { Plus, Check, X, Trash2 } from 'lucide-react'

function ArrowLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-mid)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15,18 9,12 15,6" />
    </svg>
  )
}
function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-mid)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9,18 15,12 9,6" />
    </svg>
  )
}

export default function Gallery() {
  const [items, setItems]   = useState([])
  const [idx, setIdx]       = useState(0)
  const [isAdding, setIsAdding] = useState(false)
  const [linkInput, setLinkInput] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const unsub = subscribeGallery(data => {
      setItems(data)
      if (items.length === 0) setIdx(0) 
    })
    return unsub
  }, [items.length])

  function move(dir) {
    setIdx(prev => (prev + dir + items.length) % items.length)
  }

  const handleLinkSubmit = async () => {
    if (!linkInput) return
    setUploading(true)
    try {
      await addMediaViaLink(linkInput)
      setLinkInput('')
      setIsAdding(false)
    } catch (error) {
      console.error("Save failed:", error)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (items.length === 0) return;
    if (window.confirm("Delete this memory?")) {
      await deleteGalleryItem(items[idx].id);
      // Snap to previous item if we delete the last one
      if (idx >= items.length - 1) {
         setIdx(Math.max(0, items.length - 2));
      }
    }
  };

  const GalleryHeader = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 300, fontSize: 30, color: 'var(--text)', margin: 0 }}>
        Gallery
      </h1>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {items.length > 0 && (
          <span style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 300 }}>
            {idx + 1} / {items.length}
          </span>
        )}

        {isAdding ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surf2)', padding: '4px 8px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <input 
              autoFocus
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="Paste link..."
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '11px', color: 'var(--text)', width: '120px' }}
            />
            <button onClick={handleLinkSubmit} style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', display: 'flex' }}>
              {uploading ? '...' : <Check size={16} />}
            </button>
            <button onClick={() => setIsAdding(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex' }}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            style={{ background: 'var(--rose-dim)', color: 'var(--rose)', border: 'none', padding: '8px 14px', borderRadius: '12px', fontSize: '11px', display: 'flex', gap: '6px', alignItems: 'center', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}
          >
            <Plus size={14} /> Add
          </button>
        )}
      </div>
    </div>
  )

  if (items.length === 0) {
    return (
      <>
        <GalleryHeader />
        <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
          <span style={{ fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>No memories yet</span>
        </div>
      </>
    )
  }

  const current = items[idx]

  return (
    <>
      <GalleryHeader />

      {/* Carousel panel */}
      <div className="panel" style={{ padding: 14 }}>
        {/* Slide */}
        <div style={{ borderRadius: 18, overflow: 'hidden', background: 'var(--surf2)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            >
              {current.type === 'video' ? (
                <video
                  key={current.url}
                  src={current.url}
                  controls
                  playsInline
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'contain', display: 'block', borderRadius: '18px 18px 0 0', background: '#000' }}
                />
              ) : (
                <img
                  src={current.url}
                  alt="Memory"
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block', borderRadius: '18px 18px 0 0' }}
                  onError={e => { e.target.style.display = 'none' }}
                />
              )}

              {/* The Delete Button inside the card footer */}
              <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {current.type === 'video' ? 'Video Memory' : 'Photo Memory'}
                </span>
                <button 
                  onClick={handleDelete} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', padding: '4px' }}
                  title="Delete Memory"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 14 }}>
          <button onClick={() => move(-1)} className="nav-btn-style">
            <ArrowLeft />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflowX: 'auto', maxWidth: '120px' }}>
            {items.map((_, i) => (
              <div
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  height: 5, borderRadius: 3, cursor: 'pointer', transition: 'all 0.3s', flexShrink: 0,
                  width: i === idx ? 14 : 5,
                  background: i === idx ? 'var(--rose)' : 'var(--border2)'
                }}
              />
            ))}
          </div>

          <button onClick={() => move(1)} className="nav-btn-style">
            <ArrowRight />
          </button>
        </div>
      </div>

      <style>{`
        .nav-btn-style {
          width: 34px; height: 34px; border-radius: 50%; background: var(--surface);
          border: 1px solid var(--border2); display: flex; align-items: center;
          justify-content: center; cursor: pointer;
        }
      `}</style>
    </>
  )
}