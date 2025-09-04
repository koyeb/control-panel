import { IconExternalLink, IconGlobe } from 'src/icons';
import { createTranslate, useTranslate } from 'src/intl/translate';

import { useCommandPaletteContext } from '../command-palette-context';

const T = createTranslate('modules.commandPalette.commands');

export function useLearnCommands() {
  const t = T.useTranslate();
  const t2 = useTranslate();

  const palette = useCommandPaletteContext();

  return () => {
    const contextId = 'learn';

    palette.addContext({
      id: contextId,
      label: t2('modules.commandPalette.contexts.learn'),
    });

    palette.addOption({
      id: 'community',
      contextId,
      label: t('learn:community.label'),
      description: t('learn:community.description'),
      Icon: IconExternalLink,
      execute: () => window.open('http://community.koyeb.com'),
    });

    palette.addOption({
      id: 'koyeb.com',
      contextId,
      label: t('learn:koyeb.com.label'),
      description: t('learn:koyeb.com.description'),
      Icon: IconGlobe,
      execute: () => window.open('http://www.koyeb.com'),
    });
  };
}
