import { CommandPalette } from '@koyeb/design-system';

import { useLogoutMutation } from 'src/api';
import { useSetThemeMode } from 'src/hooks/theme';
import { IconLaptop, IconLogOut, IconMoon, IconSunDim, IconSunMoon } from 'src/icons';
import { createTranslate, useTranslate } from 'src/intl/translate';
import { capitalize } from 'src/utils/strings';

const T = createTranslate('modules.commandPalette.commands');

export function useSettingsCommands() {
  const t = T.useTranslate();
  const t2 = useTranslate();

  const logout = useLogoutMutation('/auth/signin');
  const setTheme = useSetThemeMode();

  return (palette: CommandPalette) => {
    const group = palette.addGroup({
      label: t2('modules.commandPalette.contexts.settings'),
    });

    group.addItem({
      label: t('settings:changeThemeMode.label'),
      description: t('settings:changeThemeMode.description'),
      Icon: IconSunMoon,
      hasSubItems: true,
      execute: () => {
        // todo: translation
        palette.setPlaceholder('Select a theme mode');

        const icons = {
          light: IconSunDim,
          dark: IconMoon,
          system: IconLaptop,
        };

        for (const mode of ['light', 'dark', 'system'] as const) {
          palette.addItem({
            label: capitalize(mode),
            description: `Switch to ${mode} mode`,
            Icon: icons[mode],
            execute: () => setTheme(mode),
          });
        }
      },
    });

    group.addItem({
      label: t('settings:logout.label'),
      description: t('settings:logout.description'),
      Icon: IconLogOut,
      execute: logout.mutateAsync,
    });

    return () => {
      group.remove();
    };
  };
}
