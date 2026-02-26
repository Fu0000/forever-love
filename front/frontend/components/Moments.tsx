import React, { useEffect, useRef, useState } from 'react';
import { Moment, UserFrontend } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Plus,
  Image as ImageIcon,
  X,
  Trash2,
  Maximize2,
  ChevronLeft,
  Pencil,
  Wand2,
} from 'lucide-react';
import { Button } from './ui/Button';
import { storageService } from '../services/storage';
import { UserBadge } from './ui/UserBadge';
import { polishText } from '../services/geminiService';

interface MomentsProps {
  moments: Moment[];
  currentUser: UserFrontend;
  partnerUser: UserFrontend;
  onAddMoment: (moment: Moment) => Promise<void>;
  onUpdateMoment: (id: string, patch: Partial<Moment>) => Promise<void>;
  onDeleteMoment: (id: string) => Promise<void>;
}

export const Moments: React.FC<MomentsProps> = ({
  moments,
  currentUser,
  partnerUser,
  onAddMoment,
  onUpdateMoment,
  onDeleteMoment,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [viewingMoment, setViewingMoment] = useState<Moment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPolishing, setIsPolishing] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tags, setTags] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const defaultImageUrl = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80';

  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editImagePreviewUrl, setEditImagePreviewUrl] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editPolishing, setEditPolishing] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      setEditImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    return () => {
      if (editImagePreviewUrl) URL.revokeObjectURL(editImagePreviewUrl);
    };
  }, [editImagePreviewUrl]);

  const clearImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    setImageFile(null);
  };

  const clearEditImage = () => {
    if (editImagePreviewUrl) URL.revokeObjectURL(editImagePreviewUrl);
    setEditImagePreviewUrl(null);
    setEditImageFile(null);
  };

  const beginEdit = () => {
    if (!viewingMoment) return;
    setEditOpen(true);
    setEditError(null);
    setEditTitle(viewingMoment.title ?? '');
    setEditDescription(viewingMoment.description ?? '');
    setEditDate(viewingMoment.date ?? new Date().toISOString().split('T')[0]);
    setEditTags((viewingMoment.tags ?? []).join(' '));
    setEditImagePreviewUrl(null);
    setEditImageFile(null);
  };

  const handlePolishCreate = async () => {
    if (isPolishing) return;
    if (!title.trim() && !description.trim()) return;
    setIsPolishing(true);
    try {
      const [titleResult, descResult] = await Promise.allSettled([
        title.trim() ? polishText(title, 'moment') : Promise.resolve(null),
        description.trim() ? polishText(description, 'moment') : Promise.resolve(null),
      ]);

      if (titleResult.status === 'fulfilled' && titleResult.value) {
        setTitle(titleResult.value);
      }
      if (descResult.status === 'fulfilled' && descResult.value) {
        setDescription(descResult.value);
      }
    } finally {
      setIsPolishing(false);
    }
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
        createdBy: currentUser.id,
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

  const handleSaveEdit = async () => {
    if (!viewingMoment) return;
    if (editSubmitting) return;
    setEditError(null);
    if (!editTitle.trim() || !editDescription.trim()) return;

    setEditSubmitting(true);
    try {
      const uploadedUrl = editImageFile ? await storageService.uploadFile(editImageFile) : null;
      const patch: Partial<Moment> = {
        title: editTitle,
        description: editDescription,
        date: editDate,
        tags: editTags
          .split(' ')
          .filter((t) => t.trim())
          .map((t) => t.replace('#', '')),
        ...(uploadedUrl ? { imageUrl: uploadedUrl } : {}),
      };
      await onUpdateMoment(viewingMoment.id, patch);
      setViewingMoment((prev) => (prev ? { ...prev, ...patch, imageUrl: patch.imageUrl ?? prev.imageUrl } : prev));
      setEditOpen(false);
      clearEditImage();
    } catch (e) {
      console.error('Failed to update moment', e);
      setEditError('保存失败，请稍后重试');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handlePolishEdit = async () => {
    if (editPolishing) return;
    if (!editTitle.trim() && !editDescription.trim()) return;
    setEditPolishing(true);
    try {
      const [titleResult, descResult] = await Promise.allSettled([
        editTitle.trim() ? polishText(editTitle, 'moment') : Promise.resolve(null),
        editDescription.trim() ? polishText(editDescription, 'moment') : Promise.resolve(null),
      ]);

      if (titleResult.status === 'fulfilled' && titleResult.value) {
        setEditTitle(titleResult.value);
      }
      if (descResult.status === 'fulfilled' && descResult.value) {
        setEditDescription(descResult.value);
      }
    } finally {
      setEditPolishing(false);
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
              <div className="flex items-center justify-between">
                <div className="text-xs font-black text-gray-500 uppercase tracking-widest">
                  将以你发布
                </div>
                <UserBadge name={currentUser.name} avatar={currentUser.avatar} label="我" />
              </div>
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

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={handlePolishCreate}
                  disabled={isPolishing || (!title.trim() && !description.trim())}
                  data-testid="moment-polish"
                >
                  {isPolishing ? '润色中...' : 'AI 一键润色'}
                  <Wand2 size={16} className="ml-2" />
                </Button>
                <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting} data-testid="moment-submit">
                  {isSubmitting ? '发布中...' : '记录美好时刻'}
                </Button>
              </div>
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
            <div className="sticky top-0 z-20 pt-safe">
              <div className="flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur border-b border-white/10">
                <button
                  type="button"
                  onClick={() => setViewingMoment(null)}
                  className="text-white/80 hover:text-white flex items-center gap-1 font-black"
                  data-testid="moment-view-close"
                >
                  <ChevronLeft size={22} /> 返回
                </button>
                <div className="text-white/80 text-xs font-black tracking-widest uppercase">
                  旅程详情
                </div>
                {viewingMoment.createdBy === currentUser.id ? (
                  <button
                    type="button"
                    onClick={beginEdit}
                    className="text-white/80 hover:text-white flex items-center gap-1 font-black"
                    title="编辑"
                    data-testid="moment-edit-open"
                  >
                    <Pencil size={18} /> 编辑
                  </button>
                ) : (
                  <div className="w-[62px]" />
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 pb-safe">
              {viewingMoment.imageUrl && (
                <img 
                  src={viewingMoment.imageUrl} 
                  alt={viewingMoment.title} 
                  className="w-full max-h-[60vh] object-contain rounded-lg mb-6"
                />
              )}
              <div className="w-full max-w-md text-white">
                {editOpen && (
                  <div className="mb-6 bg-white rounded-3xl p-4 text-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-black">编辑动态</div>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => {
                          setEditOpen(false);
                          setEditError(null);
                          clearEditImage();
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-200 outline-none"
                        placeholder="标题"
                        data-testid="moment-edit-title-input"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full h-24 px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-200 outline-none resize-none"
                        placeholder="文案"
                        data-testid="moment-edit-desc-input"
                      />
                      <div className="flex gap-3">
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-200 outline-none text-gray-600"
                          data-testid="moment-edit-date-input"
                        />
                        <input
                          value={editTags}
                          onChange={(e) => setEditTags(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-200 outline-none"
                          placeholder="标签 (空格分隔)"
                          data-testid="moment-edit-tags-input"
                        />
                      </div>

                      {editImagePreviewUrl ? (
                        <div className="relative rounded-xl overflow-hidden h-40 w-full bg-gray-100">
                          <img
                            src={editImagePreviewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={clearEditImage}
                            className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                            type="button"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => editFileInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-xl h-20 flex items-center justify-center text-gray-400 cursor-pointer hover:border-rose-300 hover:text-rose-500 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <ImageIcon size={20} />
                            <span className="text-sm">更换照片（可选）</span>
                          </div>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={editFileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleEditFileChange}
                      />

                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          className="flex-1"
                          onClick={handlePolishEdit}
                          disabled={editPolishing || (!editTitle.trim() && !editDescription.trim())}
                          data-testid="moment-edit-polish"
                        >
                          {editPolishing ? '润色中...' : 'AI 一键润色'}
                          <Wand2 size={16} className="ml-2" />
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={handleSaveEdit}
                          disabled={editSubmitting}
                          data-testid="moment-edit-submit"
                        >
                          {editSubmitting ? '保存中...' : '保存'}
                        </Button>
                      </div>
                      {editError && (
                        <div className="text-sm text-red-500 font-bold">
                          {editError}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 text-rose-400 font-bold mb-2 uppercase tracking-wide text-sm">
                  <Calendar size={14} />
                  {new Date(viewingMoment.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="mb-3">
                  <UserBadge
                    name={
                      viewingMoment.createdBy === currentUser.id
                        ? currentUser.name
                        : partnerUser.name
                    }
                    avatar={
                      viewingMoment.createdBy === currentUser.id
                        ? currentUser.avatar
                        : partnerUser.avatar
                    }
                    label={viewingMoment.createdBy === currentUser.id ? '我' : undefined}
                    size="md"
                    variant="light"
                  />
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
                <div className="mb-3">
                  <UserBadge
                    name={
                      moment.createdBy === currentUser.id
                        ? currentUser.name
                        : partnerUser.name
                    }
                    avatar={
                      moment.createdBy === currentUser.id
                        ? currentUser.avatar
                        : partnerUser.avatar
                    }
                    label={moment.createdBy === currentUser.id ? '我' : undefined}
                  />
                </div>
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
