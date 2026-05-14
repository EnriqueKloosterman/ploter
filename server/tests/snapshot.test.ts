import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';

const mockProject = {
  _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
  authorId: 'user-id',
  metadata: { projectId: 'proj_123', title: 'My Story' },
  characters: [],
  characterRelations: [],
  canvas: { viewport: { x: 0, y: 0, zoom: 1 }, nodes: [], edges: [] },
  chapterManager: { chapters: [] },
  toObject: vi.fn().mockReturnValue({}),
  save: vi.fn().mockResolvedValue(true),
};

const mockSnapshot = {
  _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
  projectId: mockProject._id,
  description: 'Test snapshot',
  projectData: { metadata: { title: 'Old' }, characters: [], canvas: {}, chapterManager: {} },
  createdAt: new Date(),
};

vi.mock('../src/models/Project.js', () => ({
  default: { findOne: vi.fn(), findById: vi.fn() },
}));

vi.mock('../src/models/Snapshot.js', () => ({
  default: {
    create: vi.fn(),
    countDocuments: vi.fn(),
    findById: vi.fn(),
    find: vi.fn(),
  },
}));

import Project from '../src/models/Project.js';
import Snapshot from '../src/models/Snapshot.js';
import { createSnapshot, restoreSnapshot, getSnapshots } from '../src/controllers/snapshotController.js';

function mockReq(overrides: Record<string, unknown> = {}) {
  return { params: {}, body: {}, user: { userId: 'user-id', authorId: 'auth_001', email: 'test@test.com' }, ...overrides } as any;
}
function mockRes() {
  const r: any = {};
  r.status = vi.fn().mockReturnValue(r);
  r.json = vi.fn().mockReturnValue(r);
  return r;
}

describe('createSnapshot', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('creates snapshot and returns 201', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    vi.mocked(Snapshot.countDocuments).mockResolvedValue(0);
    vi.mocked(Snapshot.create).mockResolvedValue(mockSnapshot as any);

    const req = mockReq({ params: { projectId: 'proj_123' }, body: { description: 'v1' } });
    const res = mockRes();
    await createSnapshot(req, res);

    expect(Snapshot.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 401 when not authenticated', async () => {
    const req = { params: { projectId: 'p1' }, body: {} } as any;
    expect(req.user).toBeUndefined();
    const res = mockRes();
    await createSnapshot(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 404 when project not found', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(null);
    const req = mockReq({ params: { projectId: 'proj_123' } });
    const res = mockRes();
    await createSnapshot(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 when snapshot limit reached', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    vi.mocked(Snapshot.countDocuments).mockResolvedValue(50);
    const req = mockReq({ params: { projectId: 'proj_123' } });
    const res = mockRes();
    await createSnapshot(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on error', async () => {
    vi.mocked(Project.findOne).mockRejectedValue(new Error('db'));
    const req = mockReq({ params: { projectId: 'proj_123' } });
    const res = mockRes();
    await createSnapshot(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('restoreSnapshot', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('restores snapshot data and returns project', async () => {
    vi.mocked(Snapshot.findById).mockResolvedValue(mockSnapshot as any);
    vi.mocked(Project.findById).mockResolvedValue(mockProject as any);

    const req = mockReq({ params: { snapshotId: 'snap-1' } });
    const res = mockRes();
    await restoreSnapshot(req, res);

    expect(mockProject.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  it('returns 404 when snapshot not found', async () => {
    vi.mocked(Snapshot.findById).mockResolvedValue(null);
    const req = mockReq({ params: { snapshotId: 'snap-1' } });
    const res = mockRes();
    await restoreSnapshot(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 404 when project not found', async () => {
    vi.mocked(Snapshot.findById).mockResolvedValue(mockSnapshot as any);
    vi.mocked(Project.findById).mockResolvedValue(null);
    const req = mockReq({ params: { snapshotId: 'snap-1' } });
    const res = mockRes();
    await restoreSnapshot(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on error', async () => {
    vi.mocked(Snapshot.findById).mockRejectedValue(new Error('db'));
    const req = mockReq({ params: { snapshotId: 'snap-1' } });
    const res = mockRes();
    await restoreSnapshot(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('getSnapshots', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('returns snapshots list', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    vi.mocked(Snapshot.find).mockReturnValue({ sort: vi.fn().mockResolvedValue([mockSnapshot]) } as any);

    const req = mockReq({ params: { projectId: 'proj_123' } });
    const res = mockRes();
    await getSnapshots(req, res);

    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: [mockSnapshot] });
  });

  it('returns 401 when not authenticated', async () => {
    const req = { params: { projectId: 'p1' }, body: {} } as any;
    expect(req.user).toBeUndefined();
    const res = mockRes();
    await getSnapshots(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 404 when project not found', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(null);
    const req = mockReq({ params: { projectId: 'proj_123' } });
    const res = mockRes();
    await getSnapshots(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on error', async () => {
    vi.mocked(Project.findOne).mockRejectedValue(new Error('db'));
    const req = mockReq({ params: { projectId: 'proj_123' } });
    const res = mockRes();
    await getSnapshots(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
