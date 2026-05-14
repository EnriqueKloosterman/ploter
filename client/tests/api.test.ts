import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch, apiUrl, setApiAdapters, resetApiAdapters } from '../src/lib/api';

beforeEach(() => {
  resetApiAdapters();
});

describe('apiUrl', () => {
  it('appends path to base URL', () => {
    const url = apiUrl('/api/test');
    expect(url).toMatch(/http:\/\/localhost:5000\/api\/test$/);
  });
});

describe('apiFetch', () => {
  it('sends GET request with correct URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
    setApiAdapters({ fetch: mockFetch });

    await apiFetch('/api/projects');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/projects');
    expect(init?.method).toBeUndefined();
  });

  it('attaches Bearer token from getToken', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
    setApiAdapters({ fetch: mockFetch, getToken: () => 'test-token-123' });

    await apiFetch('/api/projects');

    const [, init] = mockFetch.mock.calls[0];
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer test-token-123' });
  });

  it('does not attach token when getToken returns null', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
    setApiAdapters({ fetch: mockFetch, getToken: () => null });

    await apiFetch('/api/projects');

    const [, init] = mockFetch.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers?.Authorization).toBeUndefined();
  });

  it('removes token and redirects on 401', async () => {
    const setToken = vi.fn();
    const redirect = vi.fn();
    const mockFetch = vi.fn().mockResolvedValue(new Response('unauthorized', { status: 401 }));
    setApiAdapters({ fetch: mockFetch, getToken: () => 'token', setToken, redirect });

    await apiFetch('/api/projects');

    expect(setToken).toHaveBeenCalledWith(null);
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('preserves custom headers from init', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
    setApiAdapters({ fetch: mockFetch, getToken: () => 'tok' });

    await apiFetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'val' }),
    });

    const [, init] = mockFetch.mock.calls[0];
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer tok',
    });
    expect(init?.body).toBe(JSON.stringify({ key: 'val' }));
  });

  it('does not redirect on 401 when no token', async () => {
    const redirect = vi.fn();
    const mockFetch = vi.fn().mockResolvedValue(new Response('unauthorized', { status: 401 }));
    setApiAdapters({ fetch: mockFetch, getToken: () => null, redirect });

    await apiFetch('/api/projects');

    expect(redirect).not.toHaveBeenCalled();
  });
});
