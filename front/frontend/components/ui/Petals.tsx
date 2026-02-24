import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Petal {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  rotation: number;
}

export const Petals: React.FC = () => {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    const newPetals = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 15 + 10,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 10,
      rotation: Math.random() * 360,
    }));
    setPetals(newPetals);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          initial={{ y: '-10vh', opacity: 0, rotate: petal.rotation }}
          animate={{ 
            y: '110vh', 
            opacity: [0, 0.6, 0.6, 0],
            x: [`${petal.x}vw`, `${petal.x + 10}vw`, `${petal.x - 5}vw`, `${petal.x + 5}vw`],
            rotate: petal.rotation + 720
          }}
          transition={{
            duration: petal.duration,
            repeat: Infinity,
            delay: petal.delay,
            ease: "linear"
          }}
          className="absolute text-rose-200/40"
          style={{ fontSize: petal.size }}
        >
          🌸
        </motion.div>
      ))}
    </div>
  );
};