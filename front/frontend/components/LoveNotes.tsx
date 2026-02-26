import React, { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Sparkles,
  Trash2,
  Image as ImageIcon,
  X,
  Heart,
  Music,
  Calendar,
  Pencil,
  Wand2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoveNote, UserFrontend } from '../types';
import { Button } from './ui/Button';
import { generateLoveNoteSuggestion, polishText } from '../services/geminiService';
import { storageService } from '../services/storage';
import { UserBadge } from './ui/UserBadge';

interface LoveNotesProps {
  notes: LoveNote[];
  currentUser: UserFrontend;
  partnerUser: UserFrontend;
  onAddNote: (note: LoveNote) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  onUpdateNote: (
    id: string,
    patch: Partial<LoveNote> & { removeMedia?: boolean },
  ) => Promise<void>;
}

const NOTE_COLORS = [
  { id: 'yellow', bg: 'bg-[#FFF9C4]', text: 'text-yellow-900', border: 'border-yellow-200', shadow: 'shadow-yellow-100' },
  { id: 'rose', bg: 'bg-[#FFDEE9]', text: 'text-rose-900', border: 'border-rose-200', shadow: 'shadow-rose-100' },
  { id: 'blue', bg: 'bg-[#B5FFFC]', text: 'text-blue-900', border: 'border-blue-200', shadow: 'shadow-blue-100' },
  { id: 'purple', bg: 'bg-[#E1BEE7]', text: 'text-purple-900', border: 'border-purple-200', shadow: 'shadow-purple-100' },
  { id: 'green', bg: 'bg-[#C8E6C9]', text: 'text-green-900', border: 'border-green-200', shadow: 'shadow-green-100' },
];

const resolveNoteColor = (color?: string) => {
  if (!color) return `${NOTE_COLORS[0].bg} ${NOTE_COLORS[0].text} ${NOTE_COLORS[0].border} ${NOTE_COLORS[0].shadow}`;
  const match = NOTE_COLORS.find((item) => item.id === color);
  if (match) return `${match.bg} ${match.text} ${match.border} ${match.shadow}`;
  return color;
};

