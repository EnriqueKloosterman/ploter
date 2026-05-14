import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUser = {
  _id: 'user-id',
  authorId: 'auth_001',
  name: 'Test User',
  email: 'test@test.com',
  globalSettings: { theme: 'dark', canvasGrid: true },
  authorLibrary: { globalTags: [], globalCharacters: [] },
  save: vi.fn().mockResolvedValue(true),
};

vi.mock('../src/models/User.js', () => ({
  default: { findById: vi.fn() },
}));

import User from '../src/models/User.js';
import { getUserMe, updateTags } from '../src/controllers/userController.js';

function mockReq(overrides: Record<string, unknown> = {}) {
  return { user: { userId: 'user-id', authorId: 'auth_001', email: 'test@test.com' }, ...overrides } as any;
}

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('getUserMe', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns user data on success', async () => {
    vi.mocked(User.findById).mockResolvedValue(mockUser as any);
    const req = mockReq();
    const res = mockRes();
    await getUserMe(req, res);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: mockUser });
  });

  it('returns 401 when not authenticated', async () => {
    const req = mockReq({ user: undefined });
    const res = mockRes();
    await getUserMe(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 404 when user not found', async () => {
    vi.mocked(User.findById).mockResolvedValue(null);
    const req = mockReq();
    const res = mockRes();
    await getUserMe(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on error', async () => {
    vi.mocked(User.findById).mockRejectedValue(new Error('db error'));
    const req = mockReq();
    const res = mockRes();
    await getUserMe(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('updateTags', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('updates tags and returns user', async () => {
    const user = { ...mockUser, authorLibrary: { globalTags: [], globalCharacters: [] }, save: vi.fn().mockResolvedValue(true) };
    vi.mocked(User.findById).mockResolvedValue(user as any);
    const req = mockReq({ body: { tags: [{ tagId: 't1', label: 'Fantasy', color: '#f00' }] } });
    const res = mockRes();
    await updateTags(req, res);
    expect(user.authorLibrary.globalTags).toEqual([{ tagId: 't1', label: 'Fantasy', color: '#f00' }]);
    expect(user.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: user });
  });

  it('returns 401 when not authenticated', async () => {
    const req = mockReq({ user: undefined });
    const res = mockRes();
    await updateTags(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 404 when user not found', async () => {
    vi.mocked(User.findById).mockResolvedValue(null);
    const req = mockReq();
    const res = mockRes();
    await updateTags(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on error', async () => {
    vi.mocked(User.findById).mockRejectedValue(new Error('db error'));
    const req = mockReq();
    const res = mockRes();
    await updateTags(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
