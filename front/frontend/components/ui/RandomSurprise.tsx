import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Heart, Sparkles, X } from 'lucide-react';
import { Button } from './Button';

type SurpriseType = 'gift' | 'cat' | 'dog' | 'balloon';

interface SurpriseInstance {
  id: string;
  type: SurpriseType;
  x: number;
  y: number;
}

export const RandomSurprise: React.FC = () => {
  const [surprises, setSurprises] = useState<SurpriseInstance[]>([]);
  const [openedGift, setOpenedGift] = useState<string | null>(null);

  const gifts = [
    "一张‘抱抱券’，随时兑换！🤗",
    "今天的你超级无敌可爱！✨",
    "丘比特说：你们是天生一对！💘",
    "奖励一个甜甜的吻！💋",
    "陪你去看一场电影吧！🍿",
    "你是我的全世界！🌍"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every 10 seconds
        const types: SurpriseType[] = ['gift', 'cat', 'dog', 'balloon'];
        const newSurprise: SurpriseInstance = {
          id: Date.now().toString(),
          type: types[Math.floor(Math.random() * types.length)],
          x: Math.random() * 80 + 10,
          y: Math.random() * 60 + 20,
        };
        setSurprises(prev => [...prev, newSurprise]);

        // Auto remove after some time if not clicked
        setTimeout(() => {
          setSurprises(prev => prev.filter(s => s.id !== newSurprise.id));
        }, 8000);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleSurpriseClick = (surprise: SurpriseInstance) => {
    if (surprise.type === 'gift') {
      setOpenedGift(gifts[Math.floor(Math.random() * gifts.length)]);
    }
    setSurprises(prev => prev.filter(s => s.id !== surprise.id));
  };

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-40">
        <AnimatePresence>
          {surprises.map((s) => (
            <motion.div
              key={s.id}
              initial={s.type === 'balloon' ? { y: '110vh', x: `${s.x}vw` } : { opacity: 0, scale: 0 }}
              animate={s.type === 'balloon' ? { y: '-20vh' } : { opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: s.type === 'balloon' ? 10 : 0.5 }}
              className="absolute pointer-events-auto cursor-pointer"
              style={{ left: s.type === 'balloon' ? undefined : `${s.x}%`, top: s.type === 'balloon' ? undefined : `${s.y}%` }}
              onClick={() => handleSurpriseClick(s)}
            >
              {s.type === 'gift' && (
                <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="bg-rose-400 p-3 rounded-2xl shadow-lg text-white">
                  <Gift size={32} />
                </motion.div>
              )}
              {s.type === 'cat' && <span className="text-4xl">🐱</span>}
              {s.type === 'dog' && <span className="text-4xl">🐶</span>}
              {s.type === 'balloon' && <span className="text-6xl">🎈</span>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {openedGift && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-xs w-full text-center shadow-2xl relative"
            >
              <button onClick={() => setOpenedGift(null)} className="absolute top-4 right-4 text-gray-400 hover:text-rose-500">
                <X size={20} />
              </button>
              <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                <Sparkles size={40} />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2 font-cute">惊喜礼物！</h3>
              <p className="text-gray-600 font-medium leading-relaxed">{openedGift}</p>
              <Button className="mt-6 w-full rounded-full" onClick={() => setOpenedGift(null)}>
                收下啦 ❤️
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};