import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockProject = {
  _id: 'proj-id',
  authorId: 'user-id',
  metadata: {
    projectId: 'proj_123',
    title: 'My Story',
    createdAt: new Date(),
    lastModified: new Date(),
  },
  characters: [],
  characterRelations: [],
  canvas: { viewport: { x: 0, y: 0, zoom: 1 }, nodes: [], edges: [] },
  chapterManager: { chapters: [] },
};

const mockUser = {
  _id: 'user-id',
  authorId: 'auth_001',
  name: 'Test',
  email: 'test@test.com',
};

vi.mock('../src/models/Project.js', () => ({
  default: {
    findOne: vi.fn(),
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../src/models/User.js', () => ({
  default: { findById: vi.fn() },
}));

import Project from '../src/models/Project.js';
import User from '../src/models/User.js';
import {
  getProjectById,
  updateProject,
  deleteProject,
  getAllProjects,
  createProject,
} from '../src/controllers/projectController.js';

function mockReq(overrides: Record<string, unknown> = {}) {
  return { params: {}, body: {}, user: { userId: 'user-id', authorId: 'auth_001', email: 'test@test.com' }, ...overrides } as any;
}
function mockRes() {
  const r: any = {};
  r.status = vi.fn().mockReturnValue(r);
  r.json = vi.fn().mockReturnValue(r);
  return r;
}

describe('getProjectById', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns project', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(mockProject as any);
    const req = mockReq({ params: { projectId: 'proj_123' } });
    const res = mockRes();
    await getProjectById(req, res);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: mockProject });
  });

  it('returns 401 when not authenticated', async () => {
    const req = mockReq({ user: undefined, params: { projectId: 'p1' } });
    const res = mockRes();
    await getProjectById(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 404 when not found', async () => {
    vi.mocked(Project.findOne).mockResolvedValue(null);
    const req = mockReq({ params: { projectId: 'proj_123' } });
    const res = mockRes();
    await getProjectById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on error', async () => {
    vi.mocked(Project.findOne).mockRejectedValue(new Error('db'));
    const req = mockReq({ params: { projectId: 'proj_123' } });
    const res = mockRes();
    await getProjectById(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('updateProject', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('updates valid fields and returns project', async () => {
    vi.mocked(Project.findOneAndUpdate).mockResolvedValue(mockProject as any);
    const req = mockReq({ params: { projectId: 'proj_123' }, body: { metadata: { title: 'New Title' } } });
    const res = mockRes();
    await updateProject(req, res);
    expect(Project.findOneAndUpdate).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: mockProject });
  });

  it('returns 401 when not authenticated', async () => {
    const req = mockReq({ user: undefined, params: { projectId: 'p1' } });
    const res = mockRes();
    await updateProject(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 400 when no valid fields to update', async () => {
    const req = mockReq({ params: { projectId: 'p1' }, body: { invalid: true } });
    const res = mockRes();
    await updateProject(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when project not found after update', async () => {
    vi.mocked(Project.findOneAndUpdate).mockResolvedValue(null);
    const req = mockReq({ params: { projectId: 'proj_123' }, body: { metadata: { title: 'X' } } });
    const res = mockRes();
    await updateProject(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on error', async () => {
    vi.mocked(Project.findOneAndUpdate).mockRejectedValue(new Error('db'));
    const req = mockReq({ params: { projectId: 'proj_123' }, body: { metadata: { title: 'X' } } });
    const res = mockRes();
    await updateProject(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('deleteProject', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('deletes project and returns success', async () => {
    vi.mocked(Project.findOneAndDelete).mockResolvedValue(mockProject as any);
    const req = mockReq({ params: { projectId: 'proj_123' } });
    const res = mockRes();
    await deleteProject(req, res);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', message: 'Proyecto eliminado con exito' });
  });

  it('returns 401 when not authenticated', async () => {
    const req = mockReq({ user: undefined, params: { projectId: 'p1' } });
    const res = mockRes();
    await deleteProject(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 404 when not found', async () => {
    vi.mocked(Project.findOneAndDelete).mockResolvedValue(null);
    const req = mockReq({ params: { projectId: 'proj_123' } });
    const res = mockRes();
    await deleteProject(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on error', async () => {
    vi.mocked(Project.findOneAndDelete).mockRejectedValue(new Error('db'));
    const req = mockReq({ params: { projectId: 'proj_123' } });
    const res = mockRes();
    await deleteProject(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('getAllProjects', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns list of projects', async () => {
    vi.mocked(Project.find).mockReturnValue({ sort: vi.fn().mockResolvedValue([mockProject]) } as any);
    const req = mockReq();
    const res = mockRes();
    await getAllProjects(req, res);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: [mockProject] });
  });

  it('returns 401 when not authenticated', async () => {
    const req = mockReq({ user: undefined });
    const res = mockRes();
    await getAllProjects(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 500 on error', async () => {
    vi.mocked(Project.find).mockRejectedValue(new Error('db'));
    const req = mockReq();
    const res = mockRes();
    await getAllProjects(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('createProject', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('creates project and returns 201', async () => {
    vi.mocked(User.findById).mockResolvedValue(mockUser as any);
    vi.mocked(Project.create).mockResolvedValue(mockProject as any);
    const req = mockReq({ body: { title: 'New Story' } });
    const res = mockRes();
    await createProject(req, res);
    expect(Project.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: mockProject });
  });

  it('creates project with default title when no title given', async () => {
    vi.mocked(User.findById).mockResolvedValue(mockUser as any);
    vi.mocked(Project.create).mockResolvedValue(mockProject as any);
    const req = mockReq({ body: {} });
    const res = mockRes();
    await createProject(req, res);
    expect(Project.create).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: expect.objectContaining({ title: 'Historia sin titulo' }) }),
    );
  });

  it('returns 401 when not authenticated', async () => {
    const req = mockReq({ user: undefined });
    const res = mockRes();
    await createProject(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 404 when user not found', async () => {
    vi.mocked(User.findById).mockResolvedValue(null);
    const req = mockReq();
    const res = mockRes();
    await createProject(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on error', async () => {
    vi.mocked(User.findById).mockResolvedValue(mockUser as any);
    vi.mocked(Project.create).mockRejectedValue(new Error('db'));
    const req = mockReq();
    const res = mockRes();
    await createProject(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
