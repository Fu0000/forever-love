import React, { useState } from 'react';
import { differenceInDays } from 'date-fns';
import {
  Heart,
  Calendar,
  Flame,
  Trophy,
  Copy,
  Sparkles,
  PenTool,
  Camera,
  MessageCircle,
  Star,
  Zap,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CoupleData, UserFrontend } from '../types';
import { Button } from './ui/Button';
import { PairRequestPanel } from './PairRequestPanel';
import { IntimacyEvent } from '../types';

const INTIMACY_LEVELS: Array<{ level: number; title: string; hint: string }> = [
  { level: 1, title: '初遇', hint: '认识彼此，一切刚刚开始' },
  { level: 2, title: '心动', hint: '开始在意对方的小情绪' },
  { level: 3, title: '热恋', hint: '甜度超标，想每天见面' },
  { level: 4, title: '默契', hint: '不说也懂，你的习惯我都记得' },
  { level: 5, title: '依恋', hint: '在一起时安心，不在也想念' },
  { level: 6, title: '同频', hint: '价值观更靠近，沟通更顺畅' },
  { level: 7, title: '坚定', hint: '遇到问题也愿意一起解决' },
  { level: 8, title: '相守', hint: '把对方当作长期的“我们”' },
  { level: 9, title: '灵魂伴侣', hint: '被理解、被接住，也更懂得爱' },
  { level: 10, title: '命中注定', hint: '坚定选择彼此，彼此成就' },
];

const getIntimacyTitle = (level: number): string => {
  const found = INTIMACY_LEVELS.find((item) => item.level === level);
  return found?.title ?? '永恒恋人';
};

interface DashboardProps {
  data: CoupleData;
  currentUser: UserFrontend;
  onUpdateAnniversary: (date: number) => void;
  onNavigate: (tab: 'notes' | 'moments' | 'chat' | 'quests' | 'romantic') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, currentUser, onUpdateAnniversary, onNavigate }) => {
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [levelOpen, setLevelOpen] = useState(false);
  
  const partner = data.users.find(u => u.id !== currentUser.id);
  const daysTogether = data.anniversaryDate 
    ? differenceInDays(new Date(), new Date(data.anniversaryDate)) 
    : 0;
  
  const summary = data.intimacy;
  const score = summary?.score ?? data.intimacyScore;
  const level = summary?.level ?? (Math.floor(score / 100) + 1);
  const levelTitle = summary?.title ?? getIntimacyTitle(level);
  const levelStart = summary?.levelStart ?? (Math.floor(score / 100) * 100);
  const nextTarget = summary?.nextThreshold ?? (level * 100);
  const progressPoints = Math.max(0, score - levelStart);
  const progressTotal = Math.max(1, nextTarget - levelStart);
  const progress = Math.min(100, Math.round((progressPoints / progressTotal) * 100));
  const remaining = Math.max(0, nextTarget - score);
  const todayEarned = summary?.todayEarned ?? 0;
  const todayCap = summary?.todayCap ?? 0;

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
              <p className="text-3xl font-black flex items-center gap-2 font-cute">
                Lv.{level} <span className="text-base text-rose-100 font-black">{levelTitle}</span>
              </p>
              {summary?.hint && (
                <p className="mt-1 text-[11px] text-white/80 font-bold">
                  {summary.hint}
                </p>
              )}
              <button
                type="button"
                className="mt-2 text-[11px] font-black text-white/80 hover:text-white underline underline-offset-4"
                onClick={() => setLevelOpen(true)}
              >
                查看等级体系
              </button>
            </div>
            <div className="text-right">
              <p className="text-rose-100 text-[10px] font-bold">{score} / {nextTarget} 积分</p>
              <p className="text-rose-100 text-[10px] font-bold mt-1">
                距离 Lv.{level + 1} 还差 {remaining} 分
              </p>
              {todayCap > 0 && (
                <p className="text-rose-100 text-[10px] font-bold mt-1">
                  今日已获得 {todayEarned} / {todayCap}
                </p>
              )}
              <Flame className="w-8 h-8 text-orange-300 inline-block animate-bounce" fill="currentColor" />
            </div>
          </div>
          <div className="w-full bg-black/10 rounded-full h-4 p-1">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.5 }} className="bg-gradient-to-r from-white to-rose-100 h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.6)]" />
          </div>
        </div>
      </motion.div>

      {data.intimacyEvents && data.intimacyEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] p-6 shadow-xl border-2 border-rose-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black font-cute text-gray-800">最近获得</h3>
            <div className="text-xs font-black text-gray-400">
              今日 {todayEarned}/{todayCap || '∞'}
            </div>
          </div>
          <div className="space-y-3">
            {data.intimacyEvents.slice(0, 8).map((evt) => (
              <IntimacyEventRow
                key={evt.id}
                evt={evt}
                currentUserId={currentUser.id}
                users={data.users}
              />
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {levelOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
            onClick={() => setLevelOpen(false)}
          >
            <div
              className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-black font-cute text-gray-800">亲密度等级体系</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    升级所需积分会逐级增加（不封顶）
                  </p>
                </div>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setLevelOpen(false)}
                >
                  <X size={22} />
                </button>
              </div>

              <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-100">
                <div className="text-xs font-black text-rose-600 tracking-widest uppercase">
                  当前
                </div>
                <div className="mt-1 text-lg font-black text-gray-800 font-cute">
                  Lv.{level} · {levelTitle}
                </div>
                <div className="mt-1 text-xs text-gray-600 font-bold">
                  距离 Lv.{level + 1} 还差 {remaining} 分
                </div>
              </div>

              <div className="max-h-[55vh] overflow-y-auto custom-scroll pr-1 space-y-2">
                {INTIMACY_LEVELS.map((row) => (
                  <div
                    key={row.level}
                    className="border border-gray-100 rounded-2xl p-4"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="font-black text-gray-800">
                        Lv.{row.level} · {row.title}
                      </div>
                      <div className="text-[11px] font-black text-gray-400">
                        {levelRangeText(row.level)}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-gray-600 font-bold">
                      {row.hint}
                    </div>
                  </div>
                ))}
                <div className="border border-gray-100 rounded-2xl p-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="font-black text-gray-800">Lv.11+ · 永恒恋人</div>
                    <div className="text-[11px] font-black text-gray-400">1000+</div>
                  </div>
                  <div className="mt-1 text-xs text-gray-600 font-bold">
                    更懂得经营与陪伴，让爱长久发光
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pairing Code Card (If partner missing) */}
      {!partner && (
        <div className="space-y-4">
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

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[2rem]"
            data-testid="dashboard-pair-request-card"
          >
            <PairRequestPanel
              myClientUserId={currentUser.clientUserId}
              mode="dashboard"
            />
          </motion.div>
        </div>
      )}

      {/* Romantic Space Entry */}
      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onNavigate('romantic')}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2rem] p-6 text-white shadow-xl flex items-center justify-between relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.22)_1px,transparent_0)] [background-size:22px_22px] opacity-60"></div>
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

