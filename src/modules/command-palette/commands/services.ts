import { useNavigate } from 'src/hooks/router';
import { IconBoxes, IconCpu, IconDatabase, IconDocker, IconGlobeLock, IconSquareCode } from 'src/icons';
import { createTranslate, useTranslate } from 'src/intl/translate';

import { useCommandPaletteContext } from '../command-palette-context';
import { CommandPalette } from '../use-command-palette';

const T = createTranslate('modules.commandPalette.commands.services:create');
type TranslateFn = ReturnType<typeof T.useTranslate>;

export function useCreateServicesCommands() {
  const t = T.useTranslate();
  const t2 = useTranslate();

  const palette = useCommandPaletteContext();
  const navigate = useNavigate();

  return () => {
    const contextId = 'services';

    palette.addContext({
      id: contextId,
      label: t2('modules.commandPalette.contexts.services'),
    });

    palette.addOption({
      id: 'create',
      contextId,
      label: t('label'),
      description: t('description'),
      Icon: IconBoxes,
      hasSubOptions: true,
      placeholder: t('placeholders.serviceType'),
      execute: () => onCreateService(palette, navigate, t),
    });
  };
}

type Navigate = ReturnType<typeof useNavigate>;

function onCreateService(palette: CommandPalette, navigate: Navigate, t: TranslateFn) {
  palette.addOption({
    id: 'web',
    label: t('options.web.label'),
    description: t('options.web.description'),
    Icon: IconSquareCode,
    hasSubOptions: true,
    placeholder: t('placeholders.deploymentSource'),
    execute: () => onServiceTypeSelected('web', palette, navigate, t),
  });

  palette.addOption({
    id: 'private',
    label: t('options.private.label'),
    description: t('options.private.description'),
    Icon: IconGlobeLock,
    hasSubOptions: true,
    placeholder: t('placeholders.deploymentSource'),
    execute: () => onServiceTypeSelected('private', palette, navigate, t),
  });

  palette.addOption({
    id: 'worker',
    label: t('options.worker.label'),
    description: t('options.worker.description'),
    Icon: IconCpu,
    hasSubOptions: true,
    placeholder: t('placeholders.deploymentSource'),
    execute: () => onServiceTypeSelected('worker', palette, navigate, t),
  });

  palette.addOption({
    id: 'database',
    label: t('options.database.label'),
    description: t('options.database.description'),
    Icon: IconDatabase,
    execute: () => navigate({ to: '/database-services/new' }),
  });
}

function onServiceTypeSelected(
  serviceType: 'web' | 'private' | 'worker',
  palette: Pick<CommandPalette, 'addContext' | 'addOption'>,
  navigate: Navigate,
  t: TranslateFn,
) {
  palette.addOption({
    id: 'github',
    label: t('options.github.label'),
    description: t('options.github.description'),
    Icon: IconSquareCode,
    execute: () => execute('git'),
  });

  palette.addOption({
    id: 'docker',
    label: t('options.docker.label'),
    description: t('options.docker.description'),
    Icon: IconDocker,
    execute: () => execute('docker'),
  });

  const execute = (source: 'git' | 'docker') => {
    navigate({
      to: '/services/new',
      search: {
        service_type: serviceType,
        step: 'importProject',
        type: source,
        ...(serviceType === 'private' && {
          service_type: 'web',
          ports: '8000;tcp',
        }),
      },
    });
  };
}
