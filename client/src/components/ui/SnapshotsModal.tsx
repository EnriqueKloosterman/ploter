import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../lib/api';
import ConfirmModal from './ConfirmModal';
import { useToast } from '../../context/ToastContext';

interface SnapshotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onRestore: () => void;
}

interface Snapshot {
  _id: string;
  description: string;
  createdAt: string;
}

const SnapshotsModal: React.FC<SnapshotsModalProps> = ({ isOpen, onClose, projectId, onRestore }) => {
  const { t } = useTranslation();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    apiFetch(`/api/snapshots/${projectId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.status === 'success') setSnapshots(json.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [isOpen, projectId]);

  const handleRestore = async () => {
    if (!restoreId) return;
    setRestoring(true);
    try {
      const res = await apiFetch(`/api/snapshots/restore/${restoreId}`, { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.status === 'success') {
        showToast(t('snapshotsModal.restored'), 'success');
        onRestore();
        onClose();
      } else {
        showToast(json.message || t('snapshotsModal.restoreError'), 'error');
      }
    } catch {
      showToast(t('snapshotsModal.networkError'), 'error');
    } finally {
      setRestoring(false);
      setRestoreId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-slate-700/80 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-100">{t('snapshotsModal.title')}</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 rounded p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-5 max-h-80 overflow-y-auto space-y-3">
            {isLoading ? (
              <p className="text-sm text-slate-400 text-center py-4">{t('snapshotsModal.loading')}</p>
            ) : snapshots.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4 italic">{t('snapshotsModal.noSnapshots')}</p>
            ) : (
              snapshots.map((snap) => (
                <div key={snap._id} className="flex items-center justify-between bg-slate-800/40 border border-slate-700/50 rounded-lg px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{snap.description}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {new Date(snap.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setRestoreId(snap._id)}
                    disabled={restoring}
                    className="text-xs text-amber-400 hover:text-amber-300 disabled:text-slate-600 bg-slate-700/50 hover:bg-slate-600 disabled:bg-slate-800/30 px-3 py-1.5 rounded-lg border border-slate-600/50 hover:border-amber-500/50 disabled:border-slate-700/30 transition-colors ml-3 shrink-0"
                  >
{t('snapshotsModal.restore')}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={restoreId !== null}
        title={t('snapshotsModal.restoreConfirm')}
        message={t('snapshotsModal.restoreMessage')}
        onConfirm={handleRestore}
        onCancel={() => setRestoreId(null)}
      />
    </>
  );
};

export default SnapshotsModal;
