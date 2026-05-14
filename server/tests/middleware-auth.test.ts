import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock-token'),
    verify: vi.fn(),
  },
}));

import { authMiddleware, generateToken } from '../src/middleware/auth.js';
import jwt from 'jsonwebtoken';

function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    headers: {},
    ...overrides,
  } as any;
}

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const mockNext = vi.fn();

describe('generateToken', () => {
  it('calls jwt.sign with payload and 7d expiry', () => {
    const payload = { userId: 'u1', authorId: 'a1', email: 'a@b.com' };
    const token = generateToken(payload);
    expect(token).toBe('mock-token');
    expect(jwt.sign).toHaveBeenCalledWith(payload, expect.any(String), { expiresIn: '7d' });
  });
});

describe('authMiddleware', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls next() when valid Bearer token is provided', () => {
    const decoded = { userId: 'u1', authorId: 'a1', email: 'a@b.com' };
    vi.mocked(jwt.verify).mockReturnValue(decoded as any);
    const req = mockReq({ headers: { authorization: 'Bearer valid-token' } });
    const res = mockRes();
    const next = mockNext;

    authMiddleware(req, res, next);

    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when no Authorization header', () => {
    const req = mockReq();
    const res = mockRes();
    const next = mockNext;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'Token no proporcionado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when header does not start with Bearer', () => {
    const req = mockReq({ headers: { authorization: 'Basic xxx' } });
    const res = mockRes();
    const next = mockNext;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when token part is missing after Bearer', () => {
    const req = mockReq({ headers: { authorization: 'Bearer ' } });
    const res = mockRes();
    const next = mockNext;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when jwt.verify throws', () => {
    vi.mocked(jwt.verify).mockImplementation(() => { throw new Error('bad'); });
    const req = mockReq({ headers: { authorization: 'Bearer bad-token' } });
    const res = mockRes();
    const next = mockNext;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'Token invalido o expirado' });
    expect(next).not.toHaveBeenCalled();
  });
});
