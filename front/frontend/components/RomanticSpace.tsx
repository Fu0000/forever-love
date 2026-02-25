import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Sparkles, Sun, Moon, Cloud, Flower2, Cat, Play, Wind } from 'lucide-react';
import { Button } from './ui/Button';

type SceneType = 'menu' | 'fireworks' | 'sunset' | 'stars' | 'balloons' | 'garden' | 'pets';

export const RomanticSpace: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeScene, setActiveScene] = useState<SceneType>('menu');

  const scenes = [
    { id: 'fireworks', label: '浪漫烟花秀', icon: <Sparkles />, color: 'from-indigo-600 to-purple-900', desc: '在夜空中绽放我们的爱' },
    { id: 'sunset', label: '一起看日落', icon: <Sun />, color: 'from-orange-400 to-rose-600', desc: '余晖洒满我们的世界' },
    { id: 'stars', label: '一起数星星', icon: <Moon />, color: 'from-slate-900 to-indigo-950', desc: '每一颗星都是一个愿望' },
    { id: 'balloons', label: '放飞热气球', icon: <Wind />, color: 'from-sky-400 to-blue-600', desc: '让爱随风远行' },
    { id: 'garden', label: '一起种小花', icon: <Flower2 />, color: 'from-emerald-400 to-teal-600', desc: '见证爱情的成长' },
    { id: 'pets', label: '一起喂小猫', icon: <Cat />, color: 'from-amber-300 to-orange-500', desc: '守护这份纯真的温柔' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col"
    >
      <AnimatePresence mode="wait">
        {activeScene === 'menu' ? (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex-1 flex flex-col p-8 bg-gradient-to-b from-rose-900 to-black overflow-y-auto no-scrollbar"
          >
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-3">
                <div className="bg-rose-500 p-2 rounded-2xl shadow-lg shadow-rose-500/50">
                  <Heart className="text-white" fill="currentColor" />
                </div>
                <h2 className="text-3xl font-black text-white font-cute">浪漫空间</h2>
              </div>
              <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                <X size={32} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {scenes.map((scene, idx) => (
                <motion.button
                  key={scene.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveScene(scene.id as SceneType)}
                  className={`bg-gradient-to-r ${scene.color} p-6 rounded-[2rem] text-white text-left flex items-center justify-between shadow-xl relative overflow-hidden group`}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
                      {React.cloneElement(scene.icon as React.ReactElement, { size: 28 })}
                    </div>
                    <div>
                      <h3 className="text-xl font-black font-cute">{scene.label}</h3>
                      <p className="text-xs text-white/70">{scene.desc}</p>
                    </div>
                  </div>
                  <Play className="text-white/30 group-hover:text-white transition-colors" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <SceneContainer 
            type={activeScene} 
            onBack={() => setActiveScene('menu')} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const SceneContainer: React.FC<{ type: SceneType; onBack: () => void }> = ({ type, onBack }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col"
    >
      <div className="absolute top-8 left-8 z-[110]">
        <button onClick={onBack} className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-colors">
          <X size={24} />
        </button>
      </div>

      {type === 'fireworks' && <FireworksScene />}
      {type === 'sunset' && <SunsetScene />}
      {type === 'stars' && <StarsScene />}
      {type === 'balloons' && <BalloonScene />}
      {type === 'garden' && <GardenScene />}
      {type === 'pets' && <PetScene />}
    </motion.div>
  );
};

// --- Individual Scenes ---

const FireworksScene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
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
  }, []);

  return (
    <div className="flex-1 bg-black relative">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="absolute bottom-12 w-full text-center pointer-events-none">
        <p className="text-white/60 font-cute text-xl tracking-widest">愿年年岁岁，都有你陪我看烟花 ✨</p>
      </div>
    </div>
  );
};

const SunsetScene: React.FC = () => {
  return (
    <div className="flex-1 bg-gradient-to-b from-sky-400 to-orange-500 relative overflow-hidden flex items-center justify-center">
      <motion.div 
        animate={{ y: [0, 400], opacity: [1, 0.8] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="w-64 h-64 bg-gradient-to-b from-yellow-200 to-orange-400 rounded-full shadow-[0_0_100px_rgba(255,165,0,0.5)]"
      />
      <div className="absolute bottom-0 w-full h-1/3 bg-black/20 backdrop-blur-sm" />
      <div className="absolute bottom-12 w-full text-center">
        <p className="text-white font-cute text-2xl">夕阳无限好，只是因为有你 🌅</p>
      </div>
    </div>
  );
};

const StarsScene: React.FC = () => {
  const [stars, setStars] = useState<{id: number, x: number, y: number, size: number}[]>([]);
  
  useEffect(() => {
    const newStars = Array.from({ length: 100 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1
    }));
    setStars(newStars);
  }, []);

  return (
    <div className="flex-1 bg-slate-950 relative overflow-hidden">
      {stars.map(star => (
        <motion.div
          key={star.id}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: Math.random() * 3 + 2, repeat: Infinity }}
          className="absolute bg-white rounded-full"
          style={{ 
            left: `${star.x}%`, 
            top: `${star.y}%`, 
            width: star.size, 
            height: star.size,
            boxShadow: '0 0 10px white'
          }}
        />
      ))}
      <div className="absolute bottom-12 w-full text-center">
        <p className="text-white/80 font-cute text-2xl">满天星辰，不及你眼底温柔 ✨</p>
      </div>
    </div>
  );
};

const BalloonScene: React.FC = () => {
  const [balloons, setBalloons] = useState<{id: number, x: number}[]>([]);

  const addBalloon = () => {
    setBalloons(prev => [...prev, { id: Date.now(), x: Math.random() * 80 + 10 }]);
  };

  return (
    <div className="flex-1 bg-sky-300 relative overflow-hidden flex flex-col items-center justify-center">
      <AnimatePresence>
        {balloons.map(b => (
          <motion.div
            key={b.id}
            initial={{ y: '110vh', x: `${b.x}vw` }}
            animate={{ y: '-20vh' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 10, ease: "linear" }}
            className="absolute text-6xl"
          >
            🎈
          </motion.div>
        ))}
      </AnimatePresence>
      
      <div className="z-10 text-center space-y-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={addBalloon}
          className="w-24 h-24 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-xl border-2 border-white/50"
        >
          <Wind size={40} />
        </motion.button>
        <p className="text-white font-cute text-2xl drop-shadow-md">点击放飞我们的爱 🎈</p>
      </div>
    </div>
  );
};

const GardenScene: React.FC = () => {
  const [flowers, setFlowers] = useState<{id: number, x: number, y: number, type: string}[]>([]);

  const plantFlower = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const types = ['🌸', '🌹', '🌻', '🌷', '🌼'];
    setFlowers(prev => [...prev, { id: Date.now(), x, y, type: types[Math.floor(Math.random() * types.length)] }]);
  };

  return (
    <div 
      className="flex-1 bg-emerald-100 relative overflow-hidden cursor-crosshair"
      onClick={plantFlower}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(16,185,129,0.12)_1px,transparent_0)] [background-size:22px_22px] opacity-60" />
      <AnimatePresence>
        {flowers.map(f => (
          <motion.div
            key={f.id}
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="absolute text-4xl"
            style={{ left: `${f.x}%`, top: `${f.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            {f.type}
          </motion.div>
        ))}
      </AnimatePresence>
      <div className="absolute top-24 w-full text-center pointer-events-none">
        <p className="text-emerald-800 font-cute text-2xl">点击地面，种下我们的思念 🌿</p>
      </div>
    </div>
  );
};

const PetScene: React.FC = () => {
  const [isFeeding, setIsFeeding] = useState(false);
  const [happiness, setHappiness] = useState(0);

  const feed = () => {
    setIsFeeding(true);
    setHappiness(prev => Math.min(prev + 10, 100));
    setTimeout(() => setIsFeeding(false), 1000);
  };

  return (
    <div className="flex-1 bg-amber-50 relative flex flex-col items-center justify-center">
      <motion.div 
        animate={isFeeding ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
        className="text-9xl mb-12 relative"
      >
        🐱
        {happiness > 50 && (
          <motion.div 
            animate={{ y: [-20, -40], opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute -top-8 -right-8 text-4xl"
          >
            ❤️
          </motion.div>
        )}
      </motion.div>

      <div className="w-64 bg-gray-200 h-4 rounded-full overflow-hidden mb-8">
        <motion.div 
          animate={{ width: `${happiness}%` }}
          className="bg-amber-400 h-full"
        />
      </div>

      <Button onClick={feed} className="rounded-full px-12 py-4 text-xl font-black">
        喂小鱼干 🐟
      </Button>
      
      <p className="mt-6 text-amber-800 font-cute text-xl">小猫咪最喜欢你了 🐾</p>
    </div>
  );
};
