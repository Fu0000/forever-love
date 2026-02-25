import React, { useEffect, useState } from 'react';
import { Heart, ArrowRight, Copy, Check, Sparkles, UserPlus, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { CoupleData, IncomingPairRequest, OutgoingPairRequest, UserFrontend } from '../types';
import { storageService } from '../services/storage';

interface OnboardingProps {
  onComplete: (user: UserFrontend, data: CoupleData) => void;
  mode?: 'full' | 'pairingOnly';
  initialStep?: 'welcome' | 'profile' | 'pairing';
  initialUser?: UserFrontend | null;
}

export const Onboarding: React.FC<OnboardingProps> = ({
  onComplete,
  mode = 'full',
  initialStep,
  initialUser = null,
}) => {
  const resolvedInitialStep: 'welcome' | 'profile' | 'pairing' =
    mode === 'pairingOnly' ? 'pairing' : (initialStep ?? 'welcome');

  const [step, setStep] = useState<'welcome' | 'profile' | 'pairing'>(() => resolvedInitialStep);
  const [name, setName] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [createdCouple, setCreatedCouple] = useState<CoupleData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempUser, setTempUser] = useState<UserFrontend | null>(() => initialUser);
  const [pairTargetId, setPairTargetId] = useState('');
  const [incomingRequests, setIncomingRequests] = useState<IncomingPairRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<OutgoingPairRequest[]>([]);
  const [pairRequestsLoading, setPairRequestsLoading] = useState(false);
  const [pairRequestsError, setPairRequestsError] = useState('');

  const handleStart = () => {
    setStep('profile');
  };

  const refreshPairRequests = async () => {
    if (!storageService.hasToken()) return;
    setPairRequestsLoading(true);
    setPairRequestsError('');
    try {
      const [incoming, outgoing] = await Promise.all([
        storageService.listIncomingPairRequests(),
        storageService.listOutgoingPairRequests(),
      ]);
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
    } catch (e) {
      console.error('Failed to refresh pair requests', e);
      setPairRequestsError('加载配对申请失败');
    } finally {
      setPairRequestsLoading(false);
    }
  };

  useEffect(() => {
    if (step !== 'pairing') return;
    void refreshPairRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleProfileSubmit = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    
    const user: Partial<UserFrontend> = {
      name: name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    };

    try {
      const { user: loggedInUser, token } = await storageService.login(user);
      storageService.saveSession(loggedInUser.id, token);
      setTempUser(loggedInUser);
      
      // Check if user is already in a couple
      const existingCouple = await storageService.findCoupleByUserId(loggedInUser.id);
      if (existingCouple) {
        onComplete(loggedInUser, existingCouple);
      } else {
        setStep('pairing');
        void refreshPairRequests();
      }
    } catch (e) {
      console.error("Login failed", e);
      setError("登录失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const createNewSpace = async () => {
    if (!tempUser) return;
    setIsLoading(true);
    
    try {
      const newCoupleData = await storageService.createCouple();
      setGeneratedCode(newCoupleData.pairCode);
      setCreatedCouple(newCoupleData);
    } catch (e) {
      console.error("Failed to create couple", e);
      setError("创建空间失败");
    } finally {
      setIsLoading(false);
    }
  };

  const joinSpace = async () => {
    if (!tempUser || !pairingCode.trim()) return;
    setIsLoading(true);
    setError('');

    try {
      const data = await storageService.joinCouple(pairingCode.toUpperCase());
      onComplete(tempUser, data);
    } catch (e) {
      console.error("Failed to join couple", e);
      setError('加入失败，请检查代码或网络。');
    } finally {
      setIsLoading(false);
    }
  };

  const sendPairRequest = async () => {
    if (!tempUser || !pairTargetId.trim()) return;
    setPairRequestsLoading(true);
    setPairRequestsError('');
    try {
      const normalized = pairTargetId.trim();
      if (!/^(user_[A-Za-z0-9_-]{6,64}|usr_[a-f0-9]{20})$/.test(normalized)) {
        setPairRequestsError('请输入对方配对ID（user_...）或用户ID（usr_...）');
        return;
      }
      const result = await storageService.createPairRequest(normalized);
      onComplete(tempUser, result.couple);
    } catch (e) {
      console.error('Failed to send pair request', e);
      setPairRequestsError('发送失败，请检查配对ID或网络');
    } finally {
      setPairRequestsLoading(false);
    }
  };

  const acceptPairRequest = async (requestId: string) => {
    if (!tempUser) return;
    setPairRequestsLoading(true);
    setPairRequestsError('');
    try {
      const result = await storageService.acceptPairRequest(requestId);
      onComplete(tempUser, result.couple);
    } catch (e) {
      console.error('Failed to accept pair request', e);
      setPairRequestsError('同意失败，请稍后重试');
    } finally {
      setPairRequestsLoading(false);
    }
  };

  const rejectPairRequest = async (requestId: string) => {
    setPairRequestsLoading(true);
    setPairRequestsError('');
    try {
      await storageService.rejectPairRequest(requestId);
      await refreshPairRequests();
    } catch (e) {
      console.error('Failed to reject pair request', e);
      setPairRequestsError('拒绝失败，请稍后重试');
    } finally {
      setPairRequestsLoading(false);
    }
  };

  const cancelPairRequest = async (requestId: string) => {
    setPairRequestsLoading(true);
    setPairRequestsError('');
    try {
      await storageService.cancelPairRequest(requestId);
      await refreshPairRequests();
    } catch (e) {
      console.error('Failed to cancel pair request', e);
      setPairRequestsError('取消失败，请稍后重试');
    } finally {
      setPairRequestsLoading(false);
    }
  };

  const enterAppAfterCreate = async () => {
    if (!tempUser || !generatedCode) return;
    if (createdCouple) {
      onComplete(tempUser, createdCouple);
      return;
    }
    try {
      const data = await storageService.findCoupleByUserId(tempUser.id);
      if (data) {
        onComplete(tempUser, data);
      }
    } catch (e) {
      console.error("Failed to load created couple", e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch((err) => {
      console.error("Clipboard write failed:", err);
      prompt("复制此代码:", text);
    });
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
    exit: { opacity: 0, scale: 1.05, transition: { duration: 0.3, ease: "easeIn" } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-100 flex items-center justify-center p-6 overflow-hidden relative" data-testid="onboarding">
      {/* Background Decorations */}
      <motion.div 
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-10 text-rose-200 opacity-50"
      >
        <Heart size={64} fill="currentColor" />
      </motion.div>
      <motion.div 
        animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 right-10 text-rose-200 opacity-50"
      >
        <Star size={48} fill="currentColor" />
      </motion.div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 pointer-events-none"></div>

      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div 
            key="welcome"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white/80 backdrop-blur-xl w-full max-w-md rounded-[2.5rem] shadow-2xl shadow-rose-200/50 p-10 border border-white/50 text-center relative z-10"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
              className="w-24 h-24 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-rose-300"
            >
              <Heart className="w-12 h-12 text-white" fill="currentColor" />
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl font-black text-gray-800 mb-4 font-cute tracking-wide"
            >
              LoveSync
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-gray-500 mb-10 text-lg font-medium leading-relaxed"
            >
              记录每一个心动瞬间，<br/>打造属于你们的甜蜜空间。
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button 
                className="w-full py-4 text-lg rounded-full shadow-xl shadow-rose-200 hover:shadow-rose-300 transition-all transform hover:-translate-y-1" 
                onClick={handleStart}
                data-testid="onboarding-start"
              >
                开启浪漫之旅 <ArrowRight size={20} className="ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {step === 'profile' && (
          <motion.div 
            key="profile"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white/80 backdrop-blur-xl w-full max-w-md rounded-[2.5rem] shadow-2xl shadow-rose-200/50 p-10 border border-white/50 relative z-10"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-gray-800 mb-2 font-cute">初次见面</h2>
              <p className="text-gray-500">告诉我们该如何称呼你？</p>
            </div>

            <div className="space-y-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-300 to-pink-300 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-200"></div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="输入你的昵称"
                  className="relative w-full px-6 py-4 rounded-2xl border-2 border-rose-100 focus:border-rose-400 focus:ring-0 outline-none transition-all text-lg bg-white/90 placeholder-gray-400 text-center font-bold text-gray-700"
                  autoFocus
                  data-testid="login-name-input"
                />
              </div>
              
              <Button 
                className="w-full py-4 text-lg rounded-full shadow-lg shadow-rose-200" 
                onClick={handleProfileSubmit}
                disabled={!name.trim() || isLoading}
                data-testid="login-submit"
              >
                {isLoading ? '登录中...' : '下一步'}
              </Button>
              {error && <p className="text-red-500 text-center text-sm">{error}</p>}
            </div>
          </motion.div>
        )}

        {step === 'pairing' && !generatedCode && (
          <motion.div 
            key="pairing"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white/80 backdrop-blur-xl w-full max-w-md rounded-[2.5rem] shadow-2xl shadow-rose-200/50 p-8 border border-white/50 relative z-10"
          >
            <div className="text-center mb-8">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative inline-block"
              >
                <img src={tempUser?.avatar} alt="Avatar" className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-md bg-white" />
                <div className="absolute bottom-2 right-0 bg-green-400 w-6 h-6 rounded-full border-4 border-white"></div>
              </motion.div>
              <h2 className="text-2xl font-black text-gray-800 font-cute">你好, {tempUser?.name}!</h2>
              <p className="text-gray-500 text-sm mt-1">准备好连接你的另一半了吗？</p>
            </div>

            <div className="space-y-4">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={createNewSpace}
                disabled={isLoading}
                className="w-full flex items-center p-5 border-2 border-rose-100 rounded-[1.5rem] hover:border-rose-400 hover:bg-rose-50/50 transition-all text-left group bg-white shadow-sm"
                data-testid="create-space"
              >
                <div className="bg-rose-100 p-3 rounded-2xl mr-4 group-hover:bg-rose-200 transition-colors">
                  <Sparkles className="text-rose-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">创建新空间</h3>
                  <p className="text-xs text-gray-500">生成代码邀请伴侣</p>
                </div>
                <ArrowRight className="ml-auto text-rose-300 group-hover:text-rose-500 transition-colors" size={20} />
              </motion.button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest text-gray-400 font-bold">
                  <span className="px-2 bg-white/80 backdrop-blur-sm">或者</span>
                </div>
              </div>

              <div className="bg-gray-50 p-5 rounded-[1.5rem] border border-gray-100">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">加入现有空间</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pairingCode}
                    onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                    placeholder="输入代码"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-400 outline-none text-center tracking-widest font-mono uppercase font-bold text-lg bg-white"
                    data-testid="join-code-input"
                  />
                  <Button 
                    className="px-6 rounded-xl" 
                    onClick={joinSpace}
                    disabled={!pairingCode.trim() || isLoading}
                    data-testid="join-space"
                  >
                    {isLoading ? '...' : '加入'}
                  </Button>
                </div>
                {error && <p className="text-red-500 text-xs mt-2 ml-1 font-medium flex items-center"><span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>{error}</p>}
              </div>

              <div className="bg-white p-5 rounded-[1.5rem] border border-rose-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">配对申请</label>
                  <button
                    type="button"
                    className="text-xs font-bold text-rose-500 hover:text-rose-600"
                    onClick={refreshPairRequests}
                    disabled={pairRequestsLoading}
                    data-testid="pair-requests-refresh"
                  >
                    {pairRequestsLoading ? '刷新中...' : '刷新'}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <p className="text-[11px] text-gray-500 font-bold mb-1">我的配对ID（给对方输入）</p>
                    <div className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                      <span
                        className="font-mono text-[12px] font-black text-gray-700 truncate"
                        data-testid="my-client-user-id"
                      >
                        {tempUser?.clientUserId ?? '—'}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-lg !px-3"
                        onClick={() => copyToClipboard(tempUser?.clientUserId ?? '')}
                        disabled={!tempUser?.clientUserId}
                        data-testid="copy-my-client-user-id"
                      >
                        <Copy size={14} />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pairTargetId}
                    onChange={(e) => setPairTargetId(e.target.value)}
                    placeholder="输入对方配对ID（user_xxx）"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-400 outline-none text-center font-mono text-sm bg-white"
                    data-testid="pair-request-target-input"
                  />
                  <Button
                    className="px-6 rounded-xl"
                    onClick={sendPairRequest}
                    disabled={!pairTargetId.trim() || pairRequestsLoading}
                    data-testid="pair-request-send"
                  >
                    <UserPlus size={16} className="mr-1" />
                    发送
                  </Button>
                </div>

                {pairRequestsError && (
                  <p className="text-red-500 text-xs mt-2 ml-1 font-medium flex items-center">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                    {pairRequestsError}
                  </p>
                )}

                {incomingRequests.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[11px] text-gray-500 font-bold mb-2 ml-1">收到的申请</p>
                    <div className="space-y-2">
                      {incomingRequests.map((req) => (
                        <div
                          key={req.id}
                          className="flex items-center justify-between gap-3 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2"
                          data-testid="incoming-request-item"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-black text-gray-800 truncate">{req.fromUser.name}</p>
                            <p className="text-[11px] text-gray-500 font-mono truncate">{req.fromUser.clientUserId ?? ''}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="rounded-lg !px-3"
                              onClick={() => acceptPairRequest(req.id)}
                              disabled={pairRequestsLoading}
                              data-testid="incoming-request-accept"
                            >
                              同意
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="rounded-lg !px-3"
                              onClick={() => rejectPairRequest(req.id)}
                              disabled={pairRequestsLoading}
                              data-testid="incoming-request-reject"
                            >
                              拒绝
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {outgoingRequests.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[11px] text-gray-500 font-bold mb-2 ml-1">我发出的申请</p>
                    <div className="space-y-2">
                      {outgoingRequests.map((req) => (
                        <div
                          key={req.id}
                          className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2"
                          data-testid="outgoing-request-item"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-black text-gray-800 truncate">{req.toUser.name}</p>
                            <p className="text-[11px] text-gray-500 font-mono truncate">{req.toUser.clientUserId ?? ''}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="rounded-lg !px-3"
                            onClick={() => cancelPairRequest(req.id)}
                            disabled={pairRequestsLoading}
                            data-testid="outgoing-request-cancel"
                          >
                            取消
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {generatedCode && (
          <motion.div 
            key="success"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white/80 backdrop-blur-xl w-full max-w-md rounded-[2.5rem] shadow-2xl shadow-rose-200/50 p-10 border border-white/50 text-center relative z-10"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Check className="text-green-500 w-10 h-10" strokeWidth={3} />
            </motion.div>
            
            <h3 className="text-2xl font-black text-gray-800 mb-2 font-cute">空间创建成功！</h3>
            <p className="text-gray-500 mb-8">快把这个神奇的代码发给你的另一半吧。</p>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-300 mb-8 cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-all group"
              onClick={() => copyToClipboard(generatedCode)}
            >
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2">配对代码</p>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-4xl font-black text-gray-800 tracking-widest group-hover:text-rose-600 transition-colors">{generatedCode}</span>
                <Copy size={20} className="text-gray-400 group-hover:text-rose-500" />
              </div>
            </motion.div>

            <Button className="w-full py-4 text-lg rounded-full shadow-lg shadow-rose-200" onClick={enterAppAfterCreate} data-testid="enter-app">
              进入 LoveSync
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
