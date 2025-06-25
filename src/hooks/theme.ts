import { usePrefersDarkMode } from '@koyeb/design-system';
import { useCallback, useEffect } from 'react';

import { isEnumValue } from 'src/utils/enums';

import { useLocalStorage } from './storage';

export enum ThemeMode {
  light = 'light',
  dark = 'dark',
  system = 'system',
}

const isThemeMode = isEnumValue(ThemeMode);

function parseThemeMode(value: string) {
  return isThemeMode(value) ? value : ThemeMode.light;
}

type ThemeModeStrict = Exclude<ThemeMode, ThemeMode.system>;

export function useThemeMode() {
  const systemTheme = useSystemThemeMode();

  const [storedTheme, setStoredTheme] = useLocalStorage('koyeb.theme', {
    parse: parseThemeMode,
    stringify: String,
  });

  const setTheme = useCallback(
    (theme: ThemeMode) => {
      const themeStrict = theme === ThemeMode.system ? systemTheme : theme;

      setStoredTheme(theme);
      setThemeMode(themeStrict);
    },
    [setStoredTheme, systemTheme],
  );

  useEffect(() => {
    if (!isThemeMode(storedTheme)) {
      setTheme(ThemeMode.system);
    }
  }, [storedTheme, setTheme]);

  return [storedTheme ?? ThemeMode.system, setTheme] as const;
}

function useSystemThemeMode(): ThemeModeStrict {
  return usePrefersDarkMode() ? ThemeMode.dark : ThemeMode.light;
}

export function useThemeModeOrPreferred(): ThemeModeStrict {
  const [theme] = useThemeMode();
  const systemTheme = useSystemThemeMode();

  if (theme === ThemeMode.system) {
    return systemTheme;
  }

  return theme;
}

export function useForceThemeMode(mode: ThemeModeStrict) {
  useEffect(() => {
    const currentTheme = getThemeMode();

    setThemeMode(mode);
    document.documentElement.setAttribute('data-theme', mode);

    return () => {
      document.documentElement.removeAttribute('data-theme');
      setThemeMode(currentTheme);
    };
  }, [mode]);
}

function getThemeMode(): ThemeModeStrict {
  return document.documentElement.classList.contains('dark') ? ThemeMode.dark : ThemeMode.light;
}

function setThemeMode(theme: ThemeModeStrict) {
  if (document.documentElement.hasAttribute('data-theme')) {
    return;
  }

  document.documentElement.classList.remove('dark', 'light');
  document.documentElement.classList.add(theme);
}
