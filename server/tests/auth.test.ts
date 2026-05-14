import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUser = {
  _id: 'user-id-123',
  authorId: 'auth_1234',
  name: 'Test User',
  email: 'test@test.com',
  password: '$2y$10$hashed',
  globalSettings: { theme: 'dark', canvasGrid: true },
  authorLibrary: { globalTags: [], globalCharacters: [] },
};

vi.mock('../src/models/User.js', () => ({
  default: { findOne: vi.fn(), create: vi.fn(), findById: vi.fn() },
}));

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn(), compare: vi.fn() },
}));

const { mockGenerateToken } = vi.hoisted(() => ({
  mockGenerateToken: vi.fn().mockReturnValue('jwt-token'),
}));
vi.mock('../src/middleware/auth.js', () => ({
  generateToken: mockGenerateToken,
}));

import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';
import { register, login, me } from '../src/controllers/authController.js';

function mockReq(overrides: Record<string, unknown> = {}) {
  return { body: {}, user: { userId: 'user-id-123', authorId: 'auth_1234', email: 'test@test.com' }, ...overrides } as any;
}
function mockRes() {
  const r: any = {};
  r.status = vi.fn().mockReturnValue(r);
  r.json = vi.fn().mockReturnValue(r);
  return r;
}

describe('register', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('creates user and returns 201 with token', async () => {
    vi.mocked(User.findOne).mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue('$2y$10$hashed' as never);
    vi.mocked(User.create).mockResolvedValue(mockUser as any);

    const req = mockReq({ body: { email: 'test@test.com', password: 'pass123', name: 'Test' } });
    const res = mockRes();
    await register(req, res);

    expect(User.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'success',
      data: expect.objectContaining({ token: 'jwt-token' }),
    }));
  });

  it('returns 400 when fields missing', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 409 when email already exists', async () => {
    vi.mocked(User.findOne).mockResolvedValue(mockUser as any);
    const req = mockReq({ body: { email: 'test@test.com', password: 'pass123', name: 'T' } });
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('returns 500 on error', async () => {
    vi.mocked(User.findOne).mockRejectedValue(new Error('db'));
    const req = mockReq({ body: { email: 'test@test.com', password: 'pass123', name: 'T' } });
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('login', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns token on valid credentials', async () => {
    vi.mocked(User.findOne).mockResolvedValue(mockUser as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const req = mockReq({ body: { email: 'test@test.com', password: 'pass123' } });
    const res = mockRes();
    await login(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'success',
      data: expect.objectContaining({ token: 'jwt-token' }),
    }));
  });

  it('returns 400 when email or password missing', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 when user not found', async () => {
    vi.mocked(User.findOne).mockResolvedValue(null);
    const req = mockReq({ body: { email: 'x@y.com', password: 'pass' } });
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when password is wrong', async () => {
    vi.mocked(User.findOne).mockResolvedValue(mockUser as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const req = mockReq({ body: { email: 'test@test.com', password: 'wrong' } });
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 500 on error', async () => {
    vi.mocked(User.findOne).mockRejectedValue(new Error('db'));
    const req = mockReq({ body: { email: 'test@test.com', password: 'pass' } });
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('me', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns user data', async () => {
    vi.mocked(User.findById).mockResolvedValue(mockUser as any);
    const req = mockReq();
    const res = mockRes();
    await me(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'success',
      data: expect.objectContaining({ email: 'test@test.com' }),
    }));
  });

  it('returns 401 when not authenticated', async () => {
    const req = mockReq({ user: undefined });
    const res = mockRes();
    await me(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 404 when user not found', async () => {
    vi.mocked(User.findById).mockResolvedValue(null);
    const req = mockReq();
    const res = mockRes();
    await me(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on error', async () => {
    vi.mocked(User.findById).mockRejectedValue(new Error('db'));
    const req = mockReq();
    const res = mockRes();
    await me(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
