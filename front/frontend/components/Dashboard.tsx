import React, { useState } from 'react';
import { differenceInDays } from 'date-fns';
import { Heart, Calendar, Flame, Trophy, Copy, Sparkles, PenTool, Camera, MessageCircle, Star, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CoupleData, UserFrontend } from '../types';
import { Button } from './ui/Button';

interface DashboardProps {
  data: CoupleData;
  currentUser: UserFrontend;
  onUpdateAnniversary: (date: number) => void;
  onNavigate: (tab: 'notes' | 'moments' | 'chat' | 'quests' | 'romantic') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, currentUser, onUpdateAnniversary, onNavigate }) => {
  const [isEditingDate, setIsEditingDate] = useState(false);
  
  const partner = data.users.find(u => u.id !== currentUser.id);
  const daysTogether = data.anniversaryDate 
    ? differenceInDays(new Date(), new Date(data.anniversaryDate)) 
    : 0;
  
  const level = Math.floor(data.intimacyScore / 100) + 1;
  const progress = data.intimacyScore % 100;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value).getTime();
    onUpdateAnniversary(date);
    setIsEditingDate(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch((err) => {
      prompt("复制此代码:", text);
    });
  };

  return (
    <div className="space-y-8 pb-24 relative z-10" data-testid="dashboard">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-rose-400 via-rose-500 to-pink-500 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-rose-200 relative overflow-hidden"
      >
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        
        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="flex items-center justify-center space-x-6 mb-4">
            <motion.div whileHover={{ scale: 1.1 }} className="relative">
              <img src={currentUser.avatar} alt="You" className="w-16 h-16 rounded-full border-4 border-white shadow-lg bg-white" />
              <div className="absolute -bottom-2 -right-2 bg-white text-rose-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-100 shadow-sm">我</div>
            </motion.div>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-rose-100"><Heart size={32} fill="currentColor" /></motion.div>
            <motion.div whileHover={{ scale: 1.1 }} className="relative">
              {partner ? (
                <img src={partner.avatar} alt="Partner" className="w-16 h-16 rounded-full border-4 border-white shadow-lg bg-white" />
              ) : (
                <div className="w-16 h-16 rounded-full border-4 border-white/30 bg-white/10 flex items-center justify-center backdrop-blur-sm"><Sparkles className="text-white/50" /></div>
              )}
              {partner && <div className="absolute -bottom-2 -right-2 bg-white text-rose-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-100 shadow-sm">{partner.name}</div>}
            </motion.div>
          </div>
          
          <div className="text-center">
            <p className="text-rose-100 text-sm font-medium mb-1">我们相爱已</p>
            {data.anniversaryDate ? (
              <motion.p className="text-4xl font-black tracking-tight font-cute">{daysTogether} <span className="text-xl">天</span></motion.p>
            ) : (
              <Button onClick={() => setIsEditingDate(true)} variant="secondary" size="sm" className="mt-2 rounded-full px-6">设置纪念日</Button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isEditingDate && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-6 bg-white/20 p-4 rounded-2xl backdrop-blur-md border border-white/30">
              <label className="block text-xs text-rose-100 mb-2 font-bold uppercase tracking-wider">从哪天开始？</label>
              <input type="date" className="w-full rounded-xl px-4 py-2 text-gray-800 text-sm outline-none" onChange={handleDateChange} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white/20 rounded-3xl p-5 backdrop-blur-md border border-white/20 relative z-10">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-rose-100 text-[10px] uppercase tracking-widest font-black mb-1">亲密度等级</p>
              <p className="text-3xl font-black flex items-center gap-2 font-cute">Lv.{level}</p>
            </div>
            <div className="text-right">
              <p className="text-rose-100 text-[10px] font-bold">{data.intimacyScore} / {(level) * 100} 积分</p>
              <Flame className="w-8 h-8 text-orange-300 inline-block animate-bounce" fill="currentColor" />
            </div>
          </div>
          <div className="w-full bg-black/10 rounded-full h-4 p-1">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.5 }} className="bg-gradient-to-r from-white to-rose-100 h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.6)]" />
          </div>
        </div>
      </motion.div>

      {/* Pairing Code Card (If partner missing) */}
      {!partner && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-yellow-50 border-2 border-yellow-200 p-5 rounded-[2rem] flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="bg-yellow-200 p-3 rounded-2xl">
              <Star className="text-yellow-700" fill="currentColor" size={20} />
            </div>
            <div>
              <h3 className="font-black text-yellow-800 text-sm">等待另一半...</h3>
              <p className="text-xs text-yellow-600 font-medium">配对码: <span className="font-mono font-bold bg-white px-2 py-0.5 rounded-md">{data.pairCode}</span></p>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="secondary"
            className="rounded-full w-10 h-10 !p-0"
            onClick={() => copyToClipboard(data.pairCode)}
          >
            <Copy size={16} />
          </Button>
        </motion.div>
      )}

      {/* Romantic Space Entry */}
      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onNavigate('romantic')}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2rem] p-6 text-white shadow-xl flex items-center justify-between relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
            <Zap className="text-yellow-300 animate-pulse" fill="currentColor" />
          </div>
          <div className="text-left">
            <h3 className="font-black text-lg font-cute">浪漫空间</h3>
            <p className="text-xs text-indigo-100">一起看烟花、赏日落、数星星...</p>
          </div>
        </div>
        <Sparkles className="text-yellow-300 group-hover:rotate-12 transition-transform" />
      </motion.button>

      {/* Quick Actions */}
      <div className="px-2">
        <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2 text-lg"><Sparkles size={20} className="text-rose-500" /> 甜蜜快捷键</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { id: 'notes', icon: <PenTool />, label: '写日记', color: 'bg-rose-100 text-rose-500' },
            { id: 'moments', icon: <Camera />, label: '发动态', color: 'bg-blue-100 text-blue-500' },
            { id: 'quests', icon: <Trophy />, label: '做任务', color: 'bg-green-100 text-green-500' },
            { id: 'chat', icon: <MessageCircle />, label: '问丘比特', color: 'bg-purple-100 text-purple-500' },
          ].map((action) => (
            <motion.button key={action.id} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onNavigate(action.id as any)} className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 ${action.color} rounded-[1.5rem] flex items-center justify-center shadow-sm border-2 border-white`}>{React.cloneElement(action.icon as React.ReactElement, { size: 24 })}</div>
              <span className="text-[11px] font-black text-gray-600">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 px-2">
        <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-[2rem] shadow-sm border border-rose-50 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-3 text-rose-600 relative z-10"><Calendar size={24} /></div>
          <h3 className="font-black text-2xl text-gray-800 font-cute">{data.moments.length}</h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">美好瞬间</p>
        </motion.div>
        <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-[2rem] shadow-sm border border-rose-50 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center mb-3 text-yellow-600 relative z-10"><Trophy size={24} /></div>
          <h3 className="font-black text-2xl text-gray-800 font-cute">{data.quests.filter(q => q.status === 'COMPLETED').length}</h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">完成任务</p>
        </motion.div>
      </div>
    </div>
  );
};
