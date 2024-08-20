import { useMutation } from '@tanstack/react-query';
import IconChevronUpDown from 'lucide-static/icons/chevrons-up-down.svg?react';
import { useState } from 'react';

import { Floating } from '@koyeb/design-system';
import { api } from 'src/api/api';
import { isApiError } from 'src/api/api-errors';
import { useOrganizationUnsafe, useUserQuery } from 'src/api/hooks/session';
import { useApiMutationFn } from 'src/api/use-api';
import { routes } from 'src/application/routes';
import { useAccessToken } from 'src/application/token';
import { Link } from 'src/components/link';
import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import { OrganizationAvatar } from 'src/components/organization-avatar';
import { useNavigate } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';

import { OrganizationSwitcherMenu } from '../organization-switcher-menu';

const T = Translate.prefix('layouts.secondary');

export function SecondaryLayoutHeader() {
  const organization = useOrganizationUnsafe();
  const userQuery = useUserQuery();
  const { token, clearToken } = useAccessToken();
  const navigate = useNavigate();

  const accountLocked = userQuery.isError && isApiError(userQuery.error) && userQuery.error.status === 403;
  const isAuthenticated = userQuery.isSuccess || accountLocked;

  const { mutate: logout } = useMutation({
    async mutationFn() {
      // the API does not allow to log out from a locked account
      if (!accountLocked) {
        await api.logout({ token });
      }
    },
    onSuccess() {
      clearToken();
      navigate(routes.signIn());

      if (accountLocked) {
        window.location.reload();
      }
    },
  });

  const { mutate: deleteAccount } = useMutation({
    ...useApiMutationFn('deleteUser', {
      path: { id: userQuery.data?.id as string },
    }),
    onSuccess() {
      clearToken();
      navigate(routes.signIn());
    },
  });

  return (
    <header className="row absolute inset-x-0 top-0 flex-wrap items-center gap-6 bg-transparent px-6 py-4">
      <Link href={routes.home()}>
        <LogoKoyeb className="h-8 self-start text-white" />
      </Link>

      {isAuthenticated && (
        <>
          <OrganizationSwitcher />

          <div className="row ml-auto gap-4">
            {organization === undefined && (
              <button type="button" onClick={() => deleteAccount()} className="text-link">
                <T id="deleteAccount" />
              </button>
            )}

            <button type="button" onClick={() => logout()} className="text-link ml-auto">
              <T id="logout" />
            </button>
          </div>
        </>
      )}
    </header>
  );
}

function OrganizationSwitcher() {
  const currentOrganization = useOrganizationUnsafe();
  const [open, setOpen] = useState(false);

  if (currentOrganization === undefined) {
    return null;
  }

  return (
    <Floating
      open={open}
      setOpen={setOpen}
      strategy="fixed"
      placement="bottom-start"
      offset={8}
      renderReference={(ref, props) => (
        <button
          ref={ref}
          type="button"
          data-testid="organization-switcher"
          className="row dark items-center gap-2 rounded-lg text-start"
          onClick={() => setOpen(!open)}
          {...props}
        >
          <OrganizationAvatar className="size-6 rounded-full" />
          <span className="flex-1 font-medium">{currentOrganization.name}</span>
          <IconChevronUpDown className="size-4 text-dim" />
        </button>
      )}
      renderFloating={(ref, props) => (
        <OrganizationSwitcherMenu
          ref={ref}
          onClose={() => setOpen(false)}
          showCreateOrganization={false}
          {...props}
        />
      )}
    />
  );
}
