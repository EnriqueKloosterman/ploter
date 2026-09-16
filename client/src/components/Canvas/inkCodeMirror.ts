import { StreamLanguage, HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView, Decoration } from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';
import { StateEffect, StateField } from '@codemirror/state';
import { linter } from '@codemirror/lint';
import type { Diagnostic } from '@codemirror/lint';
import type { CompletionSource } from '@codemirror/autocomplete';
import { tags as t } from '@lezer/highlight';
import {
  compileInk,
  extractKnotNames,
  extractVarNames,
  findBrokenDiverts,
  fragmentForLine,
  parseErrorLine,
} from '../../lib/ink';
import type { InkFragment } from '../../lib/ink';

interface InkState {
  inBlockComment: boolean;
}

export const inkLanguage = StreamLanguage.define({
  name: 'ink',
  startState(): InkState {
    return { inBlockComment: false };
  },
  token(stream, state) {
    if (state.inBlockComment) {
      while (!stream.eol()) {
        if (stream.match('*/')) {
          state.inBlockComment = false;
          break;
        }
        stream.next();
      }
      return 'comment';
    }
    if (stream.sol()) {
      if (stream.match(/^\s*\/\//)) {
        stream.skipToEnd();
        return 'comment';
      }
      if (stream.match(/^\s*\/\*/)) {
        state.inBlockComment = true;
        return 'comment';
      }
      if (stream.match(/^\s*={2,}/)) {
        stream.skipToEnd();
        return 'heading';
      }
      if (stream.match(/^\s*[*+]/)) return 'strong';
      if (stream.match(/^\s*-{2,}\s/)) return 'emphasis';
      if (stream.match(/^\s*(VAR|CONST|DEFAULT|LIST|INCLUDE|EXTERNAL)\b/)) return 'keyword';
      if (stream.match(/^\s*~/)) return 'keyword';
    }
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'comment';
    }
    if (stream.match('/*')) {
      state.inBlockComment = true;
      return 'comment';
    }
    if (stream.match('->')) return 'operator';
    if (stream.match('<>')) return 'atom';
    if (stream.match(/[{}]/)) return 'operator';
    if (stream.match(/^#/)) {
      stream.skipToEnd();
      return 'meta';
    }
    if (stream.match(/\b(END|DONE|TODO)\b/)) return 'atom';
    stream.next();
    return null;
  },
});

export const inkHighlightStyle = HighlightStyle.define([
  { tag: t.heading, color: '#fcd34d', fontWeight: '700', backgroundColor: 'rgba(251,191,36,0.07)', borderRadius: '3px' },
  { tag: t.strong, color: '#34d399', fontWeight: '700' },
  { tag: t.emphasis, color: '#22d3ee', fontStyle: 'italic' },
  { tag: t.keyword, color: '#c084fc' },
  { tag: t.operator, color: '#22d3ee', fontStyle: 'italic' },
  { tag: t.atom, color: '#f472b6' },
  { tag: t.meta, color: '#64748b', fontStyle: 'italic' },
  { tag: t.comment, color: '#52637a', fontStyle: 'italic' },
]);

export const inkSyntaxHighlighting = syntaxHighlighting(inkHighlightStyle);

export interface InkEditorContext {
  fullMode: boolean;
  fullSource: string;
  fragments: InkFragment[];
  selectedNodeId: string | null;
}

const crossNodeKnotMessage = (message: string): string | null => {
  const m = message.match(/knot name\s+'([^']+)'/i);
  return m ? m[1] : null;
};