const computeThresholds = (maxLevel: number): Array<{ level: number; start: number; end: number }> => {
  const out: Array<{ level: number; start: number; end: number }> = [];
  let start = 0;
  for (let level = 1; level <= maxLevel; level += 1) {
    const delta = 80 + 20 * (level - 1);
    const end = start + delta - 1;
    out.push({ level, start, end });
    start += delta;
  }
  return out;
};

const LEVEL_THRESHOLDS = computeThresholds(10);

const levelRangeText = (level: number): string => {
  const found = LEVEL_THRESHOLDS.find((row) => row.level === level);
  if (!found) return '-';
  return `${found.start}–${found.end}`;
};

const formatEventTitle = (evt: IntimacyEvent): string => {
  switch (evt.type) {
    case 'NOTE_CREATE':
      return '写日记';
    case 'NOTE_DELETE':
      return '删除日记';
    case 'MOMENT_CREATE':
      return '记录瞬间';
    case 'MOMENT_DELETE':
      return '删除瞬间';
    case 'QUEST_CREATE':
      return '发布任务';
    case 'QUEST_COMPLETE':
      return '完成任务';
    case 'QUEST_DELETE':
      return '删除任务';
    case 'PAIR_SUCCESS':
      return '配对成功';
    case 'ANNIVERSARY_SET':
      return '设置纪念日';
    case 'SURPRISE_CLICK':
      return '点击惊喜';
    case 'ROMANTIC_ACTION':
      return '浪漫空间';
    case 'LEGACY_IMPORT':
      return '历史积分';
    default:
      return evt.type;
  }
};

const resolveUserName = (
  evt: IntimacyEvent,
  users: Array<{ id: string; name: string }> | undefined,
  currentUserId: string,
): string => {
  if (!evt.userId) return '系统';
  const user = users?.find((u) => u.id === evt.userId);
  if (!user) return evt.userId === currentUserId ? '我' : '对方';
  return user.id === currentUserId ? '我' : user.name;
};

const IntimacyEventRow: React.FC<{
  evt: IntimacyEvent;
  currentUserId: string;
  users: Array<{ id: string; name: string }>;
}> = ({ evt, currentUserId, users }) => {
  const who = resolveUserName(evt, users, currentUserId);
  const pointsText = evt.points > 0 ? `+${evt.points}` : `${evt.points}`;
  const pointsColor = evt.points > 0 ? 'text-rose-600' : 'text-gray-400';
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-black text-gray-800 truncate">
          {formatEventTitle(evt)}
        </div>
        <div className="text-[11px] font-bold text-gray-400 truncate">
          {who} · {new Date(evt.createdAt).toLocaleString()}
        </div>
      </div>
      <div className={`text-sm font-black shrink-0 ${pointsColor}`}>
        {pointsText}
      </div>
    </div>
  );
};
