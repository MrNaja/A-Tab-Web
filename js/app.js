import { CUSTOM_VIEW_ID } from './core/constants.js';
import { getRequiredElement } from './core/dom.js';
import { createTranslator } from './core/i18n.js';
import {
  downloadGithubBackup,
  isGithubPatAllowed,
  testGithubToken
} from './services/github-service.js';
import { parseBackupFile } from './services/import-service.js';
import {
  clearGithubConfig,
  loadData,
  loadGithubConfig,
  loadPreferences,
  saveData,
  saveGithubConfig,
  savePreferences
} from './services/storage-service.js';
import { createStore } from './state/store.js';
import { openGithubConfigDialog } from './ui/github-config-dialog.js';
import { createRenderer } from './ui/renderer.js';
import { createToast } from './ui/toast.js';

/** @type {import('./types').RendererElements} */
const elements = {
  skipLink: /** @type {HTMLAnchorElement} */ (getRequiredElement('skipLink')),
  groupsSidebar: getRequiredElement('groupsSidebar'),
  groupList: getRequiredElement('groupList'),
  bookmarksView: getRequiredElement('bookmarksView'),
  settingsView: getRequiredElement('settingsView'),
  currentGroupBadge: getRequiredElement('currentGroupBadge'),
  viewTitle: getRequiredElement('viewTitle'),
  viewStatus: getRequiredElement('viewStatus'),
  settingsButton: /** @type {HTMLButtonElement} */ (getRequiredElement('settingsButton')),
  importFileInput: /** @type {HTMLInputElement} */ (getRequiredElement('importFileInput')),
  toastRegion: getRequiredElement('toastRegion')
};

const storedData = loadData();
const store = createStore({
  ...(storedData || {}),
  preferences: loadPreferences()
});
const t = createTranslator(() => store.getState().preferences.language);
const githubPatAllowed = isGithubPatAllowed();
// Loading also purges PATs persisted by earlier builds.
loadGithubConfig();
const render = createRenderer(elements, t, { githubPatAllowed });
const showToast = createToast(elements.toastRegion);

function persistPreferences() {
  savePreferences(store.getState().preferences);
}

/**
 * @param {string} token
 * @param {() => void} closeDialog
 */
async function handleGithubConfigSave(token, closeDialog) {
  if (!githubPatAllowed) {
    showToast(t('githubSecureContextRequired'));
    return;
  }

  if (!token) {
    showToast(t('githubTokenRequired'));
    return;
  }

  try {
    const user = await testGithubToken(token);
    saveGithubConfig({
      token,
      login: user.login
    });
    showToast(t('githubConfigSaved'));
    closeDialog();
  } catch (_error) {
    showToast(t('githubConfigInvalid'));
  }
}

/** @param {() => void} closeDialog */
function handleGithubConfigClear(closeDialog) {
  clearGithubConfig();
  showToast(t('githubConfigCleared'));
  closeDialog();
}

async function handleGithubImport() {
  if (!githubPatAllowed) {
    showToast(t('githubSecureContextRequired'));
    return;
  }

  const config = loadGithubConfig();
  if (!config.token) {
    showToast(t('githubNeedConfig'));
    return;
  }

  if (!window.confirm(t('githubImportConfirm'))) {
    return;
  }

  try {
    const data = await downloadGithubBackup(config.token);
    saveData(data);
    store.actions.setData(data);
    showToast(t('githubImportSuccess'));
  } catch (_error) {
    showToast(t('githubImportFailed'));
  }
}

function bindEvents() {
  elements.groupList.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('.group-item');
    if (!(button instanceof HTMLElement)) return;

    const viewId = button.dataset.viewId || CUSTOM_VIEW_ID;
    store.actions.setCurrentView(viewId);
    const replacementButton = elements.groupList.querySelector(`[data-view-id="${CSS.escape(viewId)}"]`);
    if (replacementButton instanceof HTMLElement) {
      replacementButton.focus();
    }
  });

  elements.settingsButton.addEventListener('click', () => {
    store.actions.openCustomView();
  });

  elements.settingsView.addEventListener('change', (event) => {
    if (!(event.target instanceof HTMLSelectElement)) return;

    if (event.target.id === 'languageSelect') {
      store.actions.setLanguage(/** @type {import('./types').Language} */ (event.target.value));
      persistPreferences();
      document.getElementById('languageSelect')?.focus();
    }

    if (event.target.id === 'fontSizeSelect') {
      store.actions.setFontSize(/** @type {import('./types').FontSize} */ (event.target.value));
      persistPreferences();
      document.getElementById('fontSizeSelect')?.focus();
    }
  });

  elements.settingsView.addEventListener('click', (event) => {
    if (!(event.target instanceof HTMLElement)) return;

    if (event.target.id === 'importDataButton') {
      elements.importFileInput.click();
    }

    if (event.target.id === 'configureGithubButton') {
      if (!githubPatAllowed) {
        showToast(t('githubSecureContextRequired'));
        return;
      }

      openGithubConfigDialog({
        config: loadGithubConfig(),
        t,
        onSave: handleGithubConfigSave,
        onClear: handleGithubConfigClear
      });
    }

    if (event.target.id === 'importGithubDataButton') {
      void handleGithubImport();
    }
  });

  elements.importFileInput.addEventListener('change', async (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const [file] = event.target.files || [];
    if (!file) return;

    try {
      const data = await parseBackupFile(file);
      saveData(data);
      store.actions.setData(data);
      showToast(t('importSuccess'));
    } catch (_error) {
      showToast(t('importFailed'));
    } finally {
      event.target.value = '';
    }
  });
}

store.subscribe(render);
bindEvents();
render(store.getState());
