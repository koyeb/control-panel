import { QueryClient } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { createEnsureApiQueryData, getApi, getApiQueryKey, mapOrganization, mapUser } from 'src/api';
import { AuthKitAdapter } from 'src/application/authkit';
import { notify } from 'src/application/notify';
import { setToken } from 'src/application/token';
import { hasMessage } from 'src/application/validation';
import { LogoLoading } from 'src/components/logo-loading';
import { SeonAdapter } from 'src/hooks/seon';
import { User } from 'src/model';
import { slugify } from 'src/utils/strings';

export const Route = createFileRoute('/account/validate/$token')({
  pendingComponent: LogoLoading,
  pendingMinMs: 0,
  pendingMs: 0,

  async loader({ params, context: { seon, authKit, queryClient, translate } }) {
    try {
      await validateAccount(seon, queryClient, params.token);
      await createOrganization(authKit, queryClient).catch(() => {});

      notify.success(translate('pages.onboarding.emailValidation.emailAddressValidated'));
    } catch (error) {
      if (hasMessage(error)) {
        notify.error(error.message);
      }
    }

    throw redirect({ to: '/', replace: true });
  },
});

async function validateAccount(seon: SeonAdapter, queryClient: QueryClient, token: string) {
  const api = getApi();

  await api('post /v1/account/validate/{id}', {
    path: { id: token },
    header: { 'seon-fp': await seon.getFingerprint() },
  });

  await queryClient.refetchQueries({
    queryKey: getApiQueryKey('get /v1/account/profile', {}),
  });
}

async function createOrganization(authKit: AuthKitAdapter, queryClient: QueryClient) {
  const api = getApi();
  const ensureApiQueryData = createEnsureApiQueryData(queryClient);

  const user = await ensureApiQueryData('get /v1/account/profile', {}).then(({ user }) => mapUser(user!));

  const organization = await api('post /v1/organizations', {
    body: { name: defaultOrganizationName(user) },
  }).then(({ organization }) => mapOrganization(organization!));

  const { token } = await api('post /v1/organizations/{id}/switch', {
    path: { id: organization.id },
    header: {},
  });

  if (!authKit.user) {
    await setToken(token!.id!, { queryClient });
  }
}

function defaultOrganizationName(user: User): string {
  if (user.githubUser) {
    return slugify(user.githubUser, 39);
  }

  return slugify(user.email.replace(/@.*/, ''), 39);
}
