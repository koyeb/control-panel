import { useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { forwardRef } from 'react';

import { ButtonMenuItem, Menu, MenuItem, Spinner } from '@koyeb/design-system';
import { useOrganizationUnsafe, useUserUnsafe } from 'src/api/hooks/session';
import { mapOrganizationMembers } from 'src/api/mappers/session';
import { OrganizationMember } from 'src/api/model';
import { useApiMutationFn, useApiQueryFn } from 'src/api/use-api';
import { routes } from 'src/application/routes';
import { useAccessToken } from 'src/application/token';
import { IconCheck, IconCirclePlus } from 'src/components/icons';
import { Link } from 'src/components/link';
import { useNavigate } from 'src/hooks/router';
import { useSeon } from 'src/hooks/seon';
import { Translate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';

import { OrganizationAvatar } from '../components/organization-avatar';

type OrganizationSwitcherMenuOwnProps = {
  onClose: () => void;
  showCreateOrganization: boolean;
};

type OrganizationSwitcherMenuProps = OrganizationSwitcherMenuOwnProps & React.HTMLAttributes<HTMLDivElement>;

export const OrganizationSwitcherMenu = forwardRef<HTMLDivElement, OrganizationSwitcherMenuProps>(
  function OrganizationSwitcherMenu({ onClose, showCreateOrganization, ...props }, ref) {
    const currentOrganization = useOrganizationUnsafe();
    const { data: organizationMembers = [] } = useOrganizationMembers();

    const {
      mutate: switchOrganization,
      isPending,
      variables: switchingOrganizationId,
    } = useSwitchOrganization(onClose);

    if (currentOrganization === undefined) {
      return null;
    }

    return (
      <Menu ref={ref} {...props}>
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

            {isPending && organization.id === switchingOrganizationId && (
              <Spinner className="ml-auto size-4" />
            )}
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
  },
);

function isNotDeleting({ organization }: OrganizationMember) {
  return !inArray(organization.status, ['deleting', 'deleted']);
}

function useOrganizationMembers() {
  const user = useUserUnsafe();

  return useQuery({
    ...useApiQueryFn('listOrganizationMembers', { query: { user_id: user?.id } }),
    enabled: user !== undefined,
    select: mapOrganizationMembers,
  });
}

function useSwitchOrganization(onSuccess: () => void) {
  const { setToken } = useAccessToken();
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
