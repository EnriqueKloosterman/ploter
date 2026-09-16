import { describe, it, expect } from 'vitest';
import {
  hasInkContent,
  orderNodesForStory,
  assembleInkSource,
  sanitizeKnotName,
  inkTemplateForNode,
  compileInk,
  extractKnotNames,
  extractVarNames,
  findBrokenDiverts,
} from '../src/lib/ink';
import type { IChapter, INode } from '../src/context/projectTypes';

const makeNode = (id: string, chapterId?: string, inkContent?: string): INode => ({
  id,
  type: 'plot_card',
  position: { x: 0, y: 0 },
  data: { title: id, ...(chapterId ? { chapterId } : {}), ...(inkContent !== undefined ? { inkContent } : {}) },
});

const chapters: IChapter[] = [
  { chapterId: 'ch1', beats: [] },
  { chapterId: 'ch2', beats: [] },
];

describe('hasInkContent', () => {
  it('returns true only for nodes with non-empty inkContent', () => {
    expect(hasInkContent(makeNode('a', undefined, '== k =='))).toBe(true);
    expect(hasInkContent(makeNode('a', undefined, '   '))).toBe(false);
    expect(hasInkContent(makeNode('a'))).toBe(false);
  });
});

describe('orderNodesForStory', () => {
  it('sorts nodes by chapter order and puts unassigned last', () => {
    const nodes = [
      makeNode('unassigned'),
      makeNode('b', 'ch2'),
      makeNode('a', 'ch1'),
      makeNode('c', 'ch1'),
    ];
    const ordered = orderNodesForStory(nodes, chapters);
    expect(ordered.map((n) => n.id)).toEqual(['a', 'c', 'b', 'unassigned']);
  });

  it('does not mutate the input array', () => {
    const nodes = [makeNode('b', 'ch2'), makeNode('a', 'ch1')];
    orderNodesForStory(nodes, chapters);
    expect(nodes.map((n) => n.id)).toEqual(['b', 'a']);
  });
});

describe('assembleInkSource', () => {
  it('joins fragments in story order separated by blank lines', () => {
    const nodes = [makeNode('a', 'ch1', 'uno'), makeNode('b', 'ch2', 'dos')];
    expect(assembleInkSource(nodes, chapters)).toBe('uno\n\ndos');
  });

  it('skips nodes without ink content', () => {
    const nodes = [makeNode('a', 'ch1', 'uno'), makeNode('empty', 'ch1', ''), makeNode('b', 'ch2')];
    expect(assembleInkSource(nodes, chapters)).toBe('uno');
  });

  it('returns empty string when no node has content', () => {
    expect(assembleInkSource([makeNode('a')], chapters)).toBe('');
  });
});

describe('sanitizeKnotName', () => {
  it('strips accents and replaces invalid chars', () => {
    expect(sanitizeKnotName('El Descubrimiento!')).toBe('el_descubrimiento');
    expect(sanitizeKnotName('Cámara Oscura')).toBe('camara_oscura');
  });

  it('returns empty string for symbol-only titles', () => {
    expect(sanitizeKnotName('!!!')).toBe('');
  });
});

describe('inkTemplateForNode', () => {
  it('includes a knot declaration derived from the title', () => {
    const template = inkTemplateForNode('node_123', 'El Descubrimiento');
    expect(template).toContain('== k_el_descubrimiento ==');
    expect(template).toContain('* [Continuar]');
    expect(template).toContain('-> END');
  });

  it('falls back to node id when title is empty or symbolic', () => {
    const template = inkTemplateForNode('node_456', '!!!');
    expect(template).toContain('== k_node_456 ==');
  });
});

describe('compileInk', () => {
  it('returns ok false with no diagnostics for empty source', () => {
    const result = compileInk('   ');
    expect(result.ok).toBe(false);
    expect(result.story).toBeNull();
    expect(result.diagnostics).toEqual([]);
  });

  it('compiles a valid minimal story', () => {
    const result = compileInk('Hola mundo\n-> END');
    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(result.story).not.toBeNull();
    expect(result.story?.canContinue).toBe(true);
  });

  it('reports errors for an invalid divert target', () => {
    const result = compileInk('Texto\n-> knot_inexistente');
    expect(result.ok).toBe(false);
    expect(result.story).toBeNull();
    expect(result.diagnostics.some((d) => d.severity === 'error')).toBe(true);
  });

  it('reports errors for an invalid variable declaration', () => {
    const result = compileInk('VAR = 5');
    expect(result.ok).toBe(false);
    expect(result.story).toBeNull();
    expect(result.diagnostics.some((d) => d.severity === 'error' && d.message.includes('variable'))).toBe(true);
  });
});

describe('extractKnotNames', () => {
  it('finds knots and stitches, deduplicated', () => {
    const source = '== salon ==\ntexto\n= puerta\nmas\n== salon ==\n== vacio ==\n';
    expect(extractKnotNames(source)).toEqual(['salon', 'puerta', 'vacio']);
  });

  it('ignores headings with content after the name or inline equals', () => {
    const source = '== roto con espacios ==\n{cond == true}\n==\n';
    expect(extractKnotNames(source)).toEqual([]);
  });

  it('returns empty for source without knots', () => {
    expect(extractKnotNames('Solo texto\n-> END')).toEqual([]);
  });
});

describe('extractVarNames', () => {
  it('finds VAR, CONST, DEFAULT and LIST declarations', () => {
    const source = 'VAR oro = 10\nCONST LIMITE = 5\nDEFAULT estado = 0\nLIST armas = (espada)\n~ x = 1';
    expect(extractVarNames(source)).toEqual(['oro', 'LIMITE', 'estado', 'armas']);
  });

  it('does not match declarations mid-line or in comments', () => {
    const source = '// VAR falso = 1\n~ VAR medio = 2';
    expect(extractVarNames(source)).toEqual([]);
  });
});

describe('findBrokenDiverts', () => {
  it('returns empty when all diverts resolve', () => {
    const source = '== a ==\n-> b\n== b ==\n-> END';
    expect(findBrokenDiverts(source)).toEqual([]);
  });

  it('detects unknown targets with their line number', () => {
    const source = '== a ==\n-> b\n-> fantasma\n== b ==';
    const broken = findBrokenDiverts(source);
    expect(broken).toEqual([{ name: 'fantasma', line: 3 }]);
  });

  it('excludes END/DONE/TODO and declared variables', () => {
    const source = 'VAR destino = "a"\n-> END\n-> DONE\n-> TODO\n-> destino\n-> desconocido';
    const broken = findBrokenDiverts(source);
    expect(broken).toEqual([{ name: 'desconocido', line: 6 }]);
  });

  it('ignores diverts inside comments', () => {
    const source = '== a ==\n// -> fantasma\n/* multi\n-> otro_fantasma */\n-> END';
    expect(findBrokenDiverts(source)).toEqual([]);
  });

  it('ignores dynamic targets in braces', () => {
    const source = 'VAR siguiente = "b"\n-> {siguiente}';
    expect(findBrokenDiverts(source)).toEqual([]);
  });

  it('returns empty for empty source', () => {
    expect(findBrokenDiverts('   ')).toEqual([]);
  });
});
