import { describe, expect, it } from 'vitest';
import { normalizeBackupData } from '../js/services/import-service.js';

describe('webpage import service', () => {
  it('normalizes A Tab backup data and excludes recycle bin data', () => {
    const result = normalizeBackupData({
      groups: [
        { id: 'sys:start_page', name: '起始页', type: 'system' },
        { id: 'grp_dev', name: '开发', type: 'user' },
        { id: 'sys:recycle_bin', name: '回收站', type: 'system' }
      ],
      bookmarks: [
        { id: 'b2', title: 'GitHub', url: 'https://github.com', groupId: 'grp_dev', order: 2, colorState: 3 },
        { id: 'd1', title: 'Tools', type: 'divider', groupId: 'grp_dev', order: 1 },
        { id: 'trash', title: 'Deleted', url: 'https://example.com', groupId: 'sys:recycle_bin', order: 3 }
      ]
    });

    expect(result.groups.map((group) => group.id)).toEqual(['sys:start_page', 'grp_dev']);
    expect(result.bookmarks).toEqual([
      { id: 'd1', title: 'Tools', type: 'divider', groupId: 'grp_dev', order: 1 },
      { id: 'b2', title: 'GitHub', url: 'https://github.com', groupId: 'grp_dev', order: 2, colorState: 3 }
    ]);
  });

  it('infers groups when simplified bookmark data omits the groups array', () => {
    const result = normalizeBackupData({
      bookmarks: [
        { id: 'b1', title: 'OpenAI', url: 'https://openai.com', groupId: 'missing', order: 1 }
      ]
    });

    expect(result.groups.map((group) => group.id)).toEqual(['sys:start_page', 'missing']);
    expect(result.bookmarks[0].groupId).toBe('missing');
  });

  it('does not recreate deleted or missing groups from explicit backup groups', () => {
    const result = normalizeBackupData({
      groups: [
        { id: 'sys:start_page', name: 'Start', type: 'system' },
        { id: 'grp_deleted', name: 'Deleted', type: 'user', deletedAt: Date.now() }
      ],
      bookmarks: [
        { id: 'deleted-group', title: 'Deleted group', url: 'https://example.com/1', groupId: 'grp_deleted' },
        { id: 'missing-group', title: 'Missing group', url: 'https://example.com/2', groupId: 'grp_missing' }
      ]
    });

    expect(result.groups.map((group) => group.id)).toEqual(['sys:start_page']);
    expect(result.bookmarks.map((bookmark) => bookmark.groupId)).toEqual([
      'sys:start_page',
      'sys:start_page'
    ]);
  });

  it('does not infer groups from deleted bookmarks in simplified data', () => {
    const result = normalizeBackupData({
      bookmarks: [
        { id: 'deleted', title: 'Deleted', url: 'https://example.com', groupId: 'grp_deleted', deletedAt: Date.now() }
      ]
    });

    expect(result.groups.map((group) => group.id)).toEqual(['sys:start_page']);
    expect(result.bookmarks).toEqual([]);
  });

  it('rejects explicit UI and unsupported system group IDs', () => {
    const result = normalizeBackupData({
      groups: [
        { id: 'view:custom', name: 'Settings collision', type: 'user' },
        { id: 'sys:future', name: 'Future system view', type: 'user' },
        { id: 'grp_safe', name: 'Safe group', type: 'user' }
      ],
      bookmarks: [
        { id: 'custom', title: 'Custom collision', url: 'https://example.com/custom', groupId: 'view:custom' },
        { id: 'system', title: 'System collision', url: 'https://example.com/system', groupId: 'sys:future' },
        { id: 'safe', title: 'Safe', url: 'https://example.com/safe', groupId: 'grp_safe' }
      ]
    });

    expect(result.groups.map((group) => group.id)).toEqual(['sys:start_page', 'grp_safe']);
    expect(result.bookmarks.map((bookmark) => [bookmark.id, bookmark.groupId])).toEqual([
      ['custom', 'sys:start_page'],
      ['system', 'sys:start_page'],
      ['safe', 'grp_safe']
    ]);
  });

  it('does not infer UI or unsupported system groups from simplified data', () => {
    const result = normalizeBackupData({
      bookmarks: [
        { id: 'custom', title: 'Custom collision', url: 'https://example.com/custom', groupId: 'view:custom' },
        { id: 'system', title: 'System collision', url: 'https://example.com/system', groupId: 'sys:future' },
        { id: 'safe', title: 'Safe', url: 'https://example.com/safe', groupId: 'grp_safe' }
      ]
    });

    expect(result.groups.map((group) => group.id)).toEqual(['sys:start_page', 'grp_safe']);
    expect(result.bookmarks.map((bookmark) => [bookmark.id, bookmark.groupId])).toEqual([
      ['custom', 'sys:start_page'],
      ['system', 'sys:start_page'],
      ['safe', 'grp_safe']
    ]);
  });

  it('allows only absolute HTTP and HTTPS bookmark URLs', () => {
    const result = normalizeBackupData({
      bookmarks: [
        { id: 'https', title: 'HTTPS', url: 'https://example.com', groupId: 'sys:start_page' },
        { id: 'http', title: 'HTTP', url: 'http://example.com', groupId: 'sys:start_page' },
        { id: 'javascript', title: 'Script', url: '  JaVaScRiPt:alert(1)', groupId: 'sys:start_page' },
        { id: 'obfuscated', title: 'Script', url: 'java\nscript:alert(1)', groupId: 'sys:start_page' },
        { id: 'data', title: 'Data', url: 'data:text/html,<script>alert(1)</script>', groupId: 'sys:start_page' },
        { id: 'file', title: 'File', url: 'file:///etc/passwd', groupId: 'sys:start_page' },
        { id: 'intent', title: 'Intent', url: 'intent://scan/#Intent;scheme=zxing;end', groupId: 'sys:start_page' },
        { id: 'mailto', title: 'Mail', url: 'mailto:user@example.com', groupId: 'sys:start_page' },
        { id: 'ftp', title: 'FTP', url: 'ftp://example.com/file', groupId: 'sys:start_page' },
        { id: 'blob', title: 'Blob', url: 'blob:https://example.com/id', groupId: 'sys:start_page' },
        { id: 'custom', title: 'Custom', url: 'myapp://open', groupId: 'sys:start_page' },
        { id: 'relative', title: 'Relative', url: '/internal/path', groupId: 'sys:start_page' },
        { id: 'protocol-relative', title: 'Relative', url: '//example.com/path', groupId: 'sys:start_page' }
      ]
    });

    expect(result.bookmarks.map((bookmark) => bookmark.id)).toEqual(['https', 'http']);
  });
});
