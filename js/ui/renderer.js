import { getCurrentGroup, getVisibleBookmarks, isCustomView } from '../state/selectors.js';
import { renderBookmarksView } from './bookmarks-view.js';
import { renderGroupList } from './group-list-view.js';
import { renderSettingsView } from './settings-view.js';

/**
 * @param {import('../types').RendererElements} elements
 * @param {import('../types').Translator} t
 * @param {{githubPatAllowed?: boolean}} [options]
 */
export function createRenderer(elements, t, options = {}) {
  const { githubPatAllowed = false } = options;

  /** @param {import('../types').WebpageState} state */
  return function render(state) {
    document.documentElement.lang = state.preferences.language;
    document.documentElement.dataset.fontSize = state.preferences.fontSize;
    elements.skipLink.textContent = t('skipToContent');
    elements.groupsSidebar.setAttribute('aria-label', t('groupsNavigation'));
    elements.groupList.setAttribute('aria-label', t('groupsNavigation'));

    renderGroupList(elements.groupList, state, t);

    const customView = isCustomView(state);
    elements.settingsButton.classList.toggle('is-active', customView);
    elements.settingsButton.title = t('custom');
    elements.settingsButton.setAttribute('aria-label', t('custom'));
    if (customView) {
      elements.settingsButton.setAttribute('aria-current', 'page');
    } else {
      elements.settingsButton.removeAttribute('aria-current');
    }
    elements.bookmarksView.hidden = customView;
    elements.settingsView.hidden = !customView;

    if (customView) {
      renderSettingsView(elements.settingsView, state, t, { githubPatAllowed });
    } else {
      renderBookmarksView(elements.bookmarksView, state, t);
    }

    const currentGroup = getCurrentGroup(state);
    const count = customView ? state.bookmarks.length : getVisibleBookmarks(state).filter((b) => b.type !== 'divider').length;
    const viewName = customView ? t('custom') : currentGroup?.name || t('startPage');
    elements.currentGroupBadge.textContent = t('bookmarkCount', { count });
    elements.currentGroupBadge.title = viewName;
    elements.currentGroupBadge.setAttribute('aria-label', t('bookmarkCountLabel', {
      group: viewName,
      count
    }));
    elements.viewTitle.textContent = viewName;
    elements.viewStatus.textContent = t('bookmarkCountLabel', { group: viewName, count });
  };
}
