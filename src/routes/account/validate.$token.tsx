import { QueryClient } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { createEnsureApiQueryData, getApiQueryKey } from 'src/api/api';
import { hasMessage } from 'src/api/api-errors';
import { mapOrganization, mapUser } from 'src/api/mappers/session';
import { User } from 'src/api/model';
import { container, getApi } from 'src/application/container';
import { notify } from 'src/application/notify';
import { LogoLoading } from 'src/components/logo-loading';
import { SeonPort } from 'src/hooks/seon';
import { TOKENS } from 'src/tokens';
import { slugify } from 'src/utils/strings';

export const Route = createFileRoute('/account/validate/$token')({
  pendingComponent: LogoLoading,
  pendingMinMs: 0,
  pendingMs: 0,

  async loader({ params, context: { seon, queryClient, translate } }) {
    try {
      await validateAccount(seon, queryClient, params.token);
      await createOrganization(queryClient).catch(() => {});

      notify.success(translate('pages.onboarding.emailValidation.emailAddressValidated'));
    } catch (error) {
      if (hasMessage(error)) {
        notify.error(error.message);
      }
    }

    throw redirect({ to: '/', replace: true });
  },
});

async function validateAccount(seon: SeonPort, queryClient: QueryClient, token: string) {
  const api = getApi();

  await api('post /v1/account/validate/{id}', {
    path: { id: token },
    header: { 'seon-fp': await seon.getFingerprint() },
  });

  await queryClient.invalidateQueries({
    queryKey: getApiQueryKey('get /v1/account/profile', {}),
  });
}

async function createOrganization(queryClient: QueryClient) {
  const api = getApi();
  const auth = container.resolve(TOKENS.authentication);

  const ensureApiQueryData = createEnsureApiQueryData(queryClient);

  const user = await ensureApiQueryData('get /v1/account/profile', {}).then(({ user }) => mapUser(user!));

  const organization = await api('post /v1/organizations', {
    body: { name: defaultOrganizationName(user) },
  }).then(({ organization }) => mapOrganization(organization!));

  const { token } = await api('post /v1/organizations/{id}/switch', {
    path: { id: organization.id },
    header: {},
  });

  auth.setToken(token!.id!);
  await queryClient.invalidateQueries();
}

function defaultOrganizationName(user: User): string {
  if (user.githubUser) {
    return slugify(user.githubUser, 39);
  }

  return slugify(user.email.replace(/@.*/, ''), 39);
}
