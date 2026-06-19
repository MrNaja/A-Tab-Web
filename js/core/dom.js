/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tagName
 * @param {import('../types').CreateElementOptions} [options]
 * @returns {HTMLElementTagNameMap[K]}
 */
export function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);
  const {
    className,
    text,
    attributes = {},
    dataset = {}
  } = options;

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = String(text);
  }

  Object.entries(attributes).forEach(([name, value]) => {
    if (value !== undefined && value !== null) {
      element.setAttribute(name, String(value));
    }
  });

  Object.entries(dataset).forEach(([name, value]) => {
    if (value !== undefined && value !== null) {
      element.dataset[name] = String(value);
    }
  });

  return element;
}

/** @param {string} id */
export function getRequiredElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: ${id}`);
  }
  return element;
}

/**
 * @param {HTMLElement} parent
 * @param {Node[]} children
 */
export function replaceChildren(parent, children) {
  const fragment = document.createDocumentFragment();
  children.forEach((child) => fragment.appendChild(child));
  parent.replaceChildren(fragment);
}
