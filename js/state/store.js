import { CUSTOM_VIEW_ID, DEFAULT_GROUPS, DEFAULT_PREFERENCES, SYSTEM_GROUP_IDS } from '../core/constants.js';

/**
 * @param {Partial<import('../types').WebpageState>} [initialState]
 * @returns {import('../types').WebpageStore}
 */
export function createStore(initialState = {}) {
  /** @type {import('../types').WebpageState} */
  let state = {
    bookmarks: [],
    groups: DEFAULT_GROUPS,
    currentViewId: SYSTEM_GROUP_IDS.START_PAGE,
    preferences: DEFAULT_PREFERENCES,
    ...initialState
  };
  const listeners = new Set();

  function notify() {
    listeners.forEach((listener) => listener(getState()));
  }

  /** @returns {import('../types').WebpageState} */
  function getState() {
    return {
      ...state,
      bookmarks: [...state.bookmarks],
      groups: [...state.groups],
      preferences: { ...state.preferences }
    };
  }

  /** @param {import('../types').StateUpdater} updater */
  function setState(updater) {
    state = typeof updater === 'function'
      ? { ...state, ...updater(getState()) }
      : { ...state, ...updater };
    notify();
  }

  return {
    getState,
    setState,
    /** @param {import('../types').StateListener} listener */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    actions: {
      /** @param {string} viewId */
      setCurrentView(viewId) {
        setState({ currentViewId: viewId });
      },
      /** @param {import('../types').NormalizedBackupData} data */
      setData(data) {
        setState({
          bookmarks: data.bookmarks,
          groups: data.groups.length > 0 ? data.groups : DEFAULT_GROUPS,
          currentViewId: data.groups.some((group) => group.id === state.currentViewId)
            ? state.currentViewId
            : SYSTEM_GROUP_IDS.START_PAGE
        });
      },
      /** @param {import('../types').Language} language */
      setLanguage(language) {
        setState((currentState) => ({
          preferences: {
            ...currentState.preferences,
            language
          }
        }));
      },
      /** @param {import('../types').FontSize} fontSize */
      setFontSize(fontSize) {
        setState((currentState) => ({
          preferences: {
            ...currentState.preferences,
            fontSize
          }
        }));
      },
      openCustomView() {
        setState({ currentViewId: CUSTOM_VIEW_ID });
      }
    }
  };
}
