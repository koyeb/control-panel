import { useLogoutMutation } from 'src/api/hooks/session';
import { useSetThemeMode } from 'src/hooks/theme';
import { IconLaptop, IconLogOut, IconMoon, IconSunDim, IconSunMoon } from 'src/icons';
import { createTranslate, useTranslate } from 'src/intl/translate';
import { capitalize } from 'src/utils/strings';

import { useCommandPaletteContext } from '../command-palette-context';

const T = createTranslate('modules.commandPalette.commands');

export function useSettingsCommands() {
  const t = T.useTranslate();
  const t2 = useTranslate();

  const palette = useCommandPaletteContext();
  const logout = useLogoutMutation('/auth/signin');
  const setTheme = useSetThemeMode();

  return () => {
    const contextId = 'settings';

    palette.addContext({
      id: contextId,
      label: t2('modules.commandPalette.contexts.settings'),
    });

    palette.addOption({
      id: 'changeThemeMode',
      contextId,
      label: t('settings:changeThemeMode.label'),
      description: t('settings:changeThemeMode.description'),
      Icon: IconSunMoon,
      hasSubOptions: true,
      placeholder: 'Select a theme mode',
      execute: () => {
        const icons = {
          light: IconSunDim,
          dark: IconMoon,
          system: IconLaptop,
        };

        for (const mode of ['light', 'dark', 'system'] as const) {
          palette.addOption({
            id: mode,
            label: capitalize(mode),
            description: `Switch to ${mode} mode`,
            Icon: icons[mode],
            execute: () => setTheme(mode),
          });
        }
      },
    });

    palette.addOption({
      id: 'logout',
      contextId,
      label: t('settings:logout.label'),
      description: t('settings:logout.description'),
      Icon: IconLogOut,
      execute: logout.mutateAsync,
    });
  };
}
