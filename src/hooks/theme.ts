import { useCallback, useEffect, useState } from 'react';

import { container } from 'src/application/container';
import { TOKENS } from 'src/tokens';
import { inArray } from 'src/utils/arrays';

import { useMediaQuery } from './media-query';

export type ThemeMode = 'light' | 'dark' | 'system';
type ThemeModeStrict = Exclude<ThemeMode, 'system'>;

const storage = container.resolve(TOKENS.storage);
const storedTheme = storage.value('koyeb.theme', {
  parse: (value) => (isThemeMode(value) ? value : 'system'),
  stringify: String,
});

const isThemeMode = (value: unknown): value is ThemeMode => {
  return inArray(value, ['light', 'dark', 'system']);
};

function getThemeMode(): ThemeMode {
  const theme = document.documentElement.getAttribute('data-theme');

  return isThemeMode(theme) ? theme : 'system';
}

function setThemeMode(theme: ThemeMode): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const classList = document.documentElement.classList;

  classList.remove('light');
  classList.remove('dark');
  classList.add(theme !== 'system' ? theme : prefersDark ? 'dark' : 'light');

  document.documentElement.setAttribute('data-theme', theme);
}

export function useThemeMode() {
  const [theme, setTheme] = useState(getThemeMode());

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(getThemeMode());
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  return theme;
}

export function useThemeModeOrPreferred(): ThemeModeStrict {
  const themeMode = useThemeMode();
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');

  if (themeMode === 'system') {
    return prefersDark ? 'dark' : 'light';
  }

  return themeMode;
}

export function useSetThemeMode() {
  return useCallback((theme: ThemeMode) => {
    setThemeMode(theme);
    storedTheme.write(theme);
  }, []);
}

export function useForceThemeMode(theme: ThemeModeStrict) {
  useEffect(() => {
    const initialValue = getThemeMode();

    if (theme === initialValue) {
      return;
    }

    setThemeMode(theme);

    return () => {
      setThemeMode(initialValue);
    };
  }, [theme]);
}
