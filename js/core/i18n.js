import { I18N } from './constants.js';

/**
 * @param {() => import('../types').Language} getLanguage
 * @returns {import('../types').Translator}
 */
export function createTranslator(getLanguage) {
  /**
   * @param {string} key
   * @param {Record<string, string | number>} [substitutions]
   */
  return function translate(key, substitutions = {}) {
    const language = getLanguage();
    const dictionary = I18N[language] || I18N['zh-CN'];
    const fallback = I18N['zh-CN'][key] || key;
    const template = dictionary[key] || fallback;

    return Object.entries(substitutions).reduce(
      (text, [name, value]) => text.split(`{${name}}`).join(String(value)),
      template
    );
  };
}
