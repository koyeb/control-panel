import { CommandPalette } from '@koyeb/design-system';

import { useApi, useSwitchOrganization } from 'src/api';
import { useNavigate } from 'src/hooks/router';
import { IconCirclePlus, IconRefreshCcw } from 'src/icons';
import { createTranslate, useTranslate } from 'src/intl/translate';

const T = createTranslate('modules.commandPalette.commands');

export function useOrganizationCommands() {
  const t = T.useTranslate();
  const t2 = useTranslate();

  const api = useApi();

  const switchOrganization = useSwitchOrganization();
  const navigate = useNavigate();

  return (palette: CommandPalette) => {
    const group = palette.addGroup({
      label: t2('modules.commandPalette.contexts.organization'),
    });

    group.addItem({
      label: t('organization:switch.label'),
      description: t('organization:switch.description'),
      Icon: IconRefreshCcw,
      hasSubItems: true,
      execute: async () => {
        palette.setIcon(IconRefreshCcw);
        palette.setPlaceholder(t('organization:switch.placeholder'));

        const organizations = await api('get /v1/account/organizations', { query: {} });

        for (const organization of organizations.organizations!) {
          palette.addItem({
            label: organization.name!,
            execute: () => switchOrganization.mutateAsync(organization.external_id!),
          });
        }
      },
    });

    group.addItem({
      label: t('organization:create.label'),
      description: t('organization:create.description'),
      Icon: IconCirclePlus,
      execute: () => navigate({ to: '/user/settings/organizations', state: { create: true } }),
    });

    return () => {
      group.remove();
    };
  };
}
