import { describe, it, expect } from 'vitest';
import { stripHtml, compileManuscript } from '../src/controllers/export/index.js';

describe('stripHtml', () => {
  it('removes simple tags', () => {
    expect(stripHtml('<p>hello</p>')).toBe('hello');
  });

  it('removes nested tags', () => {
    expect(stripHtml('<div><p><strong>text</strong></p></div>')).toBe('text');
  });

  it('decodes HTML entities', () => {
    expect(stripHtml('&amp; &lt; &gt; &quot; &#39;')).toBe('& < > " \'');
  });

  it('replaces &nbsp; with space', () => {
    expect(stripHtml('hello&nbsp;world')).toBe('hello world');
  });

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });

  it('handles string with no tags', () => {
    expect(stripHtml('plain text')).toBe('plain text');
  });
});

describe('compileManuscript', () => {
  it('returns empty array for empty chapters', () => {
    const result = compileManuscript([]);
    expect(result).toEqual([]);
  });

  it('compiles a single chapter', () => {
    const chapters = [{ chapterId: 'Chapter 1', manuscriptContent: '<p>Content</p>' }];
    const result = compileManuscript(chapters);
    expect(result).toHaveLength(1);
    expect(result[0]?.index).toBe(1);
    expect(result[0]?.title).toBe('Chapter 1');
    expect(result[0]?.html).toBe('<p>Content</p>');
    expect(result[0]?.text).toBe('Content');
  });

  it('assigns sequential indexes', () => {
    const chapters = [
      { chapterId: 'Ch1', manuscriptContent: '<p>A</p>' },
      { chapterId: 'Ch2', manuscriptContent: '<p>B</p>' },
    ];
    const result = compileManuscript(chapters);
    expect(result[0]?.index).toBe(1);
    expect(result[1]?.index).toBe(2);
  });

  it('uses fallback when manuscriptContent is missing', () => {
    const chapters = [{ chapterId: 'Ch1' }];
    const result = compileManuscript(chapters);
    expect(result[0]?.html).toBe('<p>(Sin contenido)</p>');
    expect(result[0]?.text).toBe('(Sin contenido)');
  });
});
