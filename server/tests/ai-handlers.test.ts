import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockProject = {
  _id: 'proj-id',
  authorId: 'user-id',
  metadata: { projectId: 'proj_123', title: 'Test Story' },
  characters: [{ name: 'Alice', biography: 'Hero' }],
  canvas: {
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [
      { id: 'n1', type: 'plot', position: { x: 0, y: 0 }, data: { title: 'Opening', content: '<p>Start</p>', chapterId: 'Ch 1', characterTags: ['Alice'] } },
    ],
    edges: [],
  },
  chapterManager: {
    chapters: [
      { chapterId: 'Ch 1', beats: [{ description: 'Hero arrives' }], manuscriptContent: '<p>The story begins...</p>' },
    ],
  },
};

vi.mock('../src/models/Project.js', () => ({
  default: { findOne: vi.fn() },
}));

vi.mock('openai', () => ({
  default: vi.fn(function () {
    return {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({ choices: [{ message: { content: 'mock' } }] }),
        },
      },
    };
  }),
}));

process.env.OPENAI_API_KEY = 'test-key';
process.env.OPENAI_MODEL = 'test-model';

import Project from '../src/models/Project.js';
import { suggestPlot } from '../src/controllers/ai/suggestPlot.js';
import { generateNames } from '../src/controllers/ai/generateNames.js';
import { findPlotHoles } from '../src/controllers/ai/findPlotHoles.js';
import { summarize } from '../src/controllers/ai/summarize.js';

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

describe('suggestPlot', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns plot suggestions', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq({ body: { focus: 'climax' } });
    const res = mockRes();
    await suggestPlot(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'ok' }));
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq({ user: undefined });
    const res = mockRes();
    await suggestPlot(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 404 when project not found', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(null);
    const req = mockReq();
    const res = mockRes();
    await suggestPlot(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on error', async () => {
    vi.mocked(Project.findOne).mockRejectedValue(new Error('boom'));
    const req = mockReq();
    const res = mockRes();
    await suggestPlot(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('generateNames', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns generated names', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq({ body: { count: 3, style: 'fantasy' } });
    const res = mockRes();
    await generateNames(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'ok' }));
  });

  it('clamps count between 1 and 20', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq({ body: { count: 999 } });
    const res = mockRes();
    await generateNames(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'ok' }));
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq({ user: undefined });
    const res = mockRes();
    await generateNames(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 404 when project not found', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(null);
    const req = mockReq();
    const res = mockRes();
    await generateNames(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on error', async () => {
    vi.mocked(Project.findOne).mockRejectedValue(new Error('boom'));
    const req = mockReq();
    const res = mockRes();
    await generateNames(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('findPlotHoles', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns plot hole analysis', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq();
    const res = mockRes();
    await findPlotHoles(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'ok' }));
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq({ user: undefined });
    const res = mockRes();
    await findPlotHoles(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 404 when project not found', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(null);
    const req = mockReq();
    const res = mockRes();
    await findPlotHoles(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on error', async () => {
    vi.mocked(Project.findOne).mockRejectedValue(new Error('boom'));
    const req = mockReq();
    const res = mockRes();
    await findPlotHoles(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('summarize', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('summarizes full project when no chapterId', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq({ body: {} });
    const res = mockRes();
    await summarize(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'ok' }));
  });

  it('summarizes specific chapter when chapterId given', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq({ body: { chapterId: 'Ch 1' } });
    const res = mockRes();
    await summarize(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'ok' }));
  });

  it('returns 400 when chapter not found', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq({ body: { chapterId: 'NoExist' } });
    const res = mockRes();
    await summarize(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq({ user: undefined });
    const res = mockRes();
    await summarize(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 404 when project not found', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(null);
    const req = mockReq();
    const res = mockRes();
    await summarize(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on error', async () => {
    vi.mocked(Project.findOne).mockRejectedValue(new Error('boom'));
    const req = mockReq();
    const res = mockRes();
    await summarize(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
