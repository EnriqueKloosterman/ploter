import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import Modal from './Modal';

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

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    addTag({ tagId: `gt_${Date.now()}`, label: newLabel.trim(), color: newColor });
    setNewLabel('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('tagsModal.manageTags')}>
      <div className="p-5 space-y-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder={t('tagsModal.tagName')}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent"
            autoFocus
          />
          <select
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            aria-label={t('tagsModal.tagName')}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {TAG_COLORS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="submit"
            aria-label={t('common.create')}
            className="bg-accent hover:bg-accent-strong text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center"
          >
            <Plus size={16} />
          </button>
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
                  className="flex-1 bg-transparent text-sm text-slate-200 focus:outline-none border-b border-transparent focus:border-accent"
                />
                <select
                  value={tag.color}
                  onChange={(e) => updateTag(tag.tagId, { color: e.target.value })}
                  aria-label={t('tagsModal.tagName')}
                  className="bg-slate-900 border border-slate-700 rounded text-xs px-1 py-0.5 text-slate-300"
                >
                  {TAG_COLORS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  onClick={() => removeTag(tag.tagId)}
                  className="text-slate-500 hover:text-red-400 text-sm p-1 flex items-center justify-center"
                  title={t('tagsModal.removeTag')}
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TagsModal;
