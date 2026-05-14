import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { validate } from '../src/middleware/validate.js';

function mockReq(body: unknown = {}) {
  return { body, params: {}, query: {} } as any;
}

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const mockNext = vi.fn();

const testSchema = z.object({ name: z.string().min(1) });

describe('validate middleware', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls next() when body passes schema', () => {
    const req = mockReq({ name: 'Alice' });
    const res = mockRes();
    const next = mockNext;

    validate(testSchema)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('replaces req.body with parsed data', () => {
    const req = mockReq({ name: 'Alice' });
    const res = mockRes();
    const next = mockNext;

    validate(testSchema)(req, res, next);

    expect(req.body).toEqual({ name: 'Alice' });
  });

  it('returns 400 with validation errors when body fails schema', () => {
    const req = mockReq({ name: '' });
    const res = mockRes();
    const next = mockNext;

    validate(testSchema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Datos invalidos',
      errors: expect.arrayContaining([
        expect.objectContaining({ path: 'name', message: expect.any(String) }),
      ]),
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('validates params when source is params', () => {
    const paramSchema = z.object({ projectId: z.string().min(1) });
    const req = mockReq();
    req.params = { projectId: '' };
    const res = mockRes();
    const next = mockNext;

    validate(paramSchema, 'params')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('validates query when source is query', () => {
    const querySchema = z.object({ page: z.string() });
    const req = mockReq();
    req.query = {};
    const res = mockRes();
    const next = mockNext;

    validate(querySchema, 'query')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
