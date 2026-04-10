import { useState, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

export default function VideoCard({ url }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);

  const togglePlay = () => {
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div className="panel" style={{ padding: 0, position: 'relative', overflow: 'hidden', borderRadius: '18px' }}>
      <video
        ref={videoRef}
        src={url}
        playsInline
        loop
        style={{ width: '100%', display: 'block', borderRadius: '18px' }}
        onClick={togglePlay}
      />
      
      {!playing && (
        <div 
          onClick={togglePlay}
          style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.2)', cursor: 'pointer'
          }}
        >
          <div style={{ background: 'var(--surface)', padding: '12px', borderRadius: '50%', border: '1px solid var(--border2)' }}>
            <Play size={24} color="var(--rose)" fill="var(--rose)" />
          </div>
        </div>
      )}
    </div>
  );
}