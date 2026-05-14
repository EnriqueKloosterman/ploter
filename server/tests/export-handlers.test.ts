import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockProject = {
  _id: 'proj-id',
  authorId: 'user-id',
  metadata: { projectId: 'proj_123', title: 'My Story' },
  characters: [{ id: 'c1', name: 'Alice', biography: 'Hero' }],
  characterRelations: [],
  canvas: { viewport: { x: 0, y: 0, zoom: 1 }, nodes: [], edges: [] },
  chapterManager: {
    chapters: [
      { chapterId: 'Ch 1', beats: [], manuscriptContent: '<p>Chapter one text.</p>' },
      { chapterId: 'Ch 2', beats: [], manuscriptContent: '<p>Chapter two text.</p>' },
    ],
  },
};

vi.mock('../src/models/Project.js', () => ({
  default: { findOne: vi.fn() },
}));

vi.mock('pdfkit', () => {
  class MockPDFDocument {
    private _listeners: Record<string, Array<(...args: unknown[]) => void>> = {};
    on(event: string, fn: (...args: unknown[]) => void) {
      (this._listeners[event] ??= []).push(fn);
      return this;
    }
    private _emit(event: string, ...args: unknown[]) {
      this._listeners[event]?.forEach(h => h(...args));
    }
    font() { return this; }
    fontSize() { return this; }
    fillColor() { return this; }
    text() { return this; }
    moveDown() { return this; }
    addPage() { return this; }
    end() {
      this._emit('data', Buffer.from('mock-pdf'));
      this._emit('end');
    }
  }
  return { default: MockPDFDocument };
});

vi.mock('docx', () => ({
  Document: vi.fn(),
  Packer: { toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-docx')) },
  Paragraph: vi.fn(),
  TextRun: vi.fn(),
  HeadingLevel: { TITLE: 'Title', HEADING_1: 'Heading1' },
  AlignmentType: { CENTER: 'center', JUSTIFIED: 'justified' },
}));

vi.mock('node:fs', () => ({
  mkdtempSync: vi.fn().mockReturnValue('/tmp/epub-test'),
  readFileSync: vi.fn().mockReturnValue(Buffer.from('mock-epub')),
  rmSync: vi.fn(),
}));

vi.mock('epub-gen', () => ({
  default: vi.fn(function () {
    const handlers: Record<string, (...args: unknown[]) => void> = {};
    return {
      on: vi.fn((ev: string, h: (...args: unknown[]) => void) => { handlers[ev] = h; }),
      create: vi.fn(() => { handlers['done']?.(); }),
    };
  }),
}));

import Project from '../src/models/Project.js';
import { exportHtml } from '../src/controllers/export/html.js';
import { exportFountain } from '../src/controllers/export/fountain.js';
import { exportDocx } from '../src/controllers/export/docx.js';
import { exportPdf } from '../src/controllers/export/pdf.js';
import { exportEpub } from '../src/controllers/export/epub.js';

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

describe('exportHtml', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);

  it('sends HTML with correct content type and chapters', async () => {
    const req = mockReq();
    const res = mockRes();
    await exportHtml(req, res);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html; charset=utf-8');
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('My Story'));
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Ch 1'));
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Chapter one text'));
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Ch 2'));
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(Project.findOne).mockReset();
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq({ user: undefined });
    const res = mockRes();
    await exportHtml(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 500 on error', async () => {
    vi.mocked(Project.findOne).mockReset();
    vi.mocked(Project.findOne).mockRejectedValue(new Error('boom'));
    const req = mockReq();
    const res = mockRes();
    await exportHtml(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('exportFountain', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('sends Fountain with correct headers', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq();
    const res = mockRes();
    await exportFountain(req, res);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain; charset=utf-8');
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Title: My Story'));
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('CH 1'));
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Chapter one text'));
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq({ user: undefined });
    const res = mockRes();
    await exportFountain(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 500 on error', async () => {
    vi.mocked(Project.findOne).mockRejectedValue(new Error('boom'));
    const req = mockReq();
    const res = mockRes();
    await exportFountain(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('exportDocx', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('sends DOCX with correct headers', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq();
    const res = mockRes();
    await exportDocx(req, res);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq({ user: undefined });
    const res = mockRes();
    await exportDocx(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 500 on error', async () => {
    vi.mocked(Project.findOne).mockRejectedValue(new Error('boom'));
    const req = mockReq();
    const res = mockRes();
    await exportDocx(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('exportPdf', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('sends PDF with correct headers', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq();
    const res = mockRes();
    await exportPdf(req, res);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq({ user: undefined });
    const res = mockRes();
    await exportPdf(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 500 on error', async () => {
    vi.mocked(Project.findOne).mockRejectedValue(new Error('boom'));
    const req = mockReq();
    const res = mockRes();
    await exportPdf(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('exportEpub', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('sends EPUB with correct headers', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq();
    const res = mockRes();
    await exportEpub(req, res);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/epub+zip');
    expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq({ user: undefined });
    const res = mockRes();
    await exportEpub(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 500 on error', async () => {
    vi.mocked(Project.findOne).mockRejectedValue(new Error('boom'));
    const req = mockReq();
    const res = mockRes();
    await exportEpub(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
