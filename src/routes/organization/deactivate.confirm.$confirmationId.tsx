import { createFileRoute, redirect } from '@tanstack/react-router';

import { mapOrganization, mapUser } from 'src/api/mappers/session';
import { createEnsureApiQueryData } from 'src/api/use-api';
import { container } from 'src/application/container';
import { notify } from 'src/application/notify';
import { getOnboardingStep } from 'src/application/onboarding';
import { LogoLoading } from 'src/components/logo-loading';
import { TOKENS } from 'src/tokens';

export const Route = createFileRoute('/organization/deactivate/confirm/$confirmationId')({
  pendingComponent: LogoLoading,
  pendingMinMs: 0,
  pendingMs: 0,

  async loader({ params, context: { queryClient, translate } }) {
    const api = container.resolve(TOKENS.api);
    const ensureApiQueryData = createEnsureApiQueryData(queryClient);

    try {
      await api.organizationConfirmation({
        path: { id: params.confirmationId },
      });

      await queryClient.invalidateQueries({ queryKey: ['getCurrentOrganization'] });

      notify.success(translate('modules.account.deactivateOrganization.deactivationSuccessNotification'));
    } catch (error) {
      if (error instanceof Error) {
        notify.error(error.message);
      }
    } finally {
      const user = await ensureApiQueryData('getCurrentUser', {}).then(({ user }) => mapUser(user!));

      const organization = await ensureApiQueryData('getCurrentOrganization', {}).then(({ organization }) =>
        mapOrganization(organization!),
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
