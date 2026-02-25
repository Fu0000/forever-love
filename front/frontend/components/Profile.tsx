import React, { useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UserFrontend, CoupleData } from '../types';
import { X, Camera, Sparkles, LogOut, Edit2, Check, Copy } from 'lucide-react';
import { Button } from './ui/Button';
import { storageService } from '../services/storage';

interface ProfileProps {
  user: UserFrontend;
  coupleData: CoupleData;
  onClose: () => void;
  onUpdateUser: (user: UserFrontend) => void;
  onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, coupleData, onClose, onUpdateUser, onLogout }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(user.name);
  const [avatarUpdating, setAvatarUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const gender = useMemo(() => {
    const stored = localStorage.getItem('lovesync_gender');
    return stored === 'male' || stored === 'female' ? stored : 'female';
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarUpdating(true);
      try {
        const url = await storageService.uploadFile(file);
        onUpdateUser({ ...user, avatar: url });
      } catch (err) {
        console.error('Failed to upload avatar', err);
        alert('头像上传失败，请稍后重试');
      } finally {
        setAvatarUpdating(false);
      }
    }
  };

  const generateAvatar = async () => {
    const seed = Math.random().toString(36).slice(2, 12);
    const sprite =
      gender === 'male'
        ? 'https://api.dicebear.com/9.x/micah/svg'
        : 'https://api.dicebear.com/9.x/lorelei/svg';
    const sourceUrl = `${sprite}?seed=${encodeURIComponent(seed)}`;

    setAvatarUpdating(true);
    try {
      const res = await fetch(sourceUrl);
      const blob = await res.blob();
      const file = new File([blob], `avatar-${seed}.svg`, {
        type: blob.type || 'image/svg+xml',
      });
      const url = await storageService.uploadFile(file);
      onUpdateUser({ ...user, avatar: url });
    } catch (err) {
      console.error('Failed to generate avatar', err);
      alert('生成头像失败，请稍后重试');
    } finally {
      setAvatarUpdating(false);
    }
  };

  const saveName = () => {
    if (name.trim()) {
      onUpdateUser({ ...user, name });
      setIsEditingName(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {
      prompt("复制:", text);
    });
  };

  const switchAccount = () => {
    const ok = window.confirm('将清除本地登录信息与配对ID，用于创建新用户。确定继续吗？');
    if (!ok) return;
    storageService.clearLocalIdentity();
    onLogout();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-white flex flex-col"
    >
      <div className="p-6 flex justify-between items-center border-b border-gray-100">
        <h2 className="text-2xl font-black font-cute text-gray-800">我的主页</h2>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-4 group">
            <div className="w-32 h-32 rounded-full border-4 border-rose-100 overflow-hidden shadow-xl">
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-rose-500 text-white p-2.5 rounded-full shadow-lg hover:bg-rose-600 transition-colors"
            >
              <Camera size={18} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={generateAvatar}
            className="mb-6 rounded-full px-4 text-xs"
            disabled={avatarUpdating}
          >
            <Sparkles size={14} className="mr-1" /> {avatarUpdating ? '生成中...' : 'AI 生成头像'}
          </Button>

          <div className="flex items-center gap-2 mb-1">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-b-2 border-rose-300 focus:outline-none text-2xl font-black text-center w-40 font-cute"
                  autoFocus
                />
                <button onClick={saveName} className="text-green-500"><Check size={24} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-gray-800 font-cute">{user.name}</h3>
                <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-rose-500">
                  <Edit2 size={16} />
                </button>
              </div>
            )}
          </div>
          <p className="text-gray-400 text-sm">用户ID: {user.id.slice(0, 8)}...</p>
          <div className="mt-3 w-full max-w-sm bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-gray-500 font-bold mb-1">配对ID（给对方用来发起配对申请）</p>
              <p className="font-mono text-xs font-black text-gray-700 truncate">{user.clientUserId ?? '—'}</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="rounded-xl !px-3"
              onClick={() => copyToClipboard(user.clientUserId ?? '')}
              disabled={!user.clientUserId}
            >
              <Copy size={14} />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100">
            <h4 className="font-bold text-rose-800 mb-4">关于我们</h4>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">配对码</span>
              <span className="font-mono font-bold text-gray-800 bg-white px-2 py-1 rounded">{coupleData.pairCode}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">纪念日</span>
              <span className="font-bold text-gray-800">
                {coupleData.anniversaryDate ? new Date(coupleData.anniversaryDate).toLocaleDateString() : '未设置'}
              </span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full py-4 rounded-2xl text-red-500 border-red-200 hover:bg-red-50"
            onClick={onLogout}
          >
            <LogOut size={18} className="mr-2" /> 退出登录
          </Button>

          <Button
            variant="outline"
            className="w-full py-4 rounded-2xl text-gray-700 border-gray-200 hover:bg-gray-50"
            onClick={switchAccount}
          >
            清除本地信息并切换账号
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
