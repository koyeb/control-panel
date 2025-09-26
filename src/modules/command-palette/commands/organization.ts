import { CommandPalette } from '@koyeb/design-system';

import { useSetToken } from 'src/application/authentication';
import { getApi } from 'src/application/container';
import { useNavigate } from 'src/hooks/router';
import { IconCirclePlus, IconRefreshCcw } from 'src/icons';
import { createTranslate, useTranslate } from 'src/intl/translate';

const T = createTranslate('modules.commandPalette.commands');

export function useOrganizationCommands() {
  const t = T.useTranslate();
  const t2 = useTranslate();

  const navigate = useNavigate();
  const setToken = useSetToken();

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

        const organizations = await getApi().listUserOrganizations({ query: {} });

        for (const organization of organizations.organizations!) {
          palette.addItem({
            label: organization.name!,
            execute: async () => {
              const { token } = await getApi().switchOrganization({
                path: { id: organization.id! },
                header: {},
              });

              await setToken(token!.id!);
            },
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
