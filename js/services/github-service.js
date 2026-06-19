import { normalizeBackupData } from './import-service.js';

const API_BASE = 'https://api.github.com';
const REPO_NAME = 'a-tab-backup';
const BACKUP_FILE_PATH = 'backup.json';
const HTTP_NOT_FOUND = 404;
const RAW_CONTENT_ACCEPT = 'application/vnd.github.raw+json';

export function isGithubPatAllowed() {
  return globalThis.isSecureContext === true;
}

function assertGithubPatAllowed() {
  if (!isGithubPatAllowed()) {
    throw new Error('Github PAT access requires a secure context');
  }
}

/** @param {string} token */
function createAuthHeaders(token) {
  return {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github+json'
  };
}

/**
 * @param {Response} response
 * @param {string} fallback
 */
async function readErrorMessage(response, fallback) {
  try {
    const data = await response.json();
    return data.message || fallback;
  } catch (_error) {
    return fallback;
  }
}

/** @param {string} content */
function decodeBase64Utf8(content) {
  const binary = atob(content.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
/**
 * @param {string} url
 * @param {string} token
 */
async function downloadRawContent(url, token) {
  const response = await fetch(url, {
    headers: {
      ...createAuthHeaders(token),
      Accept: RAW_CONTENT_ACCEPT
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Github raw download failed'));
  }

  return response.text();
}

/**
 * @param {string} token
 * @returns {Promise<{login: string}>}
 */
export async function testGithubToken(token) {
  assertGithubPatAllowed();
  const response = await fetch(`${API_BASE}/user`, {
    headers: createAuthHeaders(token)
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Github token invalid'));
  }

  return /** @type {Promise<{login: string}>} */ (response.json());
}

/**
 * @param {string} token
 * @returns {Promise<import('../types').NormalizedBackupData>}
 */
export async function downloadGithubBackup(token) {
  assertGithubPatAllowed();
  const user = await testGithubToken(token);
  const owner = user.login;
  const url = `${API_BASE}/repos/${owner}/${REPO_NAME}/contents/${BACKUP_FILE_PATH}`;
  const response = await fetch(url, {
    headers: createAuthHeaders(token),
    cache: 'no-store'
  });

  if (response.status === HTTP_NOT_FOUND) {
    throw new Error('Github backup.json not found');
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Github download failed'));
  }

  const fileInfo = /** @type {{content?: string}} */ (await response.json());
  const jsonText = fileInfo.content
    ? decodeBase64Utf8(fileInfo.content)
    : await downloadRawContent(url, token);
  return normalizeBackupData(JSON.parse(jsonText));
}
