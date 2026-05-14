import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';

interface TagsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TAG_COLORS = ['#64748b', '#3b82f6', '#10b981', '#eab308', '#f97316', '#ef4444', '#a855f7'];

const TagsModal: React.FC<TagsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { tags, addTag, updateTag, removeTag } = useUser();
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#64748b');

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    addTag({ tagId: `gt_${Date.now()}`, label: newLabel.trim(), color: newColor });
    setNewLabel('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-100">{t('tagsModal.manageTags')}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 rounded p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder={t('tagsModal.tagName')}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <select
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TAG_COLORS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium">+</button>
          </form>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {tags.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">{t('tagsModal.noTags')}</p>
            ) : (
              tags.map((tag) => (
                <div key={tag.tagId} className="flex items-center gap-2 bg-slate-800/40 rounded-lg px-3 py-2 border border-slate-700/50">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                  <input
                    type="text"
                    value={tag.label}
                    onChange={(e) => updateTag(tag.tagId, { label: e.target.value })}
                    className="flex-1 bg-transparent text-sm text-slate-200 focus:outline-none border-b border-transparent focus:border-blue-500"
                  />
                  <select
                    value={tag.color}
                    onChange={(e) => updateTag(tag.tagId, { color: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded text-xs px-1 py-0.5 text-slate-300"
                  >
                    {TAG_COLORS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeTag(tag.tagId)}
                    className="text-slate-500 hover:text-red-400 text-sm p-1"
                    title={t('tagsModal.removeTag')}
                  >
                    x
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagsModal;
