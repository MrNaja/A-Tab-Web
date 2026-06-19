import {
  DEFAULT_GROUPS,
  isAllowedImportedGroupId,
  SYSTEM_GROUP_IDS
} from '../core/constants.js';

const MAX_COLOR_STATE = 3;
const ALLOWED_BOOKMARK_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * @param {unknown} value
 * @returns {value is Record<string, any>}
 */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** @param {unknown} value */
function isSafeBookmarkUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return false;
  }

  try {
    const protocol = new URL(value.trim()).protocol.toLowerCase();
    return ALLOWED_BOOKMARK_PROTOCOLS.has(protocol);
  } catch (_error) {
    return false;
  }
}

/**
 * @param {unknown} group
 * @returns {import('../types').Group | null}
 */
function normalizeGroup(group) {
  if (!isPlainObject(group)) {
    return null;
  }

  const id = typeof group.id === 'string' ? group.id.trim() : '';
  const name = typeof group.name === 'string' ? group.name.trim() : '';

  if (!name || !isAllowedImportedGroupId(id) || group.deletedAt) {
    return null;
  }

  return {
    id,
    name,
    type: group.type === 'system' ? 'system' : 'user',
    deletedAt: null
  };
}

/**
 * @param {unknown} bookmark
 * @param {number} index
 * @param {Set<string>} validGroupIds
 * @returns {import('../types').Bookmark | null}
 */
function normalizeBookmark(bookmark, index, validGroupIds) {
  if (!isPlainObject(bookmark)) {
    return null;
  }

  const id = typeof bookmark.id === 'string' && bookmark.id ? bookmark.id : `web-${index}`;
  const groupId = validGroupIds.has(bookmark.groupId)
    ? bookmark.groupId
    : SYSTEM_GROUP_IDS.START_PAGE;

  if (bookmark.groupId === SYSTEM_GROUP_IDS.RECYCLE_BIN || bookmark.deletedAt) {
    return null;
  }

  if (bookmark.type === 'divider') {
    return {
      id,
      type: 'divider',
      title: typeof bookmark.title === 'string' ? bookmark.title : '',
      groupId,
      order: Number.isFinite(bookmark.order) ? bookmark.order : index
    };
  }

  if (!isSafeBookmarkUrl(bookmark.url)) {
    return null;
  }

  return {
    id,
    title: typeof bookmark.title === 'string' && bookmark.title.trim()
      ? bookmark.title.trim()
      : bookmark.url,
    url: bookmark.url.trim(),
    groupId,
    order: Number.isFinite(bookmark.order) ? bookmark.order : index,
    colorState: normalizeColorState(bookmark.colorState)
  };
}

/** @param {unknown} value */
function normalizeColorState(value) {
  const colorState = Number(value);
  return Number.isInteger(colorState) && colorState >= 1 && colorState <= MAX_COLOR_STATE
    ? colorState
    : 0;
}

/**
 * @param {unknown[]} bookmarks
 * @returns {import('../types').Group[]}
 */
function inferGroupsFromBookmarks(bookmarks) {
  const groupIds = new Set(
    bookmarks
      .filter((bookmark) =>
        isPlainObject(bookmark)
        && !bookmark.deletedAt
        && isAllowedImportedGroupId(bookmark.groupId)
        && (bookmark.type === 'divider' || isSafeBookmarkUrl(bookmark.url))
      )
      .map((bookmark) => isPlainObject(bookmark) ? bookmark.groupId : null)
      .filter(Boolean)
  );
  return Array.from(groupIds)
    .map((id) => ({
      id,
      name: id === SYSTEM_GROUP_IDS.START_PAGE ? '起始页' : id,
      type: id === SYSTEM_GROUP_IDS.START_PAGE ? 'system' : 'user',
      deletedAt: null
    }));
}

/**
 * @param {import('../types').Group[]} groups
 * @returns {import('../types').Group[]}
 */
function ensureStartPage(groups) {
  if (groups.some((group) => group.id === SYSTEM_GROUP_IDS.START_PAGE)) {
    return groups;
  }

  return [DEFAULT_GROUPS[0], ...groups];
}

/**
 * @param {unknown} data
 * @returns {import('../types').NormalizedBackupData}
 */
export function normalizeBackupData(data) {
  if (!isPlainObject(data) || !Array.isArray(data.bookmarks)) {
    throw new Error('Invalid A Tab backup payload');
  }

  const hasExplicitGroups = Array.isArray(data.groups);
  const normalizedGroups = ensureStartPage(
    hasExplicitGroups ? data.groups.map(normalizeGroup).filter(Boolean) : []
  );
  const inferredGroups = hasExplicitGroups ? [] : inferGroupsFromBookmarks(data.bookmarks);
  const groupsById = new Map();

  [...normalizedGroups, ...inferredGroups, ...DEFAULT_GROUPS].forEach((group) => {
    if (!groupsById.has(group.id)) {
      groupsById.set(group.id, group);
    }
  });

  const groups = Array.from(groupsById.values());
  const validGroupIds = new Set(groups.map((group) => group.id));
  const bookmarks = data.bookmarks
    .map((bookmark, index) => normalizeBookmark(bookmark, index, validGroupIds))
    .filter((bookmark) => bookmark !== null)
    .sort((a, b) => a.order - b.order);

  return {
    bookmarks,
    groups,
    importedAt: Date.now()
  };
}

/**
 * @param {File} file
 * @returns {Promise<import('../types').NormalizedBackupData>}
 */
export async function parseBackupFile(file) {
  const text = await file.text();
  return normalizeBackupData(JSON.parse(text));
}
