import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { basicSetup } from 'codemirror';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { autocompletion } from '@codemirror/autocomplete';
import type { Story } from 'inkjs/full';
import { useProject } from '../../context/useProject';
import type { INode } from '../../context/projectTypes';
import { MessageSquare } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import {
  assembleInkStory,
  compileInk,
  countWords,
  extractVarNames,
  findBrokenDiverts,
  fragmentForLine,
  hasInkContent,
  inkTemplateForNode,
  orderNodesForStory,
  parseErrorLine,
} from '../../lib/ink';
import type { InkDiagnostic, InkFragment } from '../../lib/ink';
import type { InkNodeStatus } from './inkStatusContext';
import {
  createInkCompletions,
  createInkLinter,
  inkCurrentKnotExtension,
  inkEditorTheme,
  inkLanguage,
  inkSyntaxHighlighting,
  setInkCurrentKnot,
} from './inkCodeMirror';
import type { InkEditorContext } from './inkCodeMirror';

interface PlayerItem {
  type: 'text' | 'choice' | 'end';
  value?: string;
}

interface PlayerChoice {
  index: number;
  text: string;
}

interface VarRow {
  name: string;
  value: string;
}

const continueStoryInto = (story: Story, next: PlayerItem[]): boolean => {
  try {
    while (story.canContinue) {
      const text = story.Continue();
      if (text && text.trim()) next.push({ type: 'text', value: text.trim() });
    }
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    next.push({ type: 'text', value: `[error runtime] ${message}` });
    return false;
  }
};

interface InkStudioViewProps {
  initialNodeId?: string | null;
  onStatusMap?: (status: Record<string, InkNodeStatus>) => void;
  onClose?: () => void;
}

