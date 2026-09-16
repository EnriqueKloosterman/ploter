import { describe, it, expect, vi, beforeEach } from 'vitest';

const makeNode = (id: string, chapterId?: string, inkContent?: string) => ({
  id,
  type: 'plot_card',
  position: { x: 0, y: 0 },
  data: { title: id, ...(chapterId ? { chapterId } : {}), ...(inkContent !== undefined ? { inkContent } : {}) },
});

const mockProject = {
  _id: 'proj-id',
  authorId: 'user-id',
  metadata: { projectId: 'proj_123', title: 'My Story' },
  characters: [],
  characterRelations: [],
  canvas: {
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [
      makeNode('n2', 'Ch 2', '== k_final ==\nFinal.\n-> END'),
      makeNode('n1', 'Ch 1', 'Comienzo de la historia.\n-> k_final'),
    ],
    edges: [],
  },
  chapterManager: {
    chapters: [{ chapterId: 'Ch 1', beats: [] }, { chapterId: 'Ch 2', beats: [] }],
  },
};

vi.mock('../src/models/Project.js', () => ({
  default: { findOne: vi.fn() },
}));

import Project from '../src/models/Project.js';
import { exportHtmlPlayable } from '../src/controllers/export/htmlPlayable.js';

function mockReq(overrides: Record<string, unknown> = {}) {
  return { params: { projectId: 'proj_123' }, body: {}, user: { userId: 'user-id', authorId: 'auth_001', email: 'test@test.com' }, ...overrides } as any;
}
function mockRes() {
  const r: any = {};
  r.status = vi.fn().mockReturnValue(r);
  r.json = vi.fn().mockReturnValue(r);
  r.setHeader = vi.fn().mockReturnValue(r);
  r.send = vi.fn().mockReturnValue(r);
  return r;
}

describe('exportHtmlPlayable', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('sends self-contained playable HTML with embedded story', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq();
    const res = mockRes();
    await exportHtmlPlayable(req, res);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html; charset=utf-8');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="My_Story_historia_interactiva.html"'
    );
    const html = res.send.mock.calls[0][0] as string;
    expect(html).toContain('Historia Interactiva');
    expect(html).toContain('__INK_STORY_JSON__');
    expect(html).toContain('inkjs');
    expect(html).toContain('My Story');
  });

  it('orders fragments by chapter order in the compiled story', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq();
    const res = mockRes();
    await exportHtmlPlayable(req, res);
    const html = res.send.mock.calls[0][0] as string;
    const jsonMatch = html.match(/window\.__INK_STORY_JSON__ = ("(?:[^"\\]|\\.)*");/);
    expect(jsonMatch).not.toBeNull();
    const storyJson = JSON.parse(JSON.parse(jsonMatch![1]));
    const serialized = JSON.stringify(storyJson);
    const beginIdx = serialized.indexOf('Comienzo');
    const finalIdx = serialized.indexOf('Final.');
    expect(beginIdx).toBeGreaterThan(-1);
    expect(finalIdx).toBeGreaterThan(-1);
    expect(beginIdx).toBeLessThan(finalIdx);
  });

  it('returns 422 when the ink script has compile errors', async () => {
    const broken = {
      ...mockProject,
      canvas: { ...mockProject.canvas, nodes: [makeNode('n1', 'Ch 1', 'VAR = 5')] },
    };
    vi.mocked(Project.findOne).mockResolvedValue(broken as any);
    const req = mockReq();
    const res = mockRes();
    await exportHtmlPlayable(req, res);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));
  });

  it('sends placeholder HTML when no node has ink content', async () => {
    const empty = {
      ...mockProject,
      canvas: { ...mockProject.canvas, nodes: [makeNode('n1', 'Ch 1')] },
    };
    vi.mocked(Project.findOne).mockResolvedValue(empty as any);
    const req = mockReq();
    const res = mockRes();
    await exportHtmlPlayable(req, res);
    const html = res.send.mock.calls[0][0] as string;
    expect(html).toContain('no tiene scripts Ink');
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq({ user: undefined });
    const res = mockRes();
    await exportHtmlPlayable(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 500 on unexpected error', async () => {
    vi.mocked(Project.findOne).mockRejectedValue(new Error('boom'));
    const req = mockReq();
    const res = mockRes();
    await exportHtmlPlayable(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
