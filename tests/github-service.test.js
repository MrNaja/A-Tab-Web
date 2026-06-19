import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadGithubBackup, testGithubToken } from '../js/services/github-service.js';

function createJsonResponse(body, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body)
  };
}

function createTextResponse(body, ok = true, status = 200) {
  return {
    ok,
    status,
    text: vi.fn().mockResolvedValue(body),
    json: vi.fn().mockResolvedValue({ message: body })
  };
}

function encodeBase64Utf8(value) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(value))));
}

describe('webpage github service', () => {
  beforeEach(() => {
    vi.stubGlobal('isSecureContext', true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('tests a token against the Github user endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ login: 'octo' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(testGithubToken('token-1')).resolves.toEqual({ login: 'octo' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/user',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'token token-1'
        })
      })
    );
  });

  it('rejects PAT usage before making a request in an insecure context', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('isSecureContext', false);
    vi.stubGlobal('fetch', fetchMock);

    await expect(testGithubToken('token-1')).rejects.toThrow('secure context');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('downloads and normalizes backup data from the configured Github repo', async () => {
    const backup = {
      groups: [{ id: 'grp_dev', name: '开发', type: 'user' }],
      bookmarks: [
        { id: 'b1', title: 'GitHub', url: 'https://github.com', groupId: 'grp_dev', order: 1 }
      ]
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createJsonResponse({ login: 'octo' }))
      .mockResolvedValueOnce(createJsonResponse({ content: encodeBase64Utf8(backup) }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await downloadGithubBackup('token-1');

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.github.com/repos/octo/a-tab-backup/contents/backup.json',
      expect.objectContaining({
        cache: 'no-store'
      })
    );
    expect(result.groups.map((group) => group.id)).toEqual(['sys:start_page', 'grp_dev']);
    expect(result.bookmarks).toEqual([
      { id: 'b1', title: 'GitHub', url: 'https://github.com', groupId: 'grp_dev', order: 1, colorState: 0 }
    ]);
  });

  it('downloads large backup files through the raw Github media type', async () => {
    const backup = {
      groups: [{ id: 'grp_dev', name: 'Development', type: 'user' }],
      bookmarks: [
        { id: 'b1', title: 'Large backup', url: 'https://example.com', groupId: 'grp_dev', order: 1 }
      ]
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createJsonResponse({ login: 'octo' }))
      .mockResolvedValueOnce(createJsonResponse({ content: '', encoding: 'none' }))
      .mockResolvedValueOnce(createTextResponse(JSON.stringify(backup)));
    vi.stubGlobal('fetch', fetchMock);

    const result = await downloadGithubBackup('token-1');

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://api.github.com/repos/octo/a-tab-backup/contents/backup.json',
      expect.objectContaining({
        cache: 'no-store',
        headers: expect.objectContaining({
          Authorization: 'token token-1',
          Accept: 'application/vnd.github.raw+json'
        })
      })
    );
    expect(result.bookmarks).toEqual([
      { id: 'b1', title: 'Large backup', url: 'https://example.com', groupId: 'grp_dev', order: 1, colorState: 0 }
    ]);
  });
});
