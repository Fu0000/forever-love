import React, { useState } from 'react';
import { CheckCircle2, Circle, Gift, Coffee, MessageCircleHeart, HandHeart, Plus, Trash2, Edit2, X, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quest, UserFrontend } from '../types';
import { clsx } from 'clsx';
import { Button } from './ui/Button';
import { UserBadge } from './ui/UserBadge';

interface QuestsProps {
  quests: Quest[];
  currentUser: UserFrontend;
  partnerUser: UserFrontend;
  onCompleteQuest: (id: string) => void;
  onAddQuest: (quest: Quest) => void;
  onDeleteQuest: (id: string) => void;
  onUpdateQuest: (quest: Quest) => void;
}

const QuestIcon = ({ type }: { type: Quest['type'] }) => {
  switch (type) {
    case 'gift': return <Gift className="text-purple-500" size={20} />;
    case 'service': return <HandHeart className="text-blue-500" size={20} />;
    case 'quality_time': return <Coffee className="text-orange-500" size={20} />;
    case 'words': return <MessageCircleHeart className="text-rose-500" size={20} />;
    default: return <Gift size={20} />;
  }
};

export const Quests: React.FC<QuestsProps> = ({
  quests,
  currentUser,
  partnerUser,
  onCompleteQuest,
  onAddQuest,
  onDeleteQuest,
  onUpdateQuest,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [viewingQuest, setViewingQuest] = useState<Quest | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState(10);
  const [type, setType] = useState<Quest['type']>('quality_time');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPoints(10);
    setType('quality_time');
    setEditingQuest(null);
    setIsCreating(false);
  };

  const resolveUser = (userId?: string | null): UserFrontend | null => {
    if (!userId) return null;
    if (userId === currentUser.id) return currentUser;
    if (userId === partnerUser.id) return partnerUser;
    return null;
  };

  const handleEdit = (quest: Quest) => {
    setEditingQuest(quest);
    setTitle(quest.title);
    setDescription(quest.description || '');
    setPoints(quest.points);
    setType(quest.type);
    setIsCreating(true);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    if (editingQuest) {
      onUpdateQuest({
        ...editingQuest,
        title,
        description,
        points,
        type
      });
    } else {
      const newQuest: Quest = {
        id: Date.now().toString(), // Temp ID, backend will replace
        coupleId: '', // Backend handles
        title,
        description,
        points,
        status: 'ACTIVE',
        type,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString()
      };
      onAddQuest(newQuest);
    }
    resetForm();
  };

  // Sort: Incomplete first, then by date
  const sortedQuests = [...quests].sort((a, b) => {
    if (a.status === b.status) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return a.status === 'COMPLETED' ? 1 : -1;
  });

  return (
    <div className="pb-24 relative z-10" data-testid="quests-view">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800 font-cute">恋爱任务</h2>
          <p className="text-gray-500 text-xs mt-1">完成任务，提升亲密度</p>
        </div>
        <Button onClick={() => setIsCreating(true)} size="sm" className="rounded-full px-4" data-testid="quest-create-toggle">
          <Plus size={16} className="mr-1" /> 发布任务
        </Button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          >
            <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl" data-testid="quest-form">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black font-cute">{editingQuest ? '修改任务' : '发布新任务'}</h3>
                <button onClick={resetForm} data-testid="quest-form-close"><X size={24} className="text-gray-400" /></button>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <div className="text-xs font-black text-gray-500 uppercase tracking-widest">
                  将以你发布
                </div>
                <UserBadge name={currentUser.name} avatar={currentUser.avatar} label="我" />
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">任务标题</label>
                  <input 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-400 outline-none"
                    placeholder="例如：给对方一个拥抱"
                    data-testid="quest-title-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">描述</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-400 outline-none h-24 resize-none"
                    placeholder="详细说明..."
                    data-testid="quest-desc-input"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">奖励积分</label>
                    <input 
                      type="number"
                      value={points}
                      onChange={(e) => setPoints(Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-400 outline-none"
                      data-testid="quest-points-input"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">类型</label>
                    <select 
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-400 outline-none bg-white"
                      data-testid="quest-type-select"
                    >
                      <option value="quality_time">陪伴</option>
                      <option value="service">服务</option>
                      <option value="gift">礼物</option>
                      <option value="words">情话</option>
                    </select>
                  </div>
                </div>
                <Button className="w-full py-3 rounded-xl mt-2" onClick={handleSubmit} data-testid="quest-submit">
                  {editingQuest ? '保存修改' : '发布任务'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingQuest && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
            onClick={() => setViewingQuest(null)}
          >
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setViewingQuest(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-3 mb-4">
                <div className={clsx("p-3 rounded-2xl bg-opacity-10", 
                  viewingQuest.type === 'gift' && "bg-purple-500",
                  viewingQuest.type === 'service' && "bg-blue-500",
                  viewingQuest.type === 'quality_time' && "bg-orange-500",
                  viewingQuest.type === 'words' && "bg-rose-500",
                )}>
                  <QuestIcon type={viewingQuest.type} />
                </div>
                <div>
                  <h3 className="text-xl font-black font-cute">{viewingQuest.title}</h3>
                  <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">+{viewingQuest.points} 积分</span>
                </div>
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">{viewingQuest.description}</p>

              <div className="mb-6 space-y-3">
                {(() => {
                  const author = resolveUser(viewingQuest.createdBy);
                  return (
                    <div>
                      <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        发布者
                      </div>
                      {author ? (
                        <UserBadge
                          name={author.name}
                          avatar={author.avatar}
                          label={author.id === currentUser.id ? '我' : undefined}
                          size="md"
                        />
                      ) : (
                        <div className="text-sm font-black text-gray-500">未知</div>
                      )}
                    </div>
                  );
                })()}

                {viewingQuest.status === 'COMPLETED' && (
                  <div>
                    <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      完成者
                    </div>
                    {(() => {
                      const completer = resolveUser(viewingQuest.completedBy);
                      return completer ? (
                        <UserBadge
                          name={completer.name}
                          avatar={completer.avatar}
                          label={completer.id === currentUser.id ? '我' : undefined}
                          size="md"
                        />
                      ) : (
                        <div className="text-sm font-black text-gray-500">未知</div>
                      );
                    })()}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(viewingQuest.createdAt).toLocaleDateString()}
                </div>
                {viewingQuest.createdBy === currentUser.id && (
                  <div className="flex gap-3">
                    <button onClick={() => { setViewingQuest(null); handleEdit(viewingQuest); }} className="text-blue-400 hover:text-blue-600 flex items-center gap-1">
                      <Edit2 size={12} /> 编辑
                    </button>
                    <button onClick={() => { setViewingQuest(null); onDeleteQuest(viewingQuest.id); }} className="text-red-400 hover:text-red-600 flex items-center gap-1" data-testid="quest-delete">
                      <Trash2 size={12} /> 删除
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {sortedQuests.map((quest) => (
          <motion.div
            key={quest.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setViewingQuest(quest)}
            className={clsx(
              "p-4 rounded-2xl border flex items-center gap-4 transition-all cursor-pointer group relative overflow-hidden",
              quest.status === 'COMPLETED'
                ? "bg-gray-50 border-gray-100 opacity-60" 
                : "bg-white border-rose-100 shadow-sm hover:shadow-md hover:border-rose-200"
            )}
            data-testid="quest-item"
          >
            <div className={clsx("p-3 rounded-xl bg-opacity-10 shrink-0", 
              quest.type === 'gift' && "bg-purple-500",
              quest.type === 'service' && "bg-blue-500",
              quest.type === 'quality_time' && "bg-orange-500",
              quest.type === 'words' && "bg-rose-500",
            )}>
              <QuestIcon type={quest.type} />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className={clsx("font-bold text-sm truncate", quest.status === 'COMPLETED' && "line-through text-gray-500")}>
                {quest.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <UserBadge
                  name={quest.createdBy === currentUser.id ? currentUser.name : partnerUser.name}
                  avatar={quest.createdBy === currentUser.id ? currentUser.avatar : partnerUser.avatar}
                  label={quest.createdBy === currentUser.id ? '我' : undefined}
                />
                <span className="text-[10px] text-gray-400 flex items-center gap-0.5 shrink-0">
                  <Calendar size={10} /> {new Date(quest.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0" onClick={e => e.stopPropagation()}>
              <span className="text-xs font-bold text-rose-500">+{quest.points}</span>
              <button 
                onClick={() => quest.status !== 'COMPLETED' && onCompleteQuest(quest.id)}
                disabled={quest.status === 'COMPLETED'}
                className="text-gray-300 hover:text-rose-500 transition-colors disabled:cursor-not-allowed"
                data-testid="quest-complete"
              >
                {quest.status === 'COMPLETED' ? (
                  <CheckCircle2 className="text-green-500" size={24} />
                ) : (
                  <Circle size={24} />
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
