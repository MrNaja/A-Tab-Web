import { SYSTEM_GROUP_IDS } from '../core/constants.js';
import { createElement, replaceChildren } from '../core/dom.js';

/**
 * @param {import('../types').Group} group
 * @param {import('../types').WebpageState} state
 * @param {import('../types').Translator} t
 */
function createGroupButton(group, state, t) {
  const isStartPage = group.id === SYSTEM_GROUP_IDS.START_PAGE;
  const isActive = state.currentViewId === group.id;
  const button = createElement('button', {
    className: [
      'group-item',
      isActive ? 'is-active' : '',
      isStartPage ? 'is-system' : ''
    ].filter(Boolean).join(' '),
    attributes: {
      type: 'button',
      title: group.name,
      'aria-current': isActive ? 'page' : undefined
    },
    dataset: {
      viewId: group.id
    }
  });

  const name = createElement('span', {
    className: 'group-name',
    text: isStartPage ? t('startPage') : group.name
  });
  button.appendChild(name);
  return button;
}

/**
 * @param {HTMLElement} container
 * @param {import('../types').WebpageState} state
 * @param {import('../types').Translator} t
 */
export function renderGroupList(container, state, t) {
  const activeGroups = state.groups.filter((group) => !group.deletedAt);
  const sortedGroups = activeGroups.sort((a, b) => {
    if (a.id === SYSTEM_GROUP_IDS.START_PAGE) return -1;
    if (b.id === SYSTEM_GROUP_IDS.START_PAGE) return 1;
    return 0;
  });
  const children = sortedGroups.map((group) => createGroupButton(group, state, t));

  replaceChildren(container, children);
}