export const LoveNotes: React.FC<LoveNotesProps> = ({
  notes,
  currentUser,
  partnerUser,
  onAddNote,
  onDeleteNote,
  onUpdateNote,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [existingMediaUrl, setExistingMediaUrl] = useState<string | null>(null);
  const [existingMediaType, setExistingMediaType] = useState<'image' | 'video' | null>(null);
  const [removeExistingMedia, setRemoveExistingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const beginCreate = () => {
    setEditingNoteId(null);
    setNewNoteText('');
    setSelectedColorIdx(0);
    setExistingMediaUrl(null);
    setExistingMediaType(null);
    setRemoveExistingMedia(false);
    setMediaFile(null);
    setMediaPreviewUrl(null);
    setSubmitError(null);
    setIsCreating(true);
  };

  const beginEdit = (note: LoveNote) => {
    setEditingNoteId(note.id);
    setNewNoteText(note.content ?? '');
    const idx = NOTE_COLORS.findIndex((c) => c.id === note.color);
    setSelectedColorIdx(idx >= 0 ? idx : 0);
    setExistingMediaUrl(note.mediaUrl ?? null);
    setExistingMediaType((note.mediaType as 'image' | 'video' | undefined) ?? null);
    setRemoveExistingMedia(false);
    setMediaFile(null);
    setMediaPreviewUrl(null);
    setSubmitError(null);
    setIsCreating(true);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    const suggestion = await generateLoveNoteSuggestion('浪漫且调皮', partnerUser.name);
    setNewNoteText(suggestion);
    setIsGenerating(false);
  };

  const handlePolish = async () => {
    if (isPolishing) return;
    if (!newNoteText.trim()) return;
    setIsPolishing(true);
    const polished = await polishText(newNoteText, 'note');
    setNewNoteText(polished);
    setIsPolishing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreviewUrl(URL.createObjectURL(file));
      setRemoveExistingMedia(false);
    }
  };

  useEffect(() => {
    return () => {
      if (mediaPreviewUrl) {
        URL.revokeObjectURL(mediaPreviewUrl);
      }
    };
  }, [mediaPreviewUrl]);

  const clearMedia = () => {
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setMediaPreviewUrl(null);
    setMediaFile(null);
    if (existingMediaUrl) {
      setRemoveExistingMedia(true);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setSubmitError(null);
    if (!newNoteText.trim() && !mediaFile && !existingMediaUrl) return;

    setIsSubmitting(true);
    let uploadedUrl: string | undefined;
    try {
      if (mediaFile) {
        uploadedUrl = await storageService.uploadFile(mediaFile);
      }

      if (editingNoteId) {
        await onUpdateNote(editingNoteId, {
          content: newNoteText,
          color: NOTE_COLORS[selectedColorIdx].id,
          ...(uploadedUrl ? { mediaUrl: uploadedUrl, mediaType: 'image' } : {}),
          ...(removeExistingMedia ? { removeMedia: true } : {}),
        });
      } else {
        const newNote: LoveNote = {
          id: Date.now().toString(),
          coupleId: '', // Backend handles
          content: newNoteText,
          authorId: currentUser.id,
          createdAt: new Date().toISOString(),
          color: NOTE_COLORS[selectedColorIdx].id,
          mediaUrl: uploadedUrl,
          mediaType: uploadedUrl ? 'image' : undefined,
        };

        await onAddNote(newNote);
      }
      setNewNoteText('');
      clearMedia();
      setIsCreating(false);
      setEditingNoteId(null);
      setExistingMediaUrl(null);
      setExistingMediaType(null);
      setRemoveExistingMedia(false);
    } catch (e) {
      console.error('Failed to submit note', e);
      setSubmitError('发布失败，请检查网络或稍后再试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-24 relative z-10" data-testid="notes-view">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black text-gray-800 font-cute flex items-center gap-2">
          <Heart className="text-rose-500" fill="currentColor" size={24} />
          恋爱日记
        </h2>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => (isCreating ? setIsCreating(false) : beginCreate())} 
          className="bg-rose-500 text-white px-6 py-2 rounded-full font-black text-sm shadow-lg shadow-rose-200 flex items-center gap-2"
          data-testid="note-create-toggle"
        >
          {isCreating ? '取消' : <><Plus size={18} /> 写日记</>}
        </motion.button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ height: 0, opacity: 0, scale: 0.9 }}
            animate={{ height: 'auto', opacity: 1, scale: 1 }}
            exit={{ height: 0, opacity: 0, scale: 0.9 }}
            className="bg-white rounded-[2.5rem] p-6 shadow-xl border-2 border-rose-100 mb-8 overflow-hidden"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="text-xs font-black text-gray-500 uppercase tracking-widest">
                {editingNoteId ? '编辑日记' : '将以你发布'}
              </div>
              <UserBadge
                name={currentUser.name}
                avatar={currentUser.avatar}
                label="我"
              />
            </div>
            <textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder={`写点什么给 ${partnerUser.name}...`}
              className={`w-full h-32 p-5 rounded-[1.5rem] resize-none focus:outline-none focus:ring-4 focus:ring-rose-100 mb-4 text-lg font-medium transition-all ${NOTE_COLORS[selectedColorIdx].bg} ${NOTE_COLORS[selectedColorIdx].text}`}
              data-testid="note-content-input"
            />

            {mediaPreviewUrl && (
              <div className="relative mb-4 rounded-[1.5rem] overflow-hidden max-h-48 w-full shadow-inner bg-gray-50">
                <button 
                  onClick={clearMedia}
                  className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 z-10 backdrop-blur-sm"
                >
                  <X size={16} />
                </button>
                <img src={mediaPreviewUrl} alt="Upload" className="w-full h-full object-cover" />
              </div>
            )}
            {!mediaPreviewUrl && existingMediaUrl && !removeExistingMedia && (
              <div className="relative mb-4 rounded-[1.5rem] overflow-hidden max-h-48 w-full shadow-inner bg-gray-50">
                <button 
                  onClick={clearMedia}
                  className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 z-10 backdrop-blur-sm"
                  type="button"
                  title="移除图片/视频"
                >
                  <X size={16} />
                </button>
                {existingMediaType === 'video' ? (
                  <video src={existingMediaUrl} className="w-full h-full object-cover" controls />
                ) : (
                  <img src={existingMediaUrl} alt="Existing media" className="w-full h-full object-cover" />
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex gap-3 items-center">
                {NOTE_COLORS.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedColorIdx(idx)}
                    className={`w-8 h-8 rounded-full ${color.bg} border-4 transition-all ${selectedColorIdx === idx ? 'border-rose-400 scale-110' : 'border-white shadow-sm'}`}
                  />
                ))}
                <div className="w-px h-8 bg-gray-100 mx-1"></div>
                <motion.button 
                  whileHover={{ scale: 1.2 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-rose-400 hover:text-rose-600 transition-colors p-2 bg-rose-50 rounded-xl"
                >
                  <ImageIcon size={24} />
                </motion.button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="secondary" 
                  size="md" 
                  className="rounded-full w-12 h-12 !p-0"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Sparkles className="animate-spin" size={20} /> : <Sparkles size={20} />}
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  className="rounded-full w-12 h-12 !p-0"
                  onClick={handlePolish}
                  disabled={isPolishing || !newNoteText.trim()}
                  title="AI 一键润色"
                >
                  {isPolishing ? <Wand2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                </Button>
                <Button
                  size="md"
                  className="rounded-full px-8 font-black"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  data-testid="note-submit"
                >
                  {isSubmitting ? '处理中...' : (editingNoteId ? '保存' : '发布')}
                </Button>
              </div>
            </div>
            {submitError && <div className="text-sm text-red-500 font-bold mt-3">{submitError}</div>}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="columns-2 gap-4 space-y-4" data-testid="note-list">
        {notes.length === 0 && (
          <div className="col-span-2 text-center py-20 text-gray-400 italic">
            还没有日记，快来写第一篇吧！✨
          </div>
        )}
        {notes.map((note, idx) => (
          <motion.div
            key={note.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ rotate: idx % 2 === 0 ? 1 : -1, scale: 1.02 }}
            className={`p-5 rounded-[2rem] shadow-sm border-2 relative group break-inside-avoid ${resolveNoteColor(note.color)}`}
            data-testid="note-item"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <UserBadge
                name={note.authorId === currentUser.id ? currentUser.name : partnerUser.name}
                avatar={note.authorId === currentUser.id ? currentUser.avatar : partnerUser.avatar}
                label={note.authorId === currentUser.id ? '我' : undefined}
              />
              <div className="flex items-center gap-1 opacity-60 text-[10px] font-bold shrink-0 mt-1">
                <Calendar size={10} />
                {new Date(note.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="space-y-3">
              {note.mediaUrl && (
                <div className="rounded-[1.2rem] overflow-hidden w-full h-40 bg-black/5 shadow-inner">
                  {note.mediaType === 'video' ? (
                    <video src={note.mediaUrl} className="w-full h-full object-cover" />
                  ) : (
                    <img src={note.mediaUrl} alt="Note media" className="w-full h-full object-cover" />
                  )}
                </div>
              )}
              <p className="font-medium text-sm leading-relaxed break-words font-cute">
                {note.content}
              </p>
            </div>
            <div className="flex justify-between items-end mt-4">
              <div />
              {note.authorId === currentUser.id && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => beginEdit(note)}
                    className="text-gray-500 p-2 hover:bg-white/50 rounded-full"
                    title="编辑"
                    type="button"
                  >
                    <Pencil size={14} />
                  </button>
                  <button 
                    onClick={() => void onDeleteNote(note.id)}
                    className="text-rose-400 p-2 hover:bg-white/50 rounded-full"
                    data-testid="note-delete"
                    title="删除"
                    type="button"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
            {/* Decorative Tape */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-white/40 backdrop-blur-sm rounded-sm rotate-2" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
