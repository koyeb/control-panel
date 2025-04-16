import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';

import { ButtonMenuItem, Menu, MenuItem, Spinner } from '@koyeb/design-system';
import { useOrganizationUnsafe, useUserOrganizationMemberships } from 'src/api/hooks/session';
import { OrganizationMember, OrganizationStatus } from 'src/api/model';
import { useApiMutationFn } from 'src/api/use-api';
import { routes } from 'src/application/routes';
import { useToken } from 'src/application/token';
import { IconCheck, IconCirclePlus } from 'src/components/icons';
import { Link } from 'src/components/link';
import { useNavigate } from 'src/hooks/router';
import { useSeon } from 'src/hooks/seon';
import { Translate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';
import { Extend } from 'src/utils/types';

import { OrganizationAvatar } from '../components/organization-avatar';

type OrganizationSwitcherMenuOwnProps = {
  onClose: () => void;
  showCreateOrganization: boolean;
};

type OrganizationSwitcherMenuProps = Extend<
  React.ComponentProps<typeof Menu>,
  OrganizationSwitcherMenuOwnProps
>;

export function OrganizationSwitcherMenu({
  onClose,
  showCreateOrganization,
  ...props
}: OrganizationSwitcherMenuProps) {
  const currentOrganization = useOrganizationUnsafe();
  const { data: organizationMembers = [] } = useUserOrganizationMemberships();

  const {
    mutate: switchOrganization,
    isPending,
    variables: switchingOrganizationId,
  } = useSwitchOrganization(onClose);

  if (currentOrganization === undefined) {
    return null;
  }

  return (
    <Menu {...props}>
      {organizationMembers.filter(isNotDeleting).map(({ id, organization }) => (
        <ButtonMenuItem
          key={id}
          onClick={() => switchOrganization(organization.id)}
          className={clsx(
            'row items-center gap-2 rounded px-2 py-1 font-medium',
            'hover:bg-green/25',
            organization.id === currentOrganization.id && 'pointer-events-none',
          )}
        >
          <OrganizationAvatar organizationName={organization.name} className="size-6 rounded-full" />

          {organization.name}

          {organization.id === currentOrganization.id && <IconCheck className="ml-auto size-4" />}

          {isPending && organization.id === switchingOrganizationId && <Spinner className="ml-auto size-4" />}
        </ButtonMenuItem>
      ))}

      {showCreateOrganization && (
        <>
          <hr />

          <MenuItem className="!p-0">
            <Link
              href={routes.userSettings.organizations()}
              state={{ create: true }}
              onClick={onClose}
              className="row w-full items-center gap-2 rounded p-2 font-medium hover:bg-muted"
            >
              <IconCirclePlus className="icon" />
              <Translate id="layouts.createOrganization" />
            </Link>
          </MenuItem>
        </>
      )}
    </Menu>
  );
}

function isNotDeleting({ organization }: OrganizationMember) {
  return !inArray<OrganizationStatus>(organization.status, ['DELETING', 'DELETED']);
}

function useSwitchOrganization(onSuccess: () => void) {
  const { setToken } = useToken();
  const getSeonFingerprint = useSeon();
  const navigate = useNavigate();

  return useMutation({
    ...useApiMutationFn('switchOrganization', async (organizationId: string) => ({
      path: { id: organizationId },
      header: { 'seon-fp': await getSeonFingerprint() },
    })),
    async onSuccess(result) {
      setToken(result.token!.id!);
      navigate(routes.home());
      onSuccess();
    },
  });
}
