import { describe, it, expect } from 'vitest';
import { stripHtml, buildProjectContext } from '../src/controllers/ai/index.js';

describe('stripHtml', () => {
  it('removes simple tags', () => {
    expect(stripHtml('<p>hello</p>')).toBe('hello');
  });

  it('decodes HTML entities', () => {
    expect(stripHtml('&amp; &lt; &gt;')).toBe('& < >');
  });
});

describe('buildProjectContext', () => {
  const minimalProject = {
    metadata: { title: 'Test Story' },
    characters: [],
    canvas: { nodes: [] },
    chapterManager: { chapters: [] },
  };

  it('includes project title', () => {
    const result = buildProjectContext(minimalProject);
    expect(result).toContain('Test Story');
  });

  it('includes character names', () => {
    const project = {
      ...minimalProject,
      characters: [{ name: 'Alice', biography: 'Hero' }, { name: 'Bob' }],
    };
    const result = buildProjectContext(project);
    expect(result).toContain('Alice');
    expect(result).toContain('Bob');
    expect(result).toContain('Hero');
  });

  it('includes scene info from nodes', () => {
    const project = {
      ...minimalProject,
      canvas: {
        nodes: [
          { id: 'n1', data: { title: 'Opening', content: '<p>Once upon a time</p>', chapterId: 'Ch1', characterTags: ['Alice'] } },
        ],
      },
    };
    const result = buildProjectContext(project);
    expect(result).toContain('Opening');
    expect(result).toContain('Once upon a time');
    expect(result).toContain('[Cap: Ch1]');
  });

  it('includes chapters with beats', () => {
    const project = {
      ...minimalProject,
      chapterManager: {
        chapters: [
          { chapterId: 'Chapter 1', beats: [{ description: 'Hero arrives' }], manuscriptContent: '<p>The story begins...</p>' },
        ],
      },
    };
    const result = buildProjectContext(project);
    expect(result).toContain('Chapter 1');
    expect(result).toContain('Hero arrives');
    expect(result).toContain('The story begins');
  });

  it('handles project with empty/manuscriptContent-only chapter', () => {
    const project = {
      ...minimalProject,
      chapterManager: {
        chapters: [
          { chapterId: 'Empty Chapter', beats: [], manuscriptContent: '' },
        ],
      },
    };
    const result = buildProjectContext(project);
    expect(result).toContain('Empty Chapter');
    expect(result).toContain('(Sin contenido)');
  });
});
