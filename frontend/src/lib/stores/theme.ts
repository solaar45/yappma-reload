import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const THEME_KEY = 'yappma-theme';
const DEFAULT_THEME = 'light';

// Theme aus localStorage laden oder Default
const getInitialTheme = (): string => {
  if (!browser) return DEFAULT_THEME;
  return localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
};

export const theme = writable<string>(getInitialTheme());

// Theme ändern und speichern
export const setTheme = (newTheme: string) => {
  if (browser) {
    localStorage.setItem(THEME_KEY, newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }
  theme.set(newTheme);
};

// Theme beim App-Start setzen
if (browser) {
  document.documentElement.setAttribute('data-theme', getInitialTheme());
}