const InkStudioView: React.FC<InkStudioViewProps> = ({ initialNodeId, onStatusMap, onClose }) => {
  const { t } = useTranslation();
  const { project, updateNodes } = useProject();
  const nodes = project.canvas.nodes;
  const chapters = project.chapterManager.chapters;

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialNodeId ?? null);
  const [mode, setMode] = useState<'full' | 'node'>('full');
  const [diagnostics, setDiagnostics] = useState<InkDiagnostic[]>([]);
  const [compileOk, setCompileOk] = useState<boolean | null>(null);
  const [items, setItems] = useState<PlayerItem[]>([]);
  const [choices, setChoices] = useState<PlayerChoice[]>([]);
  const [fragments, setFragments] = useState<InkFragment[]>([]);
  const [hasStory, setHasStory] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [compileDirty, setCompileDirty] = useState(false);
  const [nodeStatus, setNodeStatus] = useState<Record<string, InkNodeStatus>>({});
  const [chosenPath, setChosenPath] = useState<number[]>([]);
  const [fadeFrom, setFadeFrom] = useState(0);
  const [showVars, setShowVars] = useState(false);
  const [varRows, setVarRows] = useState<VarRow[]>([]);  const projectRef = useRef(project);
  const nodesRef = useRef(nodes);
  const selectedNodeRef = useRef<INode | null>(null);
  const storyRef = useRef<Story | null>(null);
  const editorRef = useRef<EditorView | null>(null);
  const editorHostRef = useRef<HTMLDivElement | null>(null);
  const pendingSaveRef = useRef<{ nodeId: string; text: string } | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const savedTimerRef = useRef<number | null>(null);
  const compileAndPlayRef = useRef<() => void>(() => {});

  useEffect(() => {
    projectRef.current = project;
    nodesRef.current = nodes;
  });

  const effectiveSelectedId = useMemo(() => {
    if (selectedNodeId && nodes.some((n) => n.id === selectedNodeId)) return selectedNodeId;
    return nodes[0]?.id ?? null;
  }, [nodes, selectedNodeId]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === effectiveSelectedId) ?? null,
    [nodes, effectiveSelectedId]
  );

  useEffect(() => {
    selectedNodeRef.current = selectedNode;
  }, [selectedNode]);

  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const getEditorContext = useCallback((): InkEditorContext => {
    const assembled = assembleInkStory(
      projectRef.current.canvas.nodes,
      projectRef.current.chapterManager.chapters
    );
    return {
      fullMode: modeRef.current === 'full',
      fullSource: assembled.source,
      fragments: assembled.fragments,
      selectedNodeId: selectedNodeRef.current?.id ?? null,
    };
  }, []);

  const dispatchKnotHighlight = useCallback(() => {
    const view = editorRef.current;
    if (!view) return;
    const doc = view.state.doc;
    let lineIdx: number | null = null;
    for (let i = 1; i <= doc.lines; i++) {
      if (/^\s*={2,}/.test(doc.line(i).text)) {
        lineIdx = i - 1;
        break;
      }
    }
    view.dispatch({ effects: setInkCurrentKnot.of(lineIdx) });
  }, []);

  const orderedNodes = useMemo(() => orderNodesForStory(nodes, chapters), [nodes, chapters]);

  const groupedByChapter = useMemo(() => {
    const map = new Map<string, INode[]>();
    const unassigned: INode[] = [];
    for (const node of orderedNodes) {
      const cid = node.data.chapterId;
      if (cid) {
        const list = map.get(cid);
        if (list) list.push(node);
        else map.set(cid, [node]);
      } else {
        unassigned.push(node);
      }
    }
    return { map, unassigned };
  }, [orderedNodes]);

  const saveInkContent = useCallback(
    (nodeId: string, text: string) => {
      const current = projectRef.current;
      const updated = current.canvas.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, inkContent: text } } : n
      );
      updateNodes(updated);
    },
    [updateNodes]
  );

  const markSaved = useCallback(() => {
    if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current);
    setSaveState('saved');
    savedTimerRef.current = window.setTimeout(() => {
      savedTimerRef.current = null;
      setSaveState('idle');
    }, 2000);
  }, []);

  const flushPendingSave = useCallback(() => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const pending = pendingSaveRef.current;
    if (pending) {
      pendingSaveRef.current = null;
      saveInkContent(pending.nodeId, pending.text);
      markSaved();
    }
  }, [saveInkContent, markSaved]);

  const collectVarNames = useCallback((): string[] => {
    const source =
      modeRef.current === 'full'
        ? assembleInkStory(projectRef.current.canvas.nodes, projectRef.current.chapterManager.chapters).source
        : selectedNodeRef.current?.data.inkContent ?? '';
    return extractVarNames(source);
  }, []);

  const updateVarValues = useCallback(
    (story: Story) => {
      const rows = collectVarNames().map((name): VarRow => {
        let value = '?';
        try {
          const raw = (story.variablesState as unknown as Record<string, unknown>)[name];
          if (raw !== null && raw !== undefined) value = String(raw);
        } catch {
          value = '?';
        }
        return { name, value };
      });
      setVarRows(rows);
    },
    [collectVarNames]
  );

  const playFromStart = useCallback(
    (story: Story, path: number[]) => {
      storyRef.current = story;
      setHasStory(true);
      const next: PlayerItem[] = [];
      story.ResetState();
      let ok = continueStoryInto(story, next);
      const remaining = [...path];
      let guard = 0;
      while (ok && remaining.length > 0 && guard < 500) {
        guard += 1;
        const idx = remaining.shift() as number;
        const choiceObj = story.currentChoices.find((c) => c.index === idx);
        if (!choiceObj) break;
        next.push({ type: 'choice', value: choiceObj.text });
        try {
          story.ChooseChoiceIndex(idx);
        } catch {
          break;
        }
        ok = continueStoryInto(story, next);
      }
      const cs = story.currentChoices.map((c) => ({ index: c.index, text: c.text }));
      setChosenPath([...path]);
      setChoices(cs);
      if (cs.length === 0 && !story.canContinue) next.push({ type: 'end' });
      setFadeFrom(next.length);
      setItems(next);
      updateVarValues(story);
    },
    [updateVarValues]
  );

  const compileAndPlay = useCallback(() => {
    let source = '';
    let nextFragments: InkFragment[] = [];
    if (mode === 'full') {
      const assembled = assembleInkStory(
        projectRef.current.canvas.nodes,
        projectRef.current.chapterManager.chapters
      );
      source = assembled.source;
      nextFragments = assembled.fragments;
    } else if (selectedNodeRef.current) {
      source = selectedNodeRef.current.data.inkContent ?? '';
    }
    const result = compileInk(source);
    const divertWarnings: InkDiagnostic[] = findBrokenDiverts(source).map((b) => ({
      severity: 'warning' as const,
      message: `Posible divert roto: '${b.name}' (line ${b.line})`,
    }));
    const allDiagnostics = [...result.diagnostics, ...divertWarnings];
    setFragments(nextFragments);
    setDiagnostics(allDiagnostics);
    setCompileOk(result.ok);
    setCompileDirty(false);
    if (mode === 'full') {
      const status: Record<string, InkNodeStatus> = {};
      for (const n of projectRef.current.canvas.nodes) {
        if (hasInkContent(n)) status[n.id] = 'ok';
      }
      for (const d of allDiagnostics) {
        const line = parseErrorLine(d.message);
        const frag = line === null ? null : fragmentForLine(nextFragments, line);
        if (!frag) continue;
        if (d.severity === 'error') status[frag.nodeId] = 'error';
        else if (status[frag.nodeId] !== 'error') status[frag.nodeId] = 'warning';
      }
      setNodeStatus(status);
      onStatusMap?.(status);
    }
    if (result.ok && result.story) {
      playFromStart(result.story, []);
    } else {
      storyRef.current = null;
      setHasStory(false);
      setItems([]);
      setChoices([]);
      setChosenPath([]);
      setVarRows([]);
    }
  }, [mode, playFromStart, onStatusMap]);

  useEffect(() => {
    compileAndPlayRef.current = compileAndPlay;
  }, [compileAndPlay]);

  useEffect(() => {
    const id = window.setTimeout(() => compileAndPlay(), 0);
    return () => window.clearTimeout(id);
  }, [mode, compileAndPlay]);

  useEffect(() => {
    if (!editorHostRef.current) return;
    const view = new EditorView({
      parent: editorHostRef.current,
      state: EditorState.create({
        doc: '',
        extensions: [
          basicSetup,
          inkLanguage,
          inkSyntaxHighlighting,
          inkEditorTheme,
          inkCurrentKnotExtension,
          createInkLinter(getEditorContext),
          autocompletion({ override: [createInkCompletions(getEditorContext)] }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged && selectedNodeRef.current) {
              dispatchKnotHighlight();
              const nodeId = selectedNodeRef.current.id;
              const text = update.state.doc.toString();
              pendingSaveRef.current = { nodeId, text };
              setSaveState('saving');
              setCompileDirty(true);
              if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
              saveTimerRef.current = window.setTimeout(() => {
                saveTimerRef.current = null;
                flushPendingSave();
                compileAndPlayRef.current();
              }, 900);
            }
          }),
        ],
      }),
    });
    editorRef.current = view;
    return () => {
      view.destroy();
      editorRef.current = null;
    };
  }, [flushPendingSave, getEditorContext, dispatchKnotHighlight]);

  useEffect(() => {
    const view = editorRef.current;
    if (!view) return;
    if (!effectiveSelectedId) {
      if (view.state.doc.length > 0) {
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: '' } });
      }
      return;
    }
    const node = nodesRef.current.find((n) => n.id === effectiveSelectedId);
    const incoming = node?.data.inkContent ?? '';
    const pending = pendingSaveRef.current;
    if (pending && pending.nodeId === effectiveSelectedId) {
      if (pending.text === incoming) return;
      pendingSaveRef.current = null;
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    }
    if (view.state.doc.toString() !== incoming) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: incoming } });
    }
  }, [effectiveSelectedId, nodes]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current);
      const pending = pendingSaveRef.current;
      if (pending) {
        const current = projectRef.current;
        const exists = current.canvas.nodes.some((n) => n.id === pending.nodeId);
        if (exists) saveInkContent(pending.nodeId, pending.text);
      }
    };
  }, [saveInkContent]);

  const handleSelectNode = useCallback(
    (nodeId: string) => {
      if (nodeId === effectiveSelectedId) return;
      flushPendingSave();
      setSelectedNodeId(nodeId);
    },
    [effectiveSelectedId, flushPendingSave]
  );

  const handleInsertTemplate = useCallback(() => {
    const view = editorRef.current;
    const node = selectedNodeRef.current;
    if (!view || !node) return;
    const template = inkTemplateForNode(node.id, node.data.title);
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: template } });
  }, []);

  const handleChoose = useCallback(
    (index: number) => {
      const story = storyRef.current;
      if (!story) return;
      const chosen = choices.find((c) => c.index === index);
      const base: PlayerItem[] = [...items];
      if (chosen) base.push({ type: 'choice', value: chosen.text });
      const fromIdx = base.length;
      try {
        story.ChooseChoiceIndex(index);
      } catch {
        return;
      }
      continueStoryInto(story, base);
      const cs = story.currentChoices.map((c) => ({ index: c.index, text: c.text }));
      if (cs.length === 0 && !story.canContinue) base.push({ type: 'end' });
      setItems(base);
      setFadeFrom(fromIdx);
      setChosenPath((prev) => [...prev, index]);
      setChoices(cs);
      updateVarValues(story);
    },
    [choices, items, updateVarValues]
  );

  const handleRestart = useCallback(() => {
    const story = storyRef.current;
    if (!story) return;
    playFromStart(story, []);
  }, [playFromStart]);

  const handleBack = useCallback(() => {
    const story = storyRef.current;
    if (!story || chosenPath.length === 0) return;
    playFromStart(story, chosenPath.slice(0, -1));
  }, [chosenPath, playFromStart]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        !!el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable);
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        flushPendingSave();
        compileAndPlayRef.current();
        return;
      }
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }
      if (!typing && /^[1-9]$/.test(e.key)) {
        const choice = choices[parseInt(e.key, 10) - 1];
        if (choice) handleChoose(choice.index);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [choices, handleChoose, onClose, flushPendingSave]);

  const jumpToFragmentNode = useCallback(
    (fragment: InkFragment) => {
      flushPendingSave();
      setSelectedNodeId(fragment.nodeId);
    },
    [flushPendingSave]
  );

  const wordCount = useMemo(() => {
    if (!selectedNode) return 0;
    const text = selectedNode.data.inkContent || '';
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  }, [selectedNode]);

  const nodesWithInk = useMemo(() => nodes.filter(hasInkContent).length, [nodes]);

  const renderNodeButton = (node: INode) => {
    const active = node.id === effectiveSelectedId;
    const hasScript = hasInkContent(node);
    const st = nodeStatus[node.id];
    const dotClass = !hasScript
      ? 'border border-slate-600'
      : st === 'error'
        ? 'bg-red-400'
        : st === 'warning'
          ? 'bg-amber-400'
          : 'bg-emerald-400';
    return (
      <button
        key={node.id}
        onClick={() => handleSelectNode(node.id)}
        className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors flex items-center gap-2 border-l-2 ${
          active
            ? 'bg-emerald-700/30 text-emerald-100 border-l-emerald-400'
            : 'hover:bg-slate-700/50 text-slate-300 border-l-transparent'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
        <span className="truncate flex-1">{node.data.title || node.id}</span>
        {hasScript && (
          <span className="ml-auto shrink-0 text-[10px] text-slate-500 tabular-nums">
            {countWords(node.data.inkContent)}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="h-full w-full bg-slate-900 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 border-b border-slate-700/50 shrink-0">
        <span className="text-xs font-medium text-emerald-300">Ink Studio</span>
        <span className="text-xs text-slate-600">|</span>
        <span className="text-xs text-slate-500">
          {nodesWithInk}/{nodes.length} {t('inkStudio.withScript')}
        </span>
        <div className="ml-auto flex gap-1 bg-slate-900/60 rounded-lg p-0.5 border border-slate-700/40">
          <button
            onClick={() => setMode('full')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              mode === 'full' ? 'bg-emerald-700/60 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('inkStudio.playFull')}
          </button>
          <button
            onClick={() => setMode('node')}
            disabled={!effectiveSelectedId}
            className={`px-3 py-1 text-xs rounded-md transition-colors disabled:opacity-40 ${
              mode === 'node' ? 'bg-emerald-700/60 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('inkStudio.playNode')}
          </button>
        </div>
        <button
          onClick={() => compileAndPlay()}
          className="relative px-3 py-1 text-xs bg-accent hover:bg-accent-strong text-white rounded-lg transition-colors"
        >
          {compileDirty && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-400" />
            </span>
          )}
          ▶ {t('inkStudio.test')}
        </button>
      </div>

      {nodes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState icon={MessageSquare} message={t('inkStudio.noNodes')} />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <aside className="w-56 shrink-0 border-r border-slate-700/40 bg-slate-900/60 overflow-y-auto p-2 space-y-3">
            {[...groupedByChapter.map.entries()].map(([chapterId, chNodes]) => (
              <div key={chapterId}>
                <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold truncate">
                  {chapterId}
                </div>
                <div className="space-y-0.5">{chNodes.map(renderNodeButton)}</div>
              </div>
            ))}
            {groupedByChapter.unassigned.length > 0 && (
              <div>
                <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  {t('inkStudio.unassigned')}
                </div>
                <div className="space-y-0.5">{groupedByChapter.unassigned.map(renderNodeButton)}</div>
              </div>
            )}
          </aside>

          <section className="flex-1 flex flex-col overflow-hidden min-w-0">
            <div className="flex items-center gap-2 px-4 py-1.5 border-b border-slate-700/30 bg-slate-800/20 shrink-0">
              <span className="text-xs font-semibold text-slate-200 truncate">
                {selectedNode?.data.title || t('inkStudio.selectNode')}
              </span>
              <span className="text-[10px] text-slate-500">{wordCount} palabras</span>
              <div className="ml-auto flex items-center gap-2 shrink-0">
                {saveState !== 'idle' && (
                  <span
                    className={`text-[10px] ${
                      saveState === 'saving' ? 'text-slate-500' : 'text-emerald-400'
                    }`}
                  >
                    {saveState === 'saving' ? t('inkStudio.saving') : `✓ ${t('inkStudio.saved')}`}
                  </span>
                )}
                {selectedNode && !hasInkContent(selectedNode) && (
                  <button
                    onClick={handleInsertTemplate}
                    className="px-2 py-0.5 text-[11px] bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md transition-colors"
                  >
                    {t('inkStudio.insertTemplate')}
                  </button>
                )}
              </div>
            </div>
            <div ref={editorHostRef} className="flex-1 overflow-hidden" />
            {(diagnostics.length > 0 || compileOk === false) && (
              <div className="max-h-36 overflow-y-auto border-t border-slate-700/40 bg-red-950/20 shrink-0">
                {diagnostics.length === 0 && (
                  <div className="px-4 py-2 text-xs text-red-300">{t('inkStudio.emptySource')}</div>
                )}
                {diagnostics.map((d, i) => {
                  const line = parseErrorLine(d.message);
                  const fragment =
                    mode === 'full' && line !== null
                      ? fragmentForLine(fragments, line)
                      : null;
                  return (
                    <div
                      key={i}
                      className={`px-4 py-1.5 text-xs flex items-start gap-2 ${
                        d.severity === 'error' ? 'text-red-300' : 'text-amber-300'
                      }`}
                    >
                      <span className="shrink-0 font-bold">{d.severity === 'error' ? '✕' : '⚠'}</span>
                      <span className="min-w-0 break-all">{d.message}</span>
                      {fragment && (
                        <button
                          onClick={() => jumpToFragmentNode(fragment)}
                          className="shrink-0 px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px]"
                          title={t('inkStudio.jumpToNode')}
                        >
                          {fragment.nodeTitle} →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {compileOk === true && diagnostics.length === 0 && (
              <div className="px-4 py-1.5 border-t border-slate-700/40 bg-emerald-950/20 text-xs text-emerald-400 shrink-0">
                ✓ {t('inkStudio.noErrors')}
              </div>
            )}
          </section>

          <aside className="w-80 shrink-0 border-l border-slate-700/40 bg-stone-900/70 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-700/30 shrink-0">
              <span className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                {t('inkStudio.player')}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={handleBack}
                  disabled={!hasStory || chosenPath.length === 0}
                  title={t('inkStudio.back')}
                  className="px-2 py-0.5 text-[11px] bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-300 rounded-md transition-colors"
                >
                  ← {t('inkStudio.back')}
                </button>
                <button
                  onClick={handleRestart}
                  disabled={!hasStory}
                  title={t('inkStudio.restart')}
                  className="px-2 py-0.5 text-[11px] bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-300 rounded-md transition-colors"
                >
                  ↺
                </button>
                <button
                  onClick={() => setShowVars((v) => !v)}
                  title={t('inkStudio.varsTitle')}
                  disabled={!hasStory}
                  className={`px-2 py-0.5 text-[11px] font-mono disabled:opacity-40 rounded-md transition-colors ${
                    showVars
                      ? 'bg-purple-900/60 text-purple-200'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                  }`}
                >
                  {'{ }'}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {items.length === 0 && (
                <p className="text-xs text-slate-600 italic">{t('inkStudio.playerEmpty')}</p>
              )}
              {items.map((item, i) => {
                const prev = i > 0 ? items[i - 1] : null;
                const fade = i >= fadeFrom ? 'ink-fade-in' : '';
                if (item.type === 'choice') {
                  return (
                    <div key={i} className={`text-[11px] italic text-emerald-500/80 flex items-start gap-1 ${fade}`}>
                      <span className="not-italic">✓</span> {item.value}
                    </div>
                  );
                }
                if (item.type === 'end') {
                  return (
                    <div key={i} className={`text-center text-[10px] uppercase tracking-widest text-slate-600 pt-2 ${fade}`}>
                      — {t('inkStudio.end')} —
                    </div>
                  );
                }
                return (
                  <React.Fragment key={i}>
                    {prev?.type === 'choice' && (
                      <div className="text-center text-[10px] text-stone-700 tracking-[0.5em] select-none pt-1">
                        ⁂
                      </div>
                    )}
                    <p
                      className={`font-serif text-[15px] leading-relaxed text-stone-200 whitespace-pre-wrap ${fade}`}
                    >
                      {item.value}
                    </p>
                  </React.Fragment>
                );
              })}
            </div>
            {showVars && (
              <div className="border-t border-slate-700/30 max-h-36 overflow-y-auto px-3 py-2 space-y-1 bg-stone-950/60 shrink-0 custom-scrollbar">
                {varRows.length === 0 ? (
                  <p className="text-[11px] italic text-stone-600">{t('inkStudio.noVars')}</p>
                ) : (
                  varRows.map((v) => (
                    <div key={v.name} className="flex justify-between gap-3 text-[11px]">
                      <span className="font-mono text-purple-300 shrink-0">{v.name}</span>
                      <span className="font-mono text-stone-300 truncate text-right">{v.value}</span>
                    </div>
                  ))
                )}
              </div>
            )}
            {choices.length > 0 && (
              <div className="border-t border-slate-700/30 p-3 space-y-2 shrink-0">
                {choices.map((c, i) => (
                  <button
                    key={c.index}
                    onClick={() => handleChoose(c.index)}
                    title={`${t('inkStudio.choiceKey')} ${i + 1}`}
                    className="group w-full text-left px-3 py-2.5 text-xs bg-stone-800 hover:bg-emerald-900/30 border border-stone-700 hover:border-emerald-600/50 text-stone-200 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span className="shrink-0 w-5 h-5 rounded border border-stone-600 group-hover:border-emerald-500 text-[10px] font-bold text-stone-400 group-hover:text-emerald-300 flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="flex-1">{c.text}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400">→</span>
                  </button>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};

export default InkStudioView;
