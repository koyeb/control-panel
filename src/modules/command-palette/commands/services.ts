import { CommandPalette } from '@koyeb/design-system';

import { useNavigate } from 'src/hooks/router';
import { IconBoxes, IconCpu, IconDatabase, IconDocker, IconGlobeLock, IconSquareCode } from 'src/icons';
import { createTranslate, useTranslate } from 'src/intl/translate';

const T = createTranslate('modules.commandPalette.commands.services:create');
type TranslateFn = ReturnType<typeof T.useTranslate>;

export function useServicesCommands() {
  const t = T.useTranslate();
  const t2 = useTranslate();

  const navigate = useNavigate();

  return (palette: CommandPalette) => {
    const group = palette.addGroup({
      label: t2('modules.commandPalette.contexts.services'),
    });

    group.addItem({
      label: t('label'),
      description: t('description'),
      Icon: IconBoxes,
      hasSubItems: true,
      execute: () => onCreateService(palette, navigate, t),
    });

    return () => {
      group.remove();
    };
  };
}

type Navigate = ReturnType<typeof useNavigate>;

function onCreateService(palette: CommandPalette, navigate: Navigate, t: TranslateFn) {
  palette.setIcon(IconBoxes);
  palette.setPlaceholder(t('placeholders.serviceType'));

  palette.addItem({
    label: t('options.web.label'),
    description: t('options.web.description'),
    Icon: IconSquareCode,
    hasSubItems: true,
    execute: () => {
      palette.setIcon(IconSquareCode);
      onServiceTypeSelected('web', palette, navigate, t);
    },
  });

  palette.addItem({
    label: t('options.private.label'),
    description: t('options.private.description'),
    Icon: IconGlobeLock,
    hasSubItems: true,
    execute: () => {
      palette.setIcon(IconGlobeLock);
      onServiceTypeSelected('private', palette, navigate, t);
    },
  });

  palette.addItem({
    label: t('options.worker.label'),
    description: t('options.worker.description'),
    Icon: IconCpu,
    hasSubItems: true,
    execute: () => {
      palette.setIcon(IconCpu);
      onServiceTypeSelected('worker', palette, navigate, t);
    },
  });

  palette.addItem({
    label: t('options.database.label'),
    description: t('options.database.description'),
    Icon: IconDatabase,
    execute: () => navigate({ to: '/database-services/new' }),
  });
}

function onServiceTypeSelected(
  serviceType: 'web' | 'private' | 'worker',
  palette: CommandPalette,
  navigate: Navigate,
  t: TranslateFn,
) {
  palette.setPlaceholder(t('placeholders.deploymentSource'));

  palette.addItem({
    label: t('options.github.label'),
    description: t('options.github.description'),
    Icon: IconSquareCode,
    execute: () => execute('git'),
  });

  palette.addItem({
    label: t('options.docker.label'),
    description: t('options.docker.description'),
    Icon: IconDocker,
    execute: () => execute('docker'),
  });

  const execute = (source: 'git' | 'docker') => {
    return navigate({
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
