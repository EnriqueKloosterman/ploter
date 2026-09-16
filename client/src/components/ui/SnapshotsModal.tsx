import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../lib/api';
import ConfirmModal from './ConfirmModal';
import Modal from './Modal';
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
      <Modal isOpen={isOpen} onClose={onClose} title={t('snapshotsModal.title')} size="lg">
        <div className="p-5 max-h-80 space-y-3">
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
      </Modal>

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
