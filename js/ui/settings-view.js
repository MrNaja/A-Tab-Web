import { createElement } from '../core/dom.js';

/**
 * @param {string} id
 * @param {string} value
 * @param {import('../types').SelectOption[]} options
 */
function createSelect(id, value, options) {
  const select = createElement('select', {
    className: 'setting-select',
    attributes: {
      id
    }
  });

  options.forEach((option) => {
    const optionElement = createElement('option', {
      text: option.label,
      attributes: {
        value: option.value
      }
    });
    optionElement.selected = option.value === value;
    select.appendChild(optionElement);
  });

  return select;
}

/**
 * @param {string} labelText
 * @param {HTMLElement} control
 */
function createSettingItem(labelText, control) {
  const item = createElement('div', { className: 'setting-item' });
  const controlWrapper = createElement('div', { className: 'setting-control' });
  controlWrapper.appendChild(control);
  const label = control.id
    ? createElement('label', {
      className: 'setting-label',
      text: labelText,
      attributes: { for: control.id }
    })
    : createElement('span', { className: 'setting-label', text: labelText });
  item.append(label, controlWrapper);
  return item;
}

/** @param {HTMLButtonElement[]} buttons */
function createButtonGroup(buttons) {
  const group = createElement('div', {
    className: 'settings-button-group',
    attributes: { role: 'group' }
  });
  group.append(...buttons);
  return group;
}

/**
 * @param {HTMLElement} container
 * @param {import('../types').WebpageState} state
 * @param {import('../types').Translator} t
 * @param {{githubPatAllowed?: boolean}} [options]
 */
export function renderSettingsView(container, state, t, options = {}) {
  const { githubPatAllowed = false } = options;
  const card = createElement('section', { className: 'settings-card' });
  const header = createElement('div', { className: 'card-header' });
  header.appendChild(createElement('h2', { className: 'card-title', text: t('settingsTitle') }));

  const content = createElement('div', { className: 'card-content' });
  const languageSelect = createSelect('languageSelect', state.preferences.language, [
    { value: 'zh-CN', label: '简体中文' },
    { value: 'en', label: 'English' }
  ]);
  const importButton = createElement('button', {
    className: 'settings-btn',
    text: t('importButton'),
    attributes: {
      type: 'button',
      id: 'importDataButton'
    }
  });
  const importGithubButton = createElement('button', {
    className: 'settings-btn',
    text: t('importGithubButton'),
    attributes: {
      type: 'button',
      id: 'importGithubDataButton',
      disabled: githubPatAllowed ? undefined : '',
      title: githubPatAllowed ? undefined : t('githubSecureContextRequired')
    }
  });
  const configureGithubButton = createElement('button', {
    className: 'settings-btn',
    text: t('configureButton'),
    attributes: {
      type: 'button',
      id: 'configureGithubButton',
      disabled: githubPatAllowed ? undefined : '',
      title: githubPatAllowed ? undefined : t('githubSecureContextRequired')
    }
  });
  const fontSizeSelect = createSelect('fontSizeSelect', state.preferences.fontSize, [
    { value: 'small', label: t('small') },
    { value: 'normal', label: t('normal') },
    { value: 'large', label: t('large') }
  ]);
  const githubSetting = createSettingItem(
    t('importGithubData'),
    createButtonGroup([importGithubButton, configureGithubButton])
  );
  githubSetting.querySelector('.settings-button-group')?.setAttribute('aria-label', t('importGithubData'));

  content.append(
    createSettingItem(t('language'), languageSelect),
    createSettingItem(t('fontSize'), fontSizeSelect),
    createSettingItem(t('importData'), importButton),
    githubSetting
  );
  if (!githubPatAllowed) {
    importGithubButton.setAttribute('aria-describedby', 'githubSecurityHint');
    configureGithubButton.setAttribute('aria-describedby', 'githubSecurityHint');
    content.appendChild(createElement('p', {
      className: 'setting-security-hint',
      text: t('githubSecureContextRequired'),
      attributes: { id: 'githubSecurityHint' }
    }));
  }
  card.append(header, content);
  container.replaceChildren(card);
}
