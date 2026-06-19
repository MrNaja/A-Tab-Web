import { createElement, replaceChildren } from '../core/dom.js';
import { getVisibleBookmarks } from '../state/selectors.js';
import { getFaviconUrl } from '../services/favicon-service.js';

/** @param {import('../types').DividerBookmark} bookmark */
function createDivider(bookmark) {
  const divider = createElement('div', {
    className: 'divider-item',
    attributes: {
      role: 'separator',
      'aria-label': bookmark.title || undefined
    }
  });
  divider.appendChild(createElement('div', {
    className: 'divider-line',
    attributes: { 'aria-hidden': 'true' }
  }));
  if (bookmark.title) {
    divider.appendChild(createElement('span', { className: 'divider-title', text: bookmark.title }));
    divider.appendChild(createElement('div', {
      className: 'divider-line',
      attributes: { 'aria-hidden': 'true' }
    }));
  }
  return divider;
}

/**
 * @param {import('../types').LinkBookmark} bookmark
 * @param {import('../types').Translator} t
 */
function createBookmark(bookmark, t) {
  const item = createElement('div', {
    className: ['bookmark-item', bookmark.colorState ? `mark-${bookmark.colorState}` : '']
      .filter(Boolean)
      .join(' '),
    attributes: {
      title: bookmark.title
    }
  });
  const link = createElement('a', {
    className: 'bookmark-link',
    attributes: {
      href: bookmark.url,
      target: '_blank',
      rel: 'noopener noreferrer',
      'aria-label': `${t('openInNewTab')}: ${bookmark.title}`
    }
  });
  const favicon = createElement('img', {
    className: 'bookmark-favicon',
    attributes: {
      src: getFaviconUrl(bookmark),
      alt: '',
      loading: 'lazy'
    }
  });
  const title = createElement('span', {
    className: 'bookmark-title',
    text: bookmark.title
  });

  favicon.addEventListener('error', () => {
    favicon.style.visibility = 'hidden';
  }, { once: true });

  link.append(favicon, title);
  item.appendChild(link);
  return item;
}

/**
 * @param {string} title
 * @param {string} copy
 */
function createEmptyState(title, copy) {
  const wrapper = createElement('div', { className: 'empty-state' });
  const inner = createElement('div', { className: 'empty-state-inner' });
  inner.append(
    createElement('h2', { className: 'empty-title', text: title }),
    createElement('p', { className: 'empty-copy', text: copy })
  );
  wrapper.appendChild(inner);
  return wrapper;
}

/**
 * @param {HTMLElement} container
 * @param {import('../types').WebpageState} state
 * @param {import('../types').Translator} t
 */
export function renderBookmarksView(container, state, t) {
  const visibleBookmarks = getVisibleBookmarks(state);

  if (state.bookmarks.length === 0) {
    container.replaceChildren(createEmptyState(t('emptyTitle'), t('emptyCopy')));
    return;
  }

  if (visibleBookmarks.length === 0) {
    container.replaceChildren(createEmptyState(t('emptyGroup'), ''));
    return;
  }

  const grid = createElement('div', { className: 'bookmark-grid' });
  const children = visibleBookmarks.map((bookmark) =>
    bookmark.type === 'divider' ? createDivider(bookmark) : createBookmark(bookmark, t)
  );

  replaceChildren(grid, children);
  container.replaceChildren(grid);
}
