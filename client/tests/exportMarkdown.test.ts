import { describe, it, expect } from 'vitest';
import { htmlToMarkdown, generateProjectMarkdown } from '../src/components/ui/exportMarkdown';
import type { IProject } from '../src/context/projectTypes';

describe('htmlToMarkdown', () => {
  it('returns empty string for empty input', () => {
    expect(htmlToMarkdown('')).toBe('');
  });

  it('converts <strong> to **bold**', () => {
    expect(htmlToMarkdown('<strong>important</strong>')).toBe('**important**');
  });

  it('converts <em> to *italic*', () => {
    expect(htmlToMarkdown('<em>emphasized</em>')).toBe('*emphasized*');
  });

  it('converts <p> to newline-wrapped text', () => {
    const result = htmlToMarkdown('<p>Hello world</p>');
    expect(result).toBe('Hello world');
  });

  it('converts empty <p> to double newline', () => {
    expect(htmlToMarkdown('<p></p>')).toBe('');
  });

  it('converts <br> to newline', () => {
    expect(htmlToMarkdown('line1<br>line2')).toBe('line1\nline2');
  });

  it('converts <br/> to newline', () => {
    expect(htmlToMarkdown('line1<br/>line2')).toBe('line1\nline2');
  });

  it('strips unknown tags', () => {
    expect(htmlToMarkdown('<div>content</div>')).toBe('content');
  });

  it('handles mixed content', () => {
    const input = '<p>This is <strong>bold</strong> and <em>italic</em> text</p>';
    expect(htmlToMarkdown(input)).toBe('This is **bold** and *italic* text');
  });

  it('trims whitespace', () => {
    expect(htmlToMarkdown('  <p>hello</p>  ')).toBe('hello');
  });
});

describe('generateProjectMarkdown', () => {
  const baseProject: IProject = {
    _id: 'proj1',
    metadata: { title: 'Test Novel' },
    canvas: { nodes: [] },
    chapterManager: { chapters: [] },
  } as unknown as IProject;

  it('outputs project title as H1', () => {
    const result = generateProjectMarkdown(baseProject);
    expect(result).toMatch(/^# Test Novel/);
  });

  it('uses fallback title when missing', () => {
    const noTitle = { ...baseProject, metadata: {} } as unknown as IProject;
    const result = generateProjectMarkdown(noTitle);
    expect(result).toMatch(/^# Proyecto sin titulo/);
  });

  it('shows empty chapter message when no nodes assigned', () => {
    const project = {
      ...baseProject,
      chapterManager: { chapters: [{ chapterId: 'Capítulo 1' }] },
    } as unknown as IProject;
    const result = generateProjectMarkdown(project);
    expect(result).toContain('## Capítulo 1');
    expect(result).toContain('*Sin escenas asignadas a este capitulo.*');
  });

  it('renders nodes grouped by chapter', () => {
    const project = {
      _id: 'proj1',
      metadata: { title: 'Test' },
      canvas: {
        nodes: [
          { id: 'n1', data: { title: 'Scene 1', content: '<p>Content 1</p>', chapterId: 'Chapter 1' } },
        ],
      },
      chapterManager: { chapters: [{ chapterId: 'Chapter 1' }] },
    } as unknown as IProject;
    const result = generateProjectMarkdown(project);
    expect(result).toContain('## Chapter 1');
    expect(result).toContain('### Scene 1');
    expect(result).toContain('Content 1');
  });

  it('renders unassigned nodes under "Escenas sin asignar"', () => {
    const project = {
      _id: 'proj1',
      metadata: { title: 'Test' },
      canvas: {
        nodes: [
          { id: 'n1', data: { title: 'Orphan', content: '<p>Alone</p>' } },
        ],
      },
      chapterManager: { chapters: [] },
    } as unknown as IProject;
    const result = generateProjectMarkdown(project);
    expect(result).toContain('## Escenas sin asignar');
    expect(result).toContain('### Orphan');
    expect(result).toContain('Alone');
  });

  it('uses fallback for node without title', () => {
    const project = {
      _id: 'proj1',
      metadata: { title: 'Test' },
      canvas: {
        nodes: [
          { id: 'n1', data: { chapterId: 'Ch1' } },
        ],
      },
      chapterManager: { chapters: [{ chapterId: 'Ch1' }] },
    } as unknown as IProject;
    const result = generateProjectMarkdown(project);
    expect(result).toContain('### Escena sin titulo');
    expect(result).toContain('*Sin contenido.*');
  });

  it('handles project with no nodes and no chapters', () => {
    const result = generateProjectMarkdown(baseProject);
    expect(result).toContain('# Test Novel');
    expect(result).not.toContain('##');
  });
});
