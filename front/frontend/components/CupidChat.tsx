import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Send, Sparkles, History, Save, Plus, Trash2, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import { ChatMessage, CupidConversationSummary } from '../types';
import { getRelationshipAdvice } from '../services/geminiService';
import { Button } from './ui/Button';
import { storageService } from '../services/storage';

export const CupidChat: React.FC = () => {
  const initialMessages = useMemo<ChatMessage[]>(
    () => [
      {
        id: 'welcome',
        role: 'model',
        text: "你好，恋人们！💘 我是爱神丘比特，你们的专属恋爱顾问。无论是约会灵感、化解小矛盾，还是写一首情诗，我都在这里。今天你们的心情如何？",
        timestamp: Date.now(),
      },
    ],
    [],
  );

  const [messages, setMessages] = useState<ChatMessage[]>(() => initialMessages);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveHint, setSaveHint] = useState<string | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<CupidConversationSummary[]>([]);
  const [historyCursor, setHistoryCursor] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startNewConversation = () => {
    setMessages([
      {
        ...initialMessages[0],
        timestamp: Date.now(),
      },
    ]);
    setConversationId(null);
    setIsDirty(false);
    setSaveHint(null);
    setInput('');
  };

  const loadHistory = async (opts?: { reset?: boolean }) => {
    if (historyLoading) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const cursor = opts?.reset ? undefined : historyCursor ?? undefined;
      const result = await storageService.listCupidConversations(20, cursor);
      setHistoryItems((prev) => (opts?.reset ? result.items : [...prev, ...result.items]));
      setHistoryCursor(result.nextCursor);
    } catch (e) {
      console.error('Failed to load cupid conversations', e);
      setHistoryError('加载历史失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    if (historyItems.length === 0) {
      await loadHistory({ reset: true });
    }
  };

  const selectConversation = async (id: string) => {
    try {
      const detail = await storageService.getCupidConversation(id);
      const mapped: ChatMessage[] = detail.messages.map((msg, index) => ({
        id: `${detail.id}-${index + 1}`,
        role: msg.role,
        text: msg.text,
        timestamp: msg.timestampMs ?? Date.now(),
      }));

      setConversationId(detail.id);
      setMessages(mapped.length > 0 ? mapped : initialMessages);
      setIsDirty(false);
      setSaveHint(null);
      setHistoryOpen(false);
    } catch (e) {
      console.error('Failed to load conversation detail', e);
      setHistoryError('加载对话失败');
    }
  };

  const renameConversation = async (item: CupidConversationSummary) => {
    const next = prompt('修改对话标题', item.title);
    if (!next || !next.trim() || next.trim() === item.title) return;
    try {
      const updated = await storageService.updateCupidConversation(item.id, { title: next.trim() });
      setHistoryItems((prev) => prev.map((row) => (row.id === item.id ? updated : row)));
      if (conversationId === item.id) {
        setSaveHint('已更新标题');
      }
    } catch (e) {
      console.error('Failed to rename conversation', e);
      setHistoryError('修改标题失败');
    }
  };

  const deleteConversation = async (item: CupidConversationSummary) => {
    const ok = confirm(`删除对话「${item.title}」？此操作不可恢复。`);
    if (!ok) return;
    try {
      await storageService.deleteCupidConversation(item.id);
      setHistoryItems((prev) => prev.filter((row) => row.id !== item.id));
      if (conversationId === item.id) {
        startNewConversation();
      }
    } catch (e) {
      console.error('Failed to delete conversation', e);
      setHistoryError('删除失败');
    }
  };

  const saveConversation = async () => {
    if (isSaving || messages.length === 0) return;
    setIsSaving(true);
    setSaveHint(null);
    try {
      const payload = {
        messages,
      };
      const result = conversationId
        ? await storageService.updateCupidConversation(conversationId, payload)
        : await storageService.createCupidConversation(payload);

      setConversationId(result.id);
      setIsDirty(false);
      setSaveHint('已保存');
      await loadHistory({ reset: true });
    } catch (e) {
      console.error('Failed to save conversation', e);
      setSaveHint('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsDirty(true);
    setInput('');
    setIsLoading(true);

    const responseText = await getRelationshipAdvice(input);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsDirty(true);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-3xl shadow-lg border border-rose-100 overflow-hidden" data-testid="chat-view">
      <div className="bg-gradient-to-r from-rose-100 to-rose-50 p-4 border-b border-rose-100 flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white">
             {/* Cupid Icon Representation */}
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
               <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
             </svg>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1 border border-white">
            <Sparkles size={10} className="text-yellow-900" />
          </div>
        </div>
        <div>
          <h3 className="font-bold text-gray-800 text-lg">丘比特 AI</h3>
          <p className="text-xs text-rose-500 font-medium">恋爱导师</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={startNewConversation}
            className="h-9 px-3 rounded-xl bg-white/70 hover:bg-white text-rose-600 border border-rose-100 shadow-sm text-xs font-black flex items-center gap-1.5 transition"
            type="button"
            data-testid="cupid-new"
            title="新对话"
          >
            <Plus size={14} /> 新对话
          </button>

          <button
            onClick={saveConversation}
            disabled={isSaving || messages.length < 2}
            className="h-9 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-sm text-xs font-black flex items-center gap-1.5 transition"
            type="button"
            data-testid="cupid-save"
            title="保存当前对话"
          >
            <Save size={14} />
            {isSaving ? '保存中' : '保存'}
            {isDirty && !isSaving && <span className="ml-0.5 w-1.5 h-1.5 bg-yellow-300 rounded-full" />}
          </button>

          <button
            onClick={openHistory}
            className="h-9 px-3 rounded-xl bg-white/70 hover:bg-white text-gray-700 border border-rose-100 shadow-sm text-xs font-black flex items-center gap-1.5 transition"
            type="button"
            data-testid="cupid-history"
            title="历史记录"
          >
            <History size={14} /> 历史
          </button>
        </div>
      </div>

      {(saveHint || (conversationId && !isDirty)) && (
        <div className="px-4 py-2 text-[11px] bg-white border-b border-rose-100 flex items-center justify-between">
          <div className="text-gray-500">
            {saveHint ?? '已保存（继续聊天后需要再次保存）'}
          </div>
          {conversationId && (
            <div className="text-gray-400 truncate max-w-[55%]">
              会话ID：{conversationId}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[radial-gradient(circle_at_1px_1px,rgba(244,63,94,0.10)_1px,transparent_0)] [background-size:18px_18px] bg-fixed">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
               <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center mr-2 self-end mb-1 shrink-0">
                 <Sparkles size={14} className="text-rose-500" />
               </div>
            )}
            <div className={`max-w-[75%] p-3 rounded-2xl text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-rose-500 text-white rounded-tr-none' 
                : 'bg-white border border-rose-100 text-gray-700 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start items-center">
             <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center mr-2">
                 <Sparkles size={14} className="text-rose-500" />
             </div>
            <div className="bg-white border border-rose-100 p-3 rounded-2xl rounded-tl-none shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce delay-150"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-rose-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="向丘比特寻求建议..."
          className="flex-1 bg-rose-50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 placeholder-rose-300 text-gray-800"
          data-testid="cupid-input"
        />
        <Button 
          size="sm" 
          onClick={handleSend} 
          disabled={!input.trim() || isLoading}
          className="w-10 h-10 !p-0 flex items-center justify-center rounded-xl"
          data-testid="cupid-send"
        >
          <Send size={18} />
        </Button>
      </div>

      {historyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          onClick={() => setHistoryOpen(false)}
          data-testid="cupid-history-modal"
        >
          <div
            className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-black font-cute text-gray-800">历史对话</h3>
                <p className="text-xs text-gray-500 mt-1">只有点击“保存”的对话会出现在这里</p>
              </div>
              <button
                onClick={() => setHistoryOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                type="button"
              >
                ✕
              </button>
            </div>

            {historyError && (
              <div className="mb-3 text-xs text-red-500 font-bold">{historyError}</div>
            )}

            <div className="max-h-[60vh] overflow-y-auto custom-scroll pr-1 space-y-2">
              {historyItems.length === 0 && !historyLoading && (
                <div className="text-center text-sm text-gray-400 py-10">
                  暂无已保存对话
                </div>
              )}

              {historyItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-100 rounded-2xl p-4 hover:border-rose-200 hover:bg-rose-50/30 transition flex items-start gap-3"
                  data-testid="cupid-history-item"
                >
                  <button
                    type="button"
                    onClick={() => selectConversation(item.id)}
                    className="flex-1 text-left"
                  >
                    <div className="font-black text-gray-800 text-sm line-clamp-2">
                      {item.title}
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500 flex items-center gap-2">
                      <span>{item.messageCount} 条消息</span>
                      <span className="w-px h-3 bg-gray-200" />
                      <span>{new Date(item.updatedAt).toLocaleString()}</span>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      className="w-9 h-9 rounded-xl border border-gray-100 hover:border-rose-200 hover:bg-white flex items-center justify-center text-gray-500"
                      title="改标题"
                      onClick={() => renameConversation(item)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="w-9 h-9 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-white flex items-center justify-center text-red-500"
                      title="删除"
                      onClick={() => deleteConversation(item)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {historyLoading && (
                <div className="text-center text-xs text-gray-400 py-3">加载中…</div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => loadHistory({ reset: true })}
                className="text-xs font-black text-rose-600 hover:text-rose-700"
                type="button"
                disabled={historyLoading}
              >
                刷新
              </button>
              <button
                onClick={() => (historyCursor ? loadHistory() : undefined)}
                className="text-xs font-black text-gray-600 hover:text-gray-800 disabled:opacity-40"
                type="button"
                disabled={!historyCursor || historyLoading}
              >
                加载更多
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
