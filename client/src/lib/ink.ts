import { Compiler } from 'inkjs/full';
import type { Story } from 'inkjs/full';
import type { IChapter, INode } from '../context/projectTypes';

export interface InkDiagnostic {
  severity: 'error' | 'warning';
  message: string;
}

export interface InkCompileResult {
  ok: boolean;
  diagnostics: InkDiagnostic[];
  story: Story | null;
}

export const hasInkContent = (node: INode): boolean =>
  typeof node.data?.inkContent === 'string' && node.data.inkContent.trim().length > 0;

export const countWords = (text: string | undefined): number =>
  text ? (text.match(/\S+/g) ?? []).length : 0;

export const extractKnotNames = (source: string): string[] => {
  const names = new Set<string>();
  for (const line of source.split('\n')) {
    const m = line.match(/^\s*={1,3}\s+([A-Za-z0-9_]+)\s*=*\s*$/);
    if (m) names.add(m[1]);
  }
  return [...names];
};

export const extractVarNames = (source: string): string[] => {
  const names = new Set<string>();
  for (const line of source.split('\n')) {
    const m = line.match(/^\s*(?:VAR|CONST|DEFAULT|LIST)\s+([A-Za-z0-9_]+)/);
    if (m) names.add(m[1]);
  }
  return [...names];
};

export interface BrokenDivert {
  name: string;
  line: number;
}

const SPECIAL_DIVERTS = new Set(['END', 'DONE', 'TODO']);

export const findBrokenDiverts = (source: string): BrokenDivert[] => {
  if (!source.trim()) return [];
  const stripped = source.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  const definedKnots = new Set(extractKnotNames(stripped));
  const declaredVars = new Set(extractVarNames(stripped));
  const broken: BrokenDivert[] = [];
  const seen = new Set<string>();
  stripped.split('\n').forEach((lineText, idx) => {
    const clean = lineText.replace(/\/\/.*$/, '');
    const re = /->+\s*([A-Za-z0-9_]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(clean)) !== null) {
      const name = m[1];
      if (!name || SPECIAL_DIVERTS.has(name)) continue;
      if (definedKnots.has(name) || declaredVars.has(name)) continue;
      const key = `${idx}:${name}`;
      if (!seen.has(key)) {
        seen.add(key);
        broken.push({ name, line: idx + 1 });
      }
    }
  });
  return broken;
};

export const orderNodesForStory = (nodes: INode[], chapters: IChapter[]): INode[] => {
  const chapterOrder = new Map(chapters.map((ch, i) => [ch.chapterId, i]));
  return [...nodes].sort((a, b) => {
    const aIdx = chapterOrder.get(a.data?.chapterId || '');
    const bIdx = chapterOrder.get(b.data?.chapterId || '');
    if (aIdx === undefined && bIdx === undefined) return 0;
    if (aIdx === undefined) return 1;
    if (bIdx === undefined) return -1;
    return aIdx - bIdx;
  });
};

export const assembleInkSource = (nodes: INode[], chapters: IChapter[]): string => {
  const fragments = orderNodesForStory(nodes, chapters)
    .filter(hasInkContent)
    .map((node) => (node.data.inkContent as string).trim());
  return fragments.join('\n\n');
};

export interface InkFragment {
  nodeId: string;
  nodeTitle: string;
  startLine: number;
  endLine: number;
}

export interface AssembledStory {
  source: string;
  fragments: InkFragment[];
}

export const assembleInkStory = (nodes: INode[], chapters: IChapter[]): AssembledStory => {
  const parts: string[] = [];
  const fragments: InkFragment[] = [];
  let line = 1;
  for (const node of orderNodesForStory(nodes, chapters)) {
    if (!hasInkContent(node)) continue;
    const text = (node.data.inkContent as string).trim();
    parts.push(text);
    const lineCount = text.split('\n').length;
    fragments.push({
      nodeId: node.id,
      nodeTitle: node.data.title || node.id,
      startLine: line,
      endLine: line + lineCount - 1,
    });
    line += lineCount + 1;
  }
  return { source: parts.join('\n\n'), fragments };
};

export const fragmentForLine = (fragments: InkFragment[], line: number): InkFragment | null =>
  fragments.find((f) => line >= f.startLine && line <= f.endLine) ?? null;

export const parseErrorLine = (message: string): number | null => {
  const match = message.match(/line (\d+)/i);
  return match ? parseInt(match[1], 10) : null;
};

export const sanitizeKnotName = (title: string): string =>
  title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

export const inkTemplateForNode = (nodeId: string, title?: string): string => {
  const base = sanitizeKnotName(title || '') || nodeId.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const heading = title || nodeId;
  return [
    '// Ink: == knot == define una seccion',
    '// * [Opcion] crea una eleccion, -> divierte a otro knot',
    `== k_${base} ==`,
    `${heading}.`,
    '',
    '* [Continuar]',
    '  -> END',
  ].join('\n');
};

export const compileInk = (source: string): InkCompileResult => {
  if (!source.trim()) {
    return { ok: false, diagnostics: [], story: null };
  }
  let compiler: Compiler | null = null;
  try {
    compiler = new Compiler(source);
    const story = compiler.Compile();
    const diagnostics: InkDiagnostic[] = [
      ...compiler.errors.map((message) => ({ severity: 'error' as const, message })),
      ...compiler.warnings.map((message) => ({ severity: 'warning' as const, message })),
    ];
    if (compiler.errors.length > 0) {
      return { ok: false, diagnostics, story: null };
    }
    return { ok: true, diagnostics, story };
  } catch (err) {
    const diagnostics: InkDiagnostic[] = (compiler?.errors ?? []).map(
      (message) => ({ severity: 'error' as const, message })
    );
    if (diagnostics.length === 0) {
      const message = err instanceof Error ? err.message : String(err);
      diagnostics.push({ severity: 'error', message });
    }
    return { ok: false, diagnostics, story: null };
  }
};
