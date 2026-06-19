import { CUSTOM_VIEW_ID } from '../core/constants.js';

/** @param {import('../types').WebpageState} state */
export function getVisibleBookmarks(state) {
  return state.bookmarks
    .filter((bookmark) => bookmark.groupId === state.currentViewId)
    .sort((a, b) => a.order - b.order);
}

/** @param {import('../types').WebpageState} state */
export function getCurrentGroup(state) {
  return state.groups.find((group) => group.id === state.currentViewId) || null;
}

/** @param {import('../types').WebpageState} state */
export function isCustomView(state) {
  return state.currentViewId === CUSTOM_VIEW_ID;
}
