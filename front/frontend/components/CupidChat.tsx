import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { ChatMessage } from '../types';
import { getRelationshipAdvice } from '../services/geminiService';
import { Button } from './ui/Button';

export const CupidChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: "你好，恋人们！💘 我是爱神丘比特，你们的专属恋爱顾问。无论是约会灵感、化解小矛盾，还是写一首情诗，我都在这里。今天你们的心情如何？",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
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
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-3xl shadow-lg border border-rose-100 overflow-hidden">
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
      </div>

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
        />
        <Button 
          size="sm" 
          onClick={handleSend} 
          disabled={!input.trim() || isLoading}
          className="w-10 h-10 !p-0 flex items-center justify-center rounded-xl"
        >
          <Send size={18} />
        </Button>
      </div>
    </div>
  );
};
