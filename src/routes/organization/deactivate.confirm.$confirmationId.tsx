import { createFileRoute, redirect } from '@tanstack/react-router';

import { createEnsureApiQueryData, getApi, getApiQueryKey, mapOrganization, mapUser } from 'src/api';
import { notify } from 'src/application/notify';
import { getOnboardingStep } from 'src/application/onboarding';
import { LogoLoading } from 'src/components/logo-loading';

export const Route = createFileRoute('/organization/deactivate/confirm/$confirmationId')({
  pendingComponent: LogoLoading,
  pendingMinMs: 0,
  pendingMs: 0,

  async loader({ params, context: { queryClient, translate } }) {
    const api = getApi();
    const ensureApiQueryData = createEnsureApiQueryData(queryClient);

    try {
      await api('post /v1/organization_confirmations/{id}', {
        path: { id: params.confirmationId },
      });

      await queryClient.refetchQueries({
        queryKey: getApiQueryKey('get /v1/account/organization', {}),
      });

      notify.success(translate('modules.account.deactivateOrganization.deactivating'));
    } catch (error) {
      if (error instanceof Error) {
        notify.error(error.message);
      }
    } finally {
      const user = await ensureApiQueryData('get /v1/account/profile', {}).then(({ user }) => mapUser(user!));

      const organization = await ensureApiQueryData('get /v1/account/organization', {}).then(
        ({ organization }) => mapOrganization(organization!),
      );

      const onboardingStep = getOnboardingStep(user, organization) !== null;

      // eslint-disable-next-line no-unsafe-finally
      throw redirect(
        onboardingStep
          ? { to: '/', search: { settings: 'true' }, replace: true }
          : { to: '/settings', replace: true },
      );
    }
  },
});
