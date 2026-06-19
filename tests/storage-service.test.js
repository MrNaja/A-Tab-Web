import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../js/core/constants.js';
import {
  clearGithubConfig,
  loadGithubConfig,
  saveGithubConfig
} from '../js/services/storage-service.js';

describe('webpage Github credential storage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('stores the PAT only in the current tab session', () => {
    saveGithubConfig({ token: 'secret-token', login: 'octo' });

    expect(localStorage.getItem(STORAGE_KEYS.GITHUB_CONFIG)).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEYS.GITHUB_SESSION_CONFIG)).toContain('secret-token');
    expect(loadGithubConfig()).toMatchObject({ token: 'secret-token', login: 'octo' });
  });

  it('purges legacy localStorage credentials when loading config', () => {
    localStorage.setItem(
      STORAGE_KEYS.GITHUB_CONFIG,
      JSON.stringify({ token: 'legacy-secret', login: 'octo' })
    );

    expect(loadGithubConfig().token).toBe('');
    expect(localStorage.getItem(STORAGE_KEYS.GITHUB_CONFIG)).toBeNull();
  });

  it('clears both current and legacy credential locations', () => {
    saveGithubConfig({ token: 'secret-token', login: 'octo' });
    localStorage.setItem(STORAGE_KEYS.GITHUB_CONFIG, JSON.stringify({ token: 'legacy-secret' }));

    clearGithubConfig();

    expect(sessionStorage.getItem(STORAGE_KEYS.GITHUB_SESSION_CONFIG)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.GITHUB_CONFIG)).toBeNull();
  });
});
