import { DEFAULT_PREFERENCES, STORAGE_KEYS } from '../core/constants.js';
import { normalizeBackupData } from './import-service.js';

/**
 * @template T
 * @param {Storage} storage
 * @param {string} key
 * @param {T} fallback
 * @returns {T}
 */
function readJson(storage, key, fallback) {
  try {
    const value = storage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (_error) {
    return fallback;
  }
}

/** @returns {import('../types').Preferences} */
export function loadPreferences() {
  return {
    ...DEFAULT_PREFERENCES,
    ...readJson(localStorage, STORAGE_KEYS.PREFERENCES, {})
  };
}

/** @param {import('../types').Preferences} preferences */
export function savePreferences(preferences) {
  localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
}

/** @returns {import('../types').NormalizedBackupData | null} */
export function loadData() {
  const rawData = readJson(localStorage, STORAGE_KEYS.DATA, null);
  if (!rawData) {
    return null;
  }

  try {
    return normalizeBackupData(rawData);
  } catch (_error) {
    localStorage.removeItem(STORAGE_KEYS.DATA);
    return null;
  }
}

/** @param {import('../types').NormalizedBackupData} data */
export function saveData(data) {
  localStorage.setItem(
    STORAGE_KEYS.DATA,
    JSON.stringify({
      bookmarks: data.bookmarks,
      groups: data.groups,
      importedAt: data.importedAt
    })
  );
}

/** @returns {import('../types').GithubConfig} */
export function loadGithubConfig() {
  // Previous builds persisted the PAT in localStorage. Purge it before reading
  // the session-scoped replacement.
  localStorage.removeItem(STORAGE_KEYS.GITHUB_CONFIG);
  const config = readJson(
    sessionStorage,
    STORAGE_KEYS.GITHUB_SESSION_CONFIG,
    /** @type {Partial<import('../types').GithubConfig>} */ ({})
  );
  return {
    token: typeof config.token === 'string' ? config.token : '',
    login: typeof config.login === 'string' ? config.login : '',
    updatedAt: typeof config.updatedAt === 'number' && Number.isFinite(config.updatedAt)
      ? config.updatedAt
      : null
  };
}

/** @param {{token: string, login?: string}} config */
export function saveGithubConfig(config) {
  localStorage.removeItem(STORAGE_KEYS.GITHUB_CONFIG);
  sessionStorage.setItem(
    STORAGE_KEYS.GITHUB_SESSION_CONFIG,
    JSON.stringify({
      token: config.token,
      login: config.login || '',
      updatedAt: Date.now()
    })
  );
}

export function clearGithubConfig() {
  localStorage.removeItem(STORAGE_KEYS.GITHUB_CONFIG);
  sessionStorage.removeItem(STORAGE_KEYS.GITHUB_SESSION_CONFIG);
}
