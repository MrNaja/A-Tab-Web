import { createElement } from '../core/dom.js';

/**
 * @param {string} id
 * @param {string} text
 * @param {'primary' | 'secondary'} [variant]
 */
function createDialogButton(id, text, variant = 'secondary') {
  return createElement('button', {
    className: `settings-btn settings-btn-${variant}`,
    text,
    attributes: {
      type: 'button',
      id
    }
  });
}

/**
 * @param {{
 *   config: import('../types').GithubConfig,
 *   t: import('../types').Translator,
 *   onSave: (token: string, close: () => void) => Promise<void>,
 *   onClear: (close: () => void) => void,
 *   onClose?: () => void
 * }} options
 */
export function openGithubConfigDialog({ config, t, onSave, onClear, onClose }) {
  const previouslyFocused = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
  const overlay = createElement('div', { className: 'modal-overlay' });
  const appShell = document.querySelector('.app-shell');
  const dialog = createElement('section', {
    className: 'modal-dialog',
    attributes: {
      role: 'dialog',
      tabindex: '-1',
      'aria-modal': 'true',
      'aria-labelledby': 'githubConfigTitle',
      'aria-describedby': 'githubConfigHelp githubConfigStatus'
    }
  });
  const header = createElement('div', { className: 'modal-header' });
  const content = createElement('div', { className: 'modal-content' });
  const footer = createElement('div', { className: 'modal-footer' });
  const statusText = config.token ? t('githubConfigured') : t('githubNotConfigured');
  const statusClass = config.token ? 'is-configured' : 'is-empty';
  const input = createElement('input', {
    className: 'settings-input',
    attributes: {
      id: 'githubTokenInput',
      type: 'password',
      placeholder: t('githubTokenPlaceholder'),
      autocomplete: 'off',
      autocapitalize: 'none',
      spellcheck: 'false'
    }
  });

  let closed = false;

  function close() {
    if (closed) return;
    closed = true;
    overlay.remove();
    if (appShell instanceof HTMLElement) {
      appShell.inert = false;
    }
    onClose?.();
    previouslyFocused?.focus();
  }

  function getFocusableElements() {
    return Array.from(dialog.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter((element) => element instanceof HTMLElement);
  }

  header.appendChild(createElement('h3', {
    className: 'modal-title',
    text: t('githubConfigTitle'),
    attributes: {
      id: 'githubConfigTitle'
    }
  }));
  content.append(
    createElement('p', {
      className: 'modal-help',
      text: t('githubConfigHelp'),
      attributes: { id: 'githubConfigHelp' }
    }),
    createElement('label', {
      className: 'settings-field-label',
      text: t('githubToken'),
      attributes: {
        for: 'githubTokenInput'
      }
    }),
    input,
    createElement('div', {
      className: `config-status ${statusClass}`,
      text: `${t('githubStatus')}: ${statusText}`,
      attributes: { id: 'githubConfigStatus' }
    })
  );
  const footerButtons = [createDialogButton('githubConfigCancelButton', t('githubCancel'))];
  if (config.token) {
    footerButtons.push(createDialogButton('githubConfigClearButton', t('githubClear')));
  }
  footerButtons.push(createDialogButton('githubConfigSaveButton', t('githubSave'), 'primary'));
  footer.append(...footerButtons);
  dialog.append(header, content, footer);
  overlay.appendChild(dialog);
  if (appShell instanceof HTMLElement) {
    appShell.inert = true;
  }
  document.body.appendChild(overlay);
  input.focus();

  overlay.addEventListener('click', (event) => {
    if (!(event.target instanceof HTMLElement)) return;

    if (event.target === overlay || event.target.id === 'githubConfigCancelButton') {
      close();
    }

    if (event.target.id === 'githubConfigClearButton') {
      onClear(close);
    }
  });

  overlay.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }

    if (event.key === 'Tab') {
      const focusableElements = getFocusableElements();
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (!first || !last) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  const saveButton = overlay.querySelector('#githubConfigSaveButton');
  if (!(saveButton instanceof HTMLButtonElement)) {
    throw new Error('Missing Github config save button');
  }
  saveButton.addEventListener('click', async () => {
    if (saveButton.disabled) return;
    saveButton.disabled = true;
    dialog.setAttribute('aria-busy', 'true');
    try {
      await onSave(input.value.trim(), close);
    } finally {
      if (!closed) {
        saveButton.disabled = false;
        dialog.removeAttribute('aria-busy');
      }
    }
  });
}
