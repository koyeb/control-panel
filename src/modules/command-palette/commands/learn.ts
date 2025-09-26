import { CommandPalette } from '@koyeb/design-system';

import { IconExternalLink, IconGlobe } from 'src/icons';
import { createTranslate, useTranslate } from 'src/intl/translate';

const T = createTranslate('modules.commandPalette.commands');

export function useLearnCommands() {
  const t = T.useTranslate();
  const t2 = useTranslate();

  return (palette: CommandPalette) => {
    const group = palette.addGroup({
      label: t2('modules.commandPalette.contexts.learn'),
    });

    group.addItem({
      label: t('learn:community.label'),
      description: t('learn:community.description'),
      Icon: IconExternalLink,
      execute: () => window.open('http://community.koyeb.com'),
    });

    group.addItem({
      label: t('learn:koyeb.com.label'),
      description: t('learn:koyeb.com.description'),
      Icon: IconGlobe,
      execute: () => window.open('http://www.koyeb.com'),
    });

    return () => {
      group.remove();
    };
  };
}
