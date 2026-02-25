import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Heart, CheckSquare, MessageCircle, Image as ImageIcon, LogOut, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dashboard } from './components/Dashboard';
import { LoveNotes } from './components/LoveNotes';
import { Quests } from './components/Quests';
import { CupidChat } from './components/CupidChat';
import { Moments } from './components/Moments';
import { Onboarding } from './components/Onboarding';
import { Profile } from './components/Profile';
import { FloatingHearts } from './components/ui/FloatingHearts';
import { Petals } from './components/ui/Petals';
import { RandomSurprise } from './components/ui/RandomSurprise';
import { RomanticSpace } from './components/RomanticSpace';
import { CoupleData, LoveNote, UserFrontend, Moment, Quest } from './types';
import { storageService } from './services/storage';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'notes' | 'quests' | 'chat' | 'moments' | 'romantic'>('dashboard');
  const [showProfile, setShowProfile] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<UserFrontend | null>(null);
  const [coupleData, setCoupleData] = useState<CoupleData | null>(null);
  const [hasAuth, setHasAuth] = useState(false);

  // Load initial state
  useEffect(() => {
    const init = async () => {
      // Check backend health first
      const isHealthy = await storageService.checkHealth();
      if (!isHealthy) {
        console.error("Backend is unreachable");
        // You might want to show a specific error state here
      }

      const tokenExists = storageService.hasToken();
      setHasAuth(tokenExists);

      if (tokenExists) {
        try {
          let userId = storageService.getSession();
          let me: UserFrontend | null = null;

          if (!userId) {
            me = await storageService.getCurrentUser();
            userId = me.id;
            storageService.saveSession(userId);
          }

          const data = await storageService.findCoupleByUserId(userId);
          if (data) {
            setCoupleData(data);
            const user = data.users.find(u => u.id === userId) || me;
            setCurrentUser(user || null);
            
            const [notes, quests, moments] = await Promise.all([
              storageService.getNotes(data.id),
              storageService.getQuests(data.id),
              storageService.getMoments(data.id)
            ]);
            
            setCoupleData(prev => prev ? ({ ...prev, notes, quests, moments }) : null);
          } else if (me) {
            setCurrentUser(me);
          }
        } catch (e) {
          if ((e as { status?: number })?.status === 401) {
            storageService.clearSession();
            setHasAuth(false);
            setCurrentUser(null);
            setCoupleData(null);
          } else {
            console.error("Failed to initialize app", e);
          }
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const handleLogin = async (user: UserFrontend, data: CoupleData) => {
    setCurrentUser(user);
    setCoupleData(data);
    setHasAuth(true);
  };

  const handleLogout = () => {
    storageService.clearSession();
    setCurrentUser(null);
    setCoupleData(null);
    setShowProfile(false);
    setHasAuth(false);
  };

  const handleUpdateUser = async (updatedUser: UserFrontend) => {
    if (!coupleData || !currentUser) return;
    try {
      const savedUser = await storageService.updateUser(currentUser.id, updatedUser);
      const mergedUser = {
        ...savedUser,
        clientUserId: savedUser.clientUserId ?? currentUser.clientUserId,
      };
      setCurrentUser(mergedUser);
      setCoupleData(prev => prev ? ({
        ...prev,
        users: prev.users.map(u => u.id === savedUser.id ? mergedUser : u)
      }) : null);
    } catch (e) {
      console.error("Failed to update user", e);
    }
  };

  const handleAddNote = async (note: LoveNote) => {
    if (!coupleData) return;
    try {
      const newNote = await storageService.createNote(coupleData.id, {
        content: note.content,
        authorId: note.authorId,
        color: note.color,
        mediaUrl: note.mediaUrl,
        mediaType: note.mediaType
      });
      
      setCoupleData(prev => prev ? ({
        ...prev,
        notes: [newNote, ...prev.notes],
        intimacyScore: prev.intimacyScore + 5
      }) : null);
      
      await storageService.updateCouple(coupleData.id, { intimacyScore: coupleData.intimacyScore + 5 });
    } catch (e) {
      console.error("Failed to add note", e);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!coupleData) return;
    try {
      await storageService.deleteNote(id);
      setCoupleData(prev => prev ? ({
        ...prev,
        notes: prev.notes.filter(n => n.id !== id)
      }) : null);
    } catch (e) {
      console.error("Failed to delete note", e);
    }
  };

  const handleAddMoment = async (moment: Moment) => {
    if (!coupleData) return;
    try {
      const newMoment = await storageService.createMoment(coupleData.id, {
        title: moment.title,
        description: moment.description,
        date: moment.date,
        imageUrl: moment.imageUrl,
        tags: moment.tags
      });

      setCoupleData(prev => prev ? ({
        ...prev,
        moments: [newMoment, ...prev.moments],
        intimacyScore: prev.intimacyScore + 10
      }) : null);

      await storageService.updateCouple(coupleData.id, { intimacyScore: coupleData.intimacyScore + 10 });
    } catch (e) {
      console.error("Failed to add moment", e);
    }
  };

  const handleDeleteMoment = async (id: string) => {
    if (!coupleData) return;
    try {
      await storageService.deleteMoment(id);
      setCoupleData(prev => prev ? ({
        ...prev,
        moments: prev.moments.filter(m => m.id !== id)
      }) : null);
    } catch (e) {
      console.error("Failed to delete moment", e);
    }
  };

  const handleAddQuest = async (quest: Quest) => {
    if (!coupleData) return;
    try {
      const newQuest = await storageService.createQuest(coupleData.id, {
        title: quest.title,
        description: quest.description,
        points: quest.points,
        type: quest.type,
      });

      setCoupleData(prev => prev ? ({
        ...prev,
        quests: [newQuest, ...prev.quests]
      }) : null);
    } catch (e) {
      console.error("Failed to add quest", e);
    }
  };

  const handleUpdateQuest = async (updatedQuest: Quest) => {
    if (!coupleData) return;
    try {
      const savedQuest = await storageService.updateQuest(updatedQuest.id, {
        title: updatedQuest.title,
        description: updatedQuest.description,
        points: updatedQuest.points,
        type: updatedQuest.type,
        status: updatedQuest.status,
      });

      setCoupleData(prev => prev ? ({
        ...prev,
        quests: prev.quests.map(q => q.id === savedQuest.id ? savedQuest : q)
      }) : null);
    } catch (e) {
      console.error("Failed to update quest", e);
    }
  };

  const handleDeleteQuest = async (id: string) => {
    if (!coupleData) return;
    try {
      await storageService.deleteQuest(id);
      setCoupleData(prev => prev ? ({
        ...prev,
        quests: prev.quests.filter(q => q.id !== id)
      }) : null);
    } catch (e) {
      console.error("Failed to delete quest", e);
    }
  };

  const handleCompleteQuest = async (id: string) => {
    if (!coupleData || !currentUser) return;
    try {
      const completedQuest = await storageService.completeQuest(id);
      
      setCoupleData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          intimacyScore: prev.intimacyScore + completedQuest.points,
          quests: prev.quests.map(q => q.id === id ? completedQuest : q)
        };
      });

      const quest = coupleData.quests.find(q => q.id === id);
      if (quest) {
         await storageService.updateCouple(coupleData.id, { intimacyScore: coupleData.intimacyScore + quest.points });
      }
    } catch (e) {
      console.error("Failed to complete quest", e);
    }
  };

  const handleUpdateAnniversary = async (date: number) => {
    if (!coupleData) return;
    try {
      const dateStr = new Date(date).toISOString();
      await storageService.updateCouple(coupleData.id, { anniversaryDate: dateStr });
      setCoupleData(prev => prev ? ({ ...prev, anniversaryDate: dateStr }) : null);
    } catch (e) {
      console.error("Failed to update anniversary", e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="flex flex-col items-center">
          <Heart className="w-16 h-16 text-rose-400 mb-4" fill="currentColor" />
          <p className="text-rose-400 font-black font-cute">正在加载甜蜜...</p>
        </motion.div>
      </div>
    );
  }

  if (!hasAuth) {
    return <Onboarding onComplete={handleLogin} />;
  }
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center text-rose-500 font-black font-cute">
        正在加载你们的空间...
      </div>
    );
  }
  if (!coupleData) {
    return <Onboarding onComplete={handleLogin} mode="pairingOnly" initialUser={currentUser} />;
  }

  const partnerUser = coupleData.users.find(u => u.id !== currentUser.id) || {
    id: 'pending',
    name: '伴侣',
    avatar: 'https://ui-avatars.com/api/?name=P&background=random'
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': 
        return <Dashboard data={coupleData} currentUser={currentUser} onUpdateAnniversary={handleUpdateAnniversary} onNavigate={setActiveTab} />;
      case 'notes': 
        return <LoveNotes notes={coupleData.notes} currentUser={currentUser} partnerUser={partnerUser} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} />;
      case 'quests': 
        return <Quests 
          quests={coupleData.quests} 
          currentUser={currentUser}
          onCompleteQuest={handleCompleteQuest} 
          onAddQuest={handleAddQuest}
          onDeleteQuest={handleDeleteQuest}
          onUpdateQuest={handleUpdateQuest}
        />;
      case 'chat': 
        return <CupidChat />;
      case 'moments': 
        return <Moments moments={coupleData.moments} onAddMoment={handleAddMoment} onDeleteMoment={handleDeleteMoment} />;
      default: 
        return <Dashboard data={coupleData} currentUser={currentUser} onUpdateAnniversary={handleUpdateAnniversary} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 font-sans text-gray-900 max-w-md mx-auto shadow-2xl overflow-hidden relative flex flex-col border-x-8 border-white">
      <FloatingHearts />
      <Petals />
      <RandomSurprise />
      
      <AnimatePresence>
        {activeTab === 'romantic' && (
          <RomanticSpace onClose={() => setActiveTab('dashboard')} />
        )}
        {showProfile && (
          <Profile 
            user={currentUser} 
            coupleData={coupleData} 
            onClose={() => setShowProfile(false)} 
            onUpdateUser={handleUpdateUser}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>

      <header className="bg-white/60 backdrop-blur-xl sticky top-0 z-30 px-6 py-5 border-b border-rose-100 flex justify-between items-center">
        <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-rose-400 to-rose-600 p-2 rounded-2xl shadow-lg shadow-rose-200"><Heart className="text-white w-5 h-5" fill="currentColor" /></div>
          <h1 className="text-2xl font-black text-rose-600 tracking-tighter font-cute">LoveSync</h1>
        </motion.div>
        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            onClick={() => setShowProfile(true)}
            className="w-10 h-10 rounded-2xl bg-white overflow-hidden border-2 border-rose-200 shadow-sm cursor-pointer"
          >
            <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
          </motion.div>
        </div>
      </header>

      <main className="p-6 flex-1 overflow-y-auto no-scrollbar relative z-10 custom-scroll">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="bg-white/80 backdrop-blur-xl border-t border-rose-100 px-6 py-4 flex justify-between items-center z-30 pb-safe shadow-[0_-10px_25px_rgba(244,63,94,0.05)]">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={24} />} label="首页" testId="nav-dashboard" />
        <NavButton active={activeTab === 'moments'} onClick={() => setActiveTab('moments')} icon={<ImageIcon size={24} />} label="瞬间" testId="nav-moments" />
        <div className="relative -top-10">
          <motion.button whileHover={{ scale: 1.1, y: -5 }} whileTap={{ scale: 0.9 }} onClick={() => setActiveTab('chat')} className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all border-4 border-white ${activeTab === 'chat' ? 'bg-rose-600 text-white shadow-rose-300' : 'bg-rose-500 text-white shadow-rose-200'}`}>
            <MessageCircle size={32} />
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-1 -right-1 bg-yellow-400 p-1 rounded-full border-2 border-white"><Sparkles size={10} className="text-yellow-900" /></motion.div>
          </motion.button>
        </div>
        <NavButton active={activeTab === 'quests'} onClick={() => setActiveTab('quests')} icon={<CheckSquare size={24} />} label="任务" testId="nav-quests" />
        <NavButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={<Heart size={24} />} label="日记" testId="nav-notes" />
      </nav>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label, testId }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, testId?: string }) => (
  <button onClick={onClick} data-testid={testId} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-rose-600 scale-110' : 'text-rose-300 hover:text-rose-400'}`}>
    <motion.div whileHover={{ y: -2 }}>{React.cloneElement(icon as React.ReactElement, { size: 24, fill: active ? "currentColor" : "none", strokeWidth: active ? 2.5 : 2 })}</motion.div>
    <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

export default App;
