import { useSetToken } from 'src/application/authentication';
import { getApi } from 'src/application/container';
import { useNavigate } from 'src/hooks/router';
import { IconCirclePlus, IconRefreshCcw } from 'src/icons';
import { createTranslate, useTranslate } from 'src/intl/translate';

import { useCommandPaletteContext } from '../command-palette-context';

const T = createTranslate('modules.commandPalette.commands');

export function useOrganizationCommands() {
  const t = T.useTranslate();
  const t2 = useTranslate();

  const palette = useCommandPaletteContext();
  const navigate = useNavigate();
  const setToken = useSetToken();

  return () => {
    const contextId = 'organization';

    palette.addContext({
      id: contextId,
      label: t2('modules.commandPalette.contexts.organization'),
    });

    palette.addOption({
      id: 'switch',
      contextId,
      label: t('organization:switch.label'),
      description: t('organization:switch.description'),
      Icon: IconRefreshCcw,
      hasSubOptions: true,
      placeholder: t('organization:switch.placeholder'),
      execute: async () => {
        const organizations = await getApi().listUserOrganizations({ query: {} });

        for (const organization of organizations.organizations!) {
          palette.addOption({
            id: organization.id!,
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

    palette.addOption({
      id: 'create',
      contextId,
      label: t('organization:create.label'),
      description: t('organization:create.description'),
      Icon: IconCirclePlus,
      execute: () => navigate({ to: '/user/settings/organizations', state: { create: true } }),
    });
  };
}
