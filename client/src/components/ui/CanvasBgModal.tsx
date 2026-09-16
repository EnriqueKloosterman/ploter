import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlignJustify, Grip, Hash, ImagePlus, Link2, LoaderCircle, Trash2 } from 'lucide-react';
import Modal from './Modal';
import { useProject } from '../../context/useProject';
import type { ICanvasBackground } from '../../context/projectTypes';
import { uploadImage } from '../../lib/upload';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PATTERNS: Array<{ value: ICanvasBackground['variant']; icon: React.ElementType }> = [
  { value: 'dots', icon: Grip },
  { value: 'lines', icon: AlignJustify },
  { value: 'cross', icon: Hash },
];

const DEFAULT_OPACITY = 0.4;

const CanvasBgModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { project, updateCanvasBackground } = useProject();
  const bg = project.canvas.background;
  const variant = bg?.variant ?? 'dots';
  const hasImage = Boolean(bg?.imageUrl);

  const [urlDraft, setUrlDraft] = useState('');
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUrlDraft(bg?.imageUrl ?? '');
      setOpacity(bg?.imageOpacity ?? DEFAULT_OPACITY);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const commit = (patch: Partial<ICanvasBackground>) => {
    updateCanvasBackground({
      variant,
      imageUrl: bg?.imageUrl,
      imageOpacity: bg?.imageOpacity ?? DEFAULT_OPACITY,
      ...patch,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      setUrlDraft(url);
      commit({ imageUrl: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('canvasBg.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('canvasBg.title')} size="sm">
      <div className="p-5 space-y-5">
        <section>
          <h3 className="label text-slate-400 mb-2">{t('canvasBg.pattern')}</h3>
          <div className="grid grid-cols-3 gap-2">
            {PATTERNS.map(({ value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => commit({ variant: value })}
                aria-label={t(`canvasBg.pattern_${value}`)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-colors ${
                  variant === value && !hasImage
                    ? 'bg-accent/15 text-accent border-accent/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border-white/10'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{t(`canvasBg.pattern_${value}`)}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="label text-slate-400 mb-2">{t('canvasBg.image')}</h3>
          {hasImage && bg?.imageUrl && (
            <img
              src={bg.imageUrl}
              alt=""
              className="w-full h-24 object-cover rounded-lg border border-white/10 mb-2"
            />
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit({ imageUrl: urlDraft.trim() || undefined }); } }}
              placeholder={t('canvasBg.urlPlaceholder')}
              className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              type="button"
              onClick={() => commit({ imageUrl: urlDraft.trim() || undefined })}
              disabled={!urlDraft.trim()}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-accent hover:bg-accent-strong disabled:bg-slate-800 disabled:text-slate-500 text-white transition-colors"
            >
              <Link2 className="w-4 h-4" />
              {t('canvasBg.apply')}
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.gif,.webp,.svg"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 border border-white/10 transition-colors disabled:opacity-50"
            >
              {uploading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
              {uploading ? t('canvasBg.uploading') : t('canvasBg.upload')}
            </button>
            {hasImage && (
              <button
                type="button"
                onClick={() => { setUrlDraft(''); commit({ imageUrl: undefined }); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors ml-auto"
              >
                <Trash2 className="w-4 h-4" />
                {t('canvasBg.remove')}
              </button>
            )}
          </div>

          <div className={`mt-4 ${hasImage ? '' : 'opacity-40 pointer-events-none'}`}>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="bg-opacity" className="text-sm text-slate-300">{t('canvasBg.opacity')}</label>
              <span className="text-xs font-mono text-slate-400">{Math.round(opacity * 100)}%</span>
            </div>
            <input
              id="bg-opacity"
              type="range"
              min={0}
              max={100}
              value={Math.round(opacity * 100)}
              onChange={(e) => setOpacity(Number(e.target.value) / 100)}
              onMouseUp={() => commit({ imageOpacity: opacity })}
              onTouchEnd={() => commit({ imageOpacity: opacity })}
              onKeyUp={() => commit({ imageOpacity: opacity })}
              className="w-full accent-emerald-500"
            />
          </div>

          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </section>
      </div>
    </Modal>
  );
};

export default CanvasBgModal;
