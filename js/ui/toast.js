const TOAST_DURATION_MS = 2400;

/** @param {HTMLElement} region */
export function createToast(region) {
  /** @type {number | null} */
  let timer = null;

  /** @param {string} message */
  return function showToast(message) {
    if (timer !== null) {
      window.clearTimeout(timer);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    region.replaceChildren(toast);

    timer = window.setTimeout(() => {
      toast.remove();
    }, TOAST_DURATION_MS);
  };
}
