import React, { useEffect, useRef, useState } from 'react';
import type { Node } from '@xyflow/react';
import { useReactFlow } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import type { INodeData } from '../../context/projectTypes';
import { useProject } from '../../context/useProject';
import { useUser } from '../../context/UserContext';
import { uploadImage } from '../../lib/upload';
import ConfirmModal from '../ui/ConfirmModal';
import Modal from '../ui/Modal';
import RichTextEditor from '../ui/RichTextEditor';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  node: Node | null;
  onSave: (nodeId: string, newData: INodeData) => void;
  onDuplicate?: (node: Node) => void;
  onOpenInkStudio?: (nodeId: string) => void;
}

const getFormDataFromNode = (node: Node | null): Partial<INodeData> => {
  if (!node) return {};

  const nodeData = node.data as INodeData;

  return {
    title: nodeData.title || '',
    content: nodeData.content || '',
    sceneAction: nodeData.sceneAction || '',
    stats: nodeData.stats || '',
    image: nodeData.image || undefined,
    color: nodeData.color || 'slate',
    characterTags: nodeData.characterTags || [],
    chapterId: nodeData.chapterId || ''
  };
};

const PlotNodeModal: React.FC<Props> = ({ isOpen, onClose, node, onSave, onDuplicate, onOpenInkStudio }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<INodeData>>(() => getFormDataFromNode(node));
  const { project } = useProject();
  const { tags } = useUser();
  const { deleteElements } = useReactFlow();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(getFormDataFromNode(node));
  }, [node]);

  if (!isOpen || !node) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(node.id, { ...(node.data as INodeData), ...formData } as INodeData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('nodeModal.editCard')}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block label text-slate-400 mb-1">{t('nodeModal.title')}</label>
            <div className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 focus-within:ring-2 focus-within:ring-accent transition-all">
              <RichTextEditor
                key={`title-${node.id}`}
                content={formData.title || ''}
                onChange={(newTitle) => setFormData({ ...formData, title: newTitle })}
                placeholder={t('nodeModal.titlePlaceholder')}
                minimal={true}
              />
            </div>
          </div>

          <div>
            <label className="block label text-slate-400 mb-1">{t('nodeModal.description')}</label>
            <div className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 focus-within:ring-2 focus-within:ring-accent transition-all">
              <RichTextEditor
                key={`content-${node.id}`}
                content={formData.content || ''}
                onChange={(newContent) => setFormData({ ...formData, content: newContent })}
                placeholder={t('nodeModal.descriptionPlaceholder')}
              />
            </div>
          </div>

          <div>
            <label className="block label text-slate-400 mb-1">{t('nodeModal.sceneAction')}</label>
            <div className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 focus-within:ring-2 focus-within:ring-accent transition-all">
              <RichTextEditor
                key={`action-${node.id}`}
                content={formData.sceneAction || ''}
                onChange={(newAction) => setFormData({ ...formData, sceneAction: newAction })}
                placeholder={t('nodeModal.sceneActionPlaceholder')}
                minimal
              />
            </div>
          </div>

          <div>
            <label className="block label text-slate-400 mb-1">{t('nodeModal.stats')}</label>
            <textarea
              key={`stats-${node.id}`}
              value={formData.stats || ''}
              onChange={(e) => setFormData({ ...formData, stats: e.target.value })}
              placeholder={t('nodeModal.statsPlaceholder')}
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent transition-all resize-y font-mono"
            />
          </div>

          <div>
            <label className="block label text-slate-400 mb-2">{t('nodeModal.backgroundImage')}</label>

            {formData.image?.url ? (
              <div className="relative rounded-lg overflow-hidden border border-slate-700/50 bg-slate-950">
                <img
                  src={formData.image.url}
                  alt=""
                  className="w-full h-24 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, image: undefined })}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white text-xs px-2 py-1 rounded transition-colors"
                >
                  {t('nodeModal.removeImage')}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!file.type.startsWith('image/')) {
                      alert(t('common.imageUploadError'));
                      return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      alert(t('common.imageSizeLimit'));
                      return;
                    }
                    setIsUploading(true);
                    try {
                      const url = await uploadImage(file);
                      setFormData({ ...formData, image: { url, width: 0, height: 0 } });
                    } catch {
                      alert('Error al subir la imagen');
                    } finally {
                      setIsUploading(false);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  {isUploading ? '...' : t('nodeModal.uploadImage')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    showUrlInput
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {t('nodeModal.pasteUrl')}
                </button>
              </div>
            )}

            {showUrlInput && !formData.image?.url && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (urlInput.trim()) {
                      setFormData({ ...formData, image: { url: urlInput.trim(), width: 0, height: 0 } });
                      setUrlInput('');
                      setShowUrlInput(false);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent hover:bg-accent-strong text-white transition-colors"
                >
                  {t('common.accept')}
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block label text-slate-400 mb-2">{t('nodeModal.color')}</label>
            <div className="flex gap-3">
              {['slate', 'blue', 'green', 'yellow', 'orange', 'red', 'purple'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    formData.color === color ? 'border-white scale-125' : 'border-transparent hover:scale-110'
                  }
                    ${color === 'slate' ? 'bg-slate-500' : ''}
                    ${color === 'blue' ? 'bg-blue-500' : ''}
                    ${color === 'green' ? 'bg-emerald-500' : ''}
                    ${color === 'yellow' ? 'bg-yellow-500' : ''}
                    ${color === 'orange' ? 'bg-orange-500' : ''}
                    ${color === 'red' ? 'bg-red-500' : ''}
                    ${color === 'purple' ? 'bg-purple-500' : ''}
                  `}
                />
              ))}
            </div>
          </div>

          {tags.length > 0 && (
            <div>
              <label className="block label text-slate-400 mb-2">{t('nodeModal.tags')}</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = formData.categoryTags?.includes(tag.tagId);
                  return (
                    <button
                      key={tag.tagId}
                      type="button"
                      onClick={() => {
                        const current = formData.categoryTags || [];
                        const next = isSelected ? current.filter((id) => id !== tag.tagId) : [...current, tag.tagId];
                        setFormData({ ...formData, categoryTags: next });
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-opacity-30 border-white/50 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                      style={isSelected ? { backgroundColor: `${tag.color}40`, borderColor: tag.color } : undefined}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block label text-slate-400 mb-2">{t('nodeModal.linkedCharacters')}</label>
            {project.characters.length === 0 ? (
              <p className="text-xs text-slate-500 italic">{t('nodeModal.noGlobalCharacters')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {project.characters.map((char) => {
                  const isSelected = formData.characterTags?.includes(char.id);

                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => {
                        const tags = formData.characterTags || [];
                        const newTags = isSelected
                          ? tags.filter((id) => id !== char.id)
                          : [...tags, char.id];
                        setFormData({ ...formData, characterTags: newTags });
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                      }`}
                    >
                      {char.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pb-2">
            <label className="block label text-slate-400 mb-2">{t('nodeModal.chapterRoot')}</label>
            <select
              value={formData.chapterId || ''}
              onChange={(e) => setFormData({ ...formData, chapterId: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
            >
              <option value="">{t('nodeModal.noChapter')}</option>
              {project.chapterManager.chapters.map((chapter) => (
                <option key={chapter.chapterId} value={chapter.chapterId}>
                  {chapter.chapterId}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 mt-2 flex justify-between gap-3 border-t border-slate-800 items-center">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                className="text-red-500 hover:text-red-400 text-xs font-bold uppercase transition-colors px-2 py-1 rounded border border-transparent hover:border-red-500/30"
              >
                {t('nodeModal.deleteCard')}
              </button>
              {onDuplicate && (
                <button
                  type="button"
                  onClick={() => { onDuplicate(node); onClose(); }}
                  className="text-sky-400 hover:text-sky-300 text-xs font-bold uppercase transition-colors px-2 py-1 rounded border border-transparent hover:border-sky-500/30"
                >
                  {t('nodeModal.duplicate')}
                </button>
              )}
              {onOpenInkStudio && (
                <button
                  type="button"
                  onClick={() => { onOpenInkStudio(node.id); onClose(); }}
                  className="text-teal-400 hover:text-teal-300 text-xs font-bold uppercase transition-colors px-2 py-1 rounded border border-transparent hover:border-teal-500/30"
                >
                  Ink
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                {t('nodeModal.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-strong text-white shadow-lg shadow-emerald-500/30 transition-all font-sans"
              >
                {t('nodeModal.applyChanges')}
              </button>
            </div>
          </div>
        </form>
      <ConfirmModal
        isOpen={isConfirmOpen}
        title={t('nodeModal.confirmDelete')}
        message={t('nodeModal.confirmDeleteMessage')}
        onConfirm={() => {
          deleteElements({ nodes: [{ id: node.id }] });
          setIsConfirmOpen(false);
          onClose();
        }}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </Modal>
  );
};

export default PlotNodeModal;
