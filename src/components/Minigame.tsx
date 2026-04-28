import React, { useEffect, useRef, useState } from 'react';

interface MinigameProps {
  onWin: () => void;
  onLose: () => void;
}

export function Minigame({ onWin, onLose }: MinigameProps) {
  const [, setRenderTick] = useState(0);
  
  const fishRef = useRef(50);
  const catcherRef = useRef(50);
  const progressRef = useRef(30);
  const fishDirRef = useRef(1);
  const keysRef = useRef({ ArrowLeft: false, ArrowRight: false });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.code === 'KeyA') {
        keysRef.current.ArrowLeft = true;
        e.preventDefault();
      }
      if (e.key === 'ArrowRight' || e.code === 'KeyD') {
        keysRef.current.ArrowRight = true;
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.ArrowLeft = false;
      if (e.key === 'ArrowRight' || e.code === 'KeyD') keysRef.current.ArrowRight = false;
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    let raf: number;
    let lastTime = performance.now();
    let isActive = true;

    const loop = (time: number) => {
      if (!isActive) return;
      const dt = time - lastTime;
      lastTime = time;

      // Update Catcher based on keys (smooth delta movement)
      if (keysRef.current.ArrowLeft) catcherRef.current = Math.max(0, catcherRef.current - dt * 0.08);
      if (keysRef.current.ArrowRight) catcherRef.current = Math.min(100, catcherRef.current + dt * 0.08);

      // Random erratic fish movement
      if (Math.random() < 0.04) fishDirRef.current *= -1;
      
      fishRef.current += fishDirRef.current * dt * 0.035; // Fish speed
      if (fishRef.current < 0) { fishRef.current = 0; fishDirRef.current = 1; }
      if (fishRef.current > 100) { fishRef.current = 100; fishDirRef.current = -1; }

      // Check Overlap
      const dist = Math.abs(fishRef.current - catcherRef.current);
      const tolerance = 15; // 15% width tolerance

      if (dist < tolerance) {
        progressRef.current += dt * 0.025; // Fills up over ~4 seconds
      } else {
        progressRef.current -= dt * 0.02; // Depletes slightly slower
      }

      progressRef.current = Math.max(0, Math.min(100, progressRef.current));

      setRenderTick(t => t + 1);

      if (progressRef.current >= 100) {
        onWin();
      } else if (progressRef.current <= 0) {
        onLose();
      } else {
        raf = requestAnimationFrame(loop);
      }
    };

    raf = requestAnimationFrame(loop);
    return () => {
      isActive = false;
      cancelAnimationFrame(raf);
    };
  }, [onWin, onLose]);

  // Determine color of progress bar based on amount
  const getProgressColor = () => {
    if (progressRef.current > 75) return 'bg-green-500';
    if (progressRef.current > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-50">
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">FISH ON!</h2>
        <p className="text-white/80 font-medium tracking-wide">KEEP THE SLIDER IN THE ZONE</p>
      </div>
      
      {/* Catch Meter */}
      <div className="relative w-[500px] h-12 bg-slate-900/80 rounded-full border-4 border-slate-800 p-1 flex items-center shadow-2xl mb-8">
        {/* The Zone (User controlled) */}
        <div 
          className="absolute h-full bg-emerald-500/40 border-x-2 border-emerald-400"
          style={{ left: `${Math.max(0, catcherRef.current - 15)}%`, width: '30%' }}
        />
        
        {/* Fish indicator */}
        <div 
          className="absolute top-1/2 -mt-3 w-6 h-6 bg-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.8)] border-2 border-white flex items-center justify-center z-10"
          style={{ left: `${fishRef.current}%`, transform: 'translateX(-50%)' }}
        >
          <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
        </div>
      </div>

      {/* Progress Bar (Overall tension/progress) */}
      <div className="w-[500px] flex flex-col gap-1">
        <div className="flex justify-between text-[10px] text-slate-400 font-bold tracking-widest">
          <span>LOSE</span>
          <span>CATCH</span>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner">
           <div 
             className={`h-full transition-colors duration-300 ${getProgressColor()}`}
             style={{ width: `${progressRef.current}%` }}
           />
        </div>
      </div>
      
      {/* Control Hints & On-Screen Buttons */}
      <div className="mt-12 flex gap-12 sm:gap-20">
        <button 
          onPointerDown={() => keysRef.current.ArrowLeft = true}
          onPointerUp={() => keysRef.current.ArrowLeft = false}
          onPointerLeave={() => keysRef.current.ArrowLeft = false}
          className="flex flex-col items-center gap-2 select-none touch-none"
        >
          <kbd className={`px-4 py-3 rounded-xl border-b-4 text-2xl font-bold text-white min-w-[4rem] text-center shadow-lg uppercase leading-none transition-all ${keysRef.current.ArrowLeft ? 'bg-white/30 border-white/40 translate-y-1' : 'bg-white/10 border-white/20'}`}>←</kbd>
          <span className="text-[10px] font-bold text-white/70 tracking-widest">PULL LEFT</span>
        </button>
        <button 
          onPointerDown={() => keysRef.current.ArrowRight = true}
          onPointerUp={() => keysRef.current.ArrowRight = false}
          onPointerLeave={() => keysRef.current.ArrowRight = false}
          className="flex flex-col items-center gap-2 select-none touch-none"
        >
          <kbd className={`px-4 py-3 rounded-xl border-b-4 text-2xl font-bold text-white min-w-[4rem] text-center shadow-lg uppercase leading-none transition-all ${keysRef.current.ArrowRight ? 'bg-white/30 border-white/40 translate-y-1' : 'bg-white/10 border-white/20'}`}>→</kbd>
          <span className="text-[10px] font-bold text-white/70 tracking-widest">PULL RIGHT</span>
        </button>
      </div>
    </div>
  );
}
