import React, { useEffect, useRef, useState } from 'react';
import { Moment } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Plus, Image as ImageIcon, X, Trash2, Maximize2 } from 'lucide-react';
import { Button } from './ui/Button';
import { storageService } from '../services/storage';

interface MomentsProps {
  moments: Moment[];
  onAddMoment: (moment: Moment) => Promise<void>;
  onDeleteMoment: (id: string) => Promise<void>;
}

export const Moments: React.FC<MomentsProps> = ({ moments, onAddMoment, onDeleteMoment }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [viewingMoment, setViewingMoment] = useState<Moment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tags, setTags] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const defaultImageUrl = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const clearImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    setImageFile(null);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setSubmitError(null);
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const uploadedUrl = imageFile ? await storageService.uploadFile(imageFile) : null;

      const newMoment: Moment = {
        id: Date.now().toString(),
        coupleId: '', // Backend handles
        title,
        description,
        date,
        imageUrl: uploadedUrl ?? defaultImageUrl,
        tags: tags
          .split(' ')
          .filter((tag) => tag.trim() !== '')
          .map((tag) => tag.replace('#', '')),
        createdAt: new Date().toISOString(),
      };

      await onAddMoment(newMoment);

      // Reset form
      setTitle('');
      setDescription('');
      setTags('');
      clearImage();
      setIsCreating(false);
    } catch (e) {
      console.error('Failed to submit moment', e);
      setSubmitError('发布失败，请检查网络或稍后再试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-20" data-testid="moments-view">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">我们的旅程</h2>
        <Button onClick={() => setIsCreating(!isCreating)} size="sm" data-testid="moment-create-toggle">
          {isCreating ? '取消' : <><Plus size={16} className="mr-1" /> 发布动态</>}
        </Button>
      </div>
      
      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white rounded-2xl p-4 shadow-md border border-rose-100 mb-8 overflow-hidden"
          >
            <div className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="标题 (例如: 第一次旅行)"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-200 outline-none"
                data-testid="moment-title-input"
              />
              
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="发生了什么美好的事情..."
                className="w-full h-24 px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-200 outline-none resize-none"
                data-testid="moment-desc-input"
              />

              <div className="flex gap-3">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-200 outline-none text-gray-600"
                  data-testid="moment-date-input"
                />
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="标签 (空格分隔)"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-200 outline-none"
                  data-testid="moment-tags-input"
                />
              </div>

              {imagePreviewUrl ? (
                <div className="relative rounded-xl overflow-hidden h-40 w-full bg-gray-100">
                  <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={clearImage}
                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl h-20 flex items-center justify-center text-gray-400 cursor-pointer hover:border-rose-300 hover:text-rose-500 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon size={20} />
                    <span className="text-sm">添加照片</span>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />

              <Button className="w-full mt-2" onClick={handleSubmit} disabled={isSubmitting} data-testid="moment-submit">
                {isSubmitting ? '发布中...' : '记录美好时刻'}
              </Button>
              {submitError && <div className="text-sm text-red-500 font-bold">{submitError}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingMoment && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col overflow-y-auto"
          >
            <button 
              onClick={() => setViewingMoment(null)}
              className="absolute top-4 right-4 text-white/70 hover:text-white z-10 p-2"
              data-testid="moment-view-close"
            >
              <X size={32} />
            </button>

            <div className="flex-1 flex flex-col items-center justify-center p-6">
              {viewingMoment.imageUrl && (
                <img 
                  src={viewingMoment.imageUrl} 
                  alt={viewingMoment.title} 
                  className="w-full max-h-[60vh] object-contain rounded-lg mb-6"
                />
              )}
              <div className="w-full max-w-md text-white">
                <div className="flex items-center gap-2 text-rose-400 font-bold mb-2 uppercase tracking-wide text-sm">
                  <Calendar size={14} />
                  {new Date(viewingMoment.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <h2 className="text-3xl font-black mb-4 font-cute">{viewingMoment.title}</h2>
                <p className="text-gray-300 leading-relaxed text-lg mb-6">{viewingMoment.description}</p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {viewingMoment.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-white/10 text-white/80 text-sm rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full border-red-500 text-red-500 hover:bg-red-500/10"
                  onClick={() => {
                    void onDeleteMoment(viewingMoment.id);
                    setViewingMoment(null);
                  }}
                  data-testid="moment-delete"
                >
                  <Trash2 size={18} className="mr-2" /> 删除此动态
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative pl-4 border-l-2 border-rose-200 space-y-8">
        {moments.length === 0 && (
          <div className="text-gray-400 text-sm italic pl-4">还没有记录，点击右上角发布第一条动态吧！</div>
        )}
        {moments.map((moment, index) => (
          <motion.div 
            key={moment.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative group cursor-pointer"
            onClick={() => setViewingMoment(moment)}
            data-testid="moment-item"
          >
            {/* Timeline Dot */}
            <div className="absolute -left-[21px] top-0 w-4 h-4 bg-rose-500 rounded-full border-4 border-rose-100 group-hover:scale-125 transition-transform"></div>
            
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-rose-100 group-hover:shadow-md transition-all">
              {moment.imageUrl && (
                <div className="h-40 w-full overflow-hidden relative">
                  <img src={moment.imageUrl} alt={moment.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Maximize2 className="text-white drop-shadow-md" />
                  </div>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-rose-500 font-bold mb-1 uppercase tracking-wide">
                  <Calendar size={12} />
                  {new Date(moment.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-1">{moment.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{moment.description}</p>
                
                <div className="mt-3 flex flex-wrap gap-2">
                  {moment.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] rounded-md font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