export const createInkLinter = (getContext: () => InkEditorContext) =>
  linter((view) => {
    const docText = view.state.doc.toString();
    if (!docText.trim()) return [];
    const ctx = getContext();
    const source = ctx.fullMode ? ctx.fullSource : docText;
    if (!source.trim()) return [];
    const result = compileInk(source);
    const projectNames = new Set([...extractKnotNames(ctx.fullSource), ...extractVarNames(ctx.fullSource)]);
    const diags: Diagnostic[] = [];
    const totalLines = view.state.doc.lines;

    const pushDiag = (message: string, severity: 'error' | 'warning', globalLine: number | null) => {
      let localLine = globalLine;
      if (ctx.fullMode && globalLine !== null && globalLine >= 1) {
        const frag = fragmentForLine(ctx.fragments, globalLine);
        if (!frag || frag.nodeId !== ctx.selectedNodeId) return;
        localLine = globalLine - frag.startLine + 1;
      }
      if (localLine === null || localLine < 1 || localLine > totalLines) return;
      const lineInfo = view.state.doc.line(localLine);
      const from = lineInfo.from + Math.min(lineInfo.text.length, lineInfo.text.trimStart().length);
      const to = Math.min(Math.max(lineInfo.to, from + 1), view.state.doc.length);
      diags.push({ from, to, severity, message });
    };

    for (const d of result.diagnostics) {
      const knotName = crossNodeKnotMessage(d.message);
      if (!ctx.fullMode && knotName && projectNames.has(knotName)) continue;
      pushDiag(d.message, d.severity === 'error' ? 'error' : 'warning', parseErrorLine(d.message));
    }

    for (const bd of findBrokenDiverts(source)) {
      if (projectNames.has(bd.name)) continue;
      pushDiag(`Divert a destino inexistente: '${bd.name}'`, 'warning', bd.line);
    }

    return diags;
  }, { delay: 500 });

export const createInkCompletions = (getContext: () => InkEditorContext): CompletionSource =>
  (context) => {
    const ctx = getContext();
    const line = context.state.doc.lineAt(context.pos);
    const before = line.text.slice(0, context.pos - line.from);
    const divertMatch = before.match(/->\s*([A-Za-z0-9_]*)$/);
    if (divertMatch) {
      const labels = new Set<string>([
        ...extractKnotNames(ctx.fullSource),
        ...extractKnotNames(context.state.doc.toString()),
        'END',
        'DONE',
      ]);
      return {
        from: context.pos - divertMatch[1].length,
        options: [...labels].map((label) => ({ label, type: 'keyword' })),
        validFor: /^[A-Za-z0-9_.]*$/,
      };
    }
    const braceMatch = before.match(/\{\s*([A-Za-z0-9_]*)$/);
    if (braceMatch) {
      const vars = extractVarNames(ctx.fullSource);
      if (vars.length === 0) return null;
      return {
        from: context.pos - braceMatch[1].length,
        options: vars.map((label) => ({ label, type: 'variable' })),
        validFor: /^[A-Za-z0-9_]*$/,
      };
    }
    return null;
  };

export const setInkCurrentKnot = StateEffect.define<number | null>();

export const inkCurrentKnotExtension = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(value, tr) {
    let next = value.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(setInkCurrentKnot)) {
        next =
          effect.value === null
            ? Decoration.none
            : Decoration.set([
                Decoration.line({ class: 'cm-ink-current-knot' }).range(tr.state.doc.line(effect.value + 1).from),
              ]);
      }
    }
    return next;
  },
  provide: (field) => EditorView.decorations.from(field),
});

export const inkEditorTheme = EditorView.theme({
  '&': { height: '100%', fontSize: '13px', backgroundColor: 'transparent' },
  '.cm-scroller': {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    overflowY: 'auto',
    lineHeight: '1.7',
  },
  '.cm-gutters': { backgroundColor: 'transparent', border: 'none', color: '#475569' },
  '.cm-activeLine': { backgroundColor: 'rgba(30, 41, 59, 0.5)' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(30, 41, 59, 0.5)' },
  '.cm-content': { paddingBottom: '32px', caretColor: '#34d399' },
  '&.cm-focused': { outline: 'none' },
  '.cm-line.cm-ink-current-knot': {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    boxShadow: 'inset 2px 0 0 #34d399',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul': {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: '12px',
    maxHeight: '180px',
  },
  '.cm-diagnostic': { padding: '4px 8px' },
});
