import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadImage } from '../src/controllers/uploadController.js';

function mockReq(overrides: Record<string, unknown> = {}) {
  return { ...overrides } as any;
}

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('uploadImage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns URL when file is present', async () => {
    const req = mockReq({ file: { filename: 'photo.jpg' } });
    const res = mockRes();
    await uploadImage(req, res);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { url: '/uploads/photo.jpg', width: 0, height: 0 },
    });
  });

  it('returns 400 when no file', async () => {
    const req = mockReq({});
    const res = mockRes();
    await uploadImage(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'No se envio ningun archivo' });
  });

  it('returns 500 on error', async () => {
    const req = mockReq({ file: { filename: 'x.jpg' } });
    const res = mockRes();
    let shouldThrow = true;
    res.json = vi.fn(() => { if (shouldThrow) { shouldThrow = false; throw new Error('boom'); } }) as any;
    await uploadImage(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
