import React, { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../context/useProject';
import { useUser } from '../../context/UserContext';
import type { INode, ICharacter } from '../../context/projectTypes';

const stripHtml = (html?: string) => (html || '').replace(/<[^>]*>/g, '');

const PrintableCardsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { project } = useProject();
  const { tags } = useUser();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const buildPrintHtml = useCallback(() => {
    const { characters } = project;
    const nodes = project.canvas.nodes;
    const cardsHtml = nodes.map((n: INode) => {
      const title = stripHtml(n.data.title) || 'Sin título';
      const content = stripHtml(n.data.content).slice(0, 150);
      const charNames = (n.data.characterTags || [])
        .map((id: string) => characters.find((c: ICharacter) => c.id === id)?.name)
        .filter((v): v is string => !!v);
      const tagLabels = (n.data.categoryTags || [])
        .map((id: string) => tags.find((t) => t.tagId === id)?.label)
        .filter((v): v is string => !!v);

      return `<div class="card">
        <div class="bar ${n.data.color || 'slate'}"></div>
        <div class="card-body">
          <div class="title">${escapeHtml(title)}</div>
          ${content ? `<div class="preview">${escapeHtml(content)}</div>` : ''}
          ${charNames.length ? `<div class="chips">${charNames.map((n: string) => `<span class="chip char">${escapeHtml(n)}</span>`).join('')}</div>` : ''}
          ${tagLabels.length ? `<div class="chips">${tagLabels.map((l: string) => `<span class="chip tag">${escapeHtml(l)}</span>`).join('')}</div>` : ''}
        </div>
      </div>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Imprimir Tarjetas</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #1e293b; padding: 0; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; padding: 5mm; }
  .card { break-inside: avoid; border: 1px solid #cbd5e1; border-radius: 3mm; overflow: hidden; display: flex; flex-direction: column; min-height: 70mm; }
  .bar { height: 3mm; flex-shrink: 0; }
  .bar.slate { background: #94a3b8; }
  .bar.red { background: #ef4444; }
  .bar.orange { background: #f97316; }
  .bar.yellow { background: #eab308; }
  .bar.green { background: #10b981; }
  .bar.blue { background: #3b82f6; }
  .bar.purple { background: #a855f7; }
  .card-body { padding: 3mm; flex: 1; display: flex; flex-direction: column; gap: 2mm; }
  .title { font-size: 10pt; font-weight: 700; color: #1e293b; line-height: 1.2; }
  .preview { font-size: 8pt; color: #475569; line-height: 1.3; flex: 1; }
  .chips { display: flex; flex-wrap: wrap; gap: 1mm; }
  .chip { font-size: 6.5pt; padding: 0.5mm 1.5mm; border-radius: 1mm; }
  .chip.char { background: #dbeafe; color: #1d4ed8; }
  .chip.tag { background: #f1f5f9; color: #475569; border: 0.5px solid #cbd5e1; }
  @page { size: A4; margin: 5mm; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style></head>
<body><div class="grid">${cardsHtml}</div></body>
</html>`;
  }, [project, tags]);

  const escapeHtml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const handlePrint = useCallback(() => {
    const html = buildPrintHtml();
    const iframe = iframeRef.current;
    if (!iframe) return;

    iframe.srcdoc = html;
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    };
  }, [buildPrintHtml]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700/60 rounded-2xl shadow-2xl w-[640px] max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700/40 shrink-0">
          <h2 className="text-sm font-semibold text-slate-100">{t('printableCards.title')}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-xs">
            ESC
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <p className="text-xs text-slate-500 mb-3">{t('printableCards.description')} ({project.canvas.nodes.length} {t('printableCards.cards')})</p>
          <div className="grid grid-cols-3 gap-2">
            {project.canvas.nodes.map((node: INode) => {
              const title = stripHtml(node.data.title) || 'Sin título';
              const content = stripHtml(node.data.content).slice(0, 120);
              const charNames = (node.data.characterTags || [])
                .map((id: string) => project.characters.find((c: ICharacter) => c.id === id)?.name)
                .filter((v): v is string => !!v);
              const tagLabels = (node.data.categoryTags || [])
                .map((id: string) => tags.find((t) => t.tagId === id)?.label)
                .filter((v): v is string => !!v);

              return (
                <div key={node.id} className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden flex flex-col min-h-[120px]">
                  <div className={`h-1 shrink-0 ${
                    node.data.color === 'red' ? 'bg-red-500' :
                    node.data.color === 'orange' ? 'bg-orange-500' :
                    node.data.color === 'yellow' ? 'bg-yellow-500' :
                    node.data.color === 'green' ? 'bg-emerald-500' :
                    node.data.color === 'blue' ? 'bg-blue-500' :
                    node.data.color === 'purple' ? 'bg-purple-500' :
                    'bg-slate-500'
                  }`} />
                  <div className="p-2 flex flex-col gap-1 flex-1">
                    <p className="text-[10px] font-bold text-slate-200 leading-tight line-clamp-2">{title}</p>
                    {content && <p className="text-[9px] text-slate-400 leading-relaxed line-clamp-3 flex-1">{content}</p>}
                    {charNames.length > 0 && (
                      <div className="flex flex-wrap gap-0.5">
                        {charNames.map((name: string) => (
                          <span key={name} className="text-[7px] text-blue-300 bg-blue-900/30 px-1 py-0.5 rounded border border-blue-500/20">{name}</span>
                        ))}
                      </div>
                    )}
                    {tagLabels.length > 0 && (
                      <div className="flex flex-wrap gap-0.5">
                        {tagLabels.map((label: string) => {
                          const tag = tags.find((t) => t.label === label);
                          return (
                            <span key={label} className="text-[7px] px-1 py-0.5 rounded border" style={tag ? { color: tag.color, borderColor: `${tag.color}40`, backgroundColor: `${tag.color}20` } : { color: '#64748b', borderColor: '#64748b40', backgroundColor: '#64748b20' }}>
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-700/40 shrink-0">
          <iframe ref={iframeRef} style={{ display: 'none' }} title="print-frame" />
          <button
            onClick={onClose}
            className="text-xs px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {t('printableCards.close')}
          </button>
          <button
            onClick={handlePrint}
            className="text-xs px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            🖨️ {t('printableCards.print')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintableCardsModal;
