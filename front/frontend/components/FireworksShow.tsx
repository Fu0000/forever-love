import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, X, Play } from 'lucide-react';
import { Button } from './ui/Button';

export const FireworksShow: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    class Particle {
      x: number; y: number; color: string; velocity: { x: number; y: number }; alpha: number;
      constructor(x: number, y: number, color: string) {
        this.x = x; this.y = y; this.color = color;
        this.velocity = { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 };
        this.alpha = 1;
      }
      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
      }
      update() {
        this.velocity.y += 0.05;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01;
      }
    }

    let particles: Particle[] = [];
    const colors = ['#FF5E78', '#FFC107', '#00CFD5', '#9C27B0', '#FFFFFF'];

    const createFirework = (x: number, y: number) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < 50; i++) {
        particles.push(new Particle(x, y, color));
      }
    };

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (Math.random() < 0.05) {
        createFirework(Math.random() * canvas.width, Math.random() * canvas.height * 0.7);
      }

      particles.forEach((p, i) => {
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        } else {
          p.update();
          p.draw();
        }
      });
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
    >
      {!isPlaying ? (
        <div className="text-center space-y-6 p-8">
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-24 h-24 bg-rose-500 rounded-full flex items-center justify-center mx-auto text-white shadow-2xl shadow-rose-500/50"
          >
            <Heart fill="currentColor" size={48} />
          </motion.div>
          <h2 className="text-3xl font-black text-white font-cute">准备好一起看烟花了吗？</h2>
          <p className="text-rose-200/70">在这个宁静的夜晚，只想和你虚度时光。</p>
          <div className="flex gap-4 justify-center">
            <Button variant="secondary" onClick={onClose} className="rounded-full px-8">返回</Button>
            <Button onClick={() => setIsPlaying(true)} className="rounded-full px-8 flex items-center gap-2">
              <Play size={18} /> 开始表演
            </Button>
          </div>
        </div>
      ) : (
        <>
          <canvas ref={canvasRef} className="absolute inset-0" />
          <div className="absolute top-8 right-8 z-10">
            <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-colors">
              <X size={24} />
            </button>
          </div>
          <div className="absolute bottom-12 text-center z-10 pointer-events-none">
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white/60 font-cute text-xl tracking-widest"
            >
              愿年年岁岁，都有你陪我看烟花 ✨
            </motion.p>
          </div>
        </>
      )}
    </motion.div>
  );
};