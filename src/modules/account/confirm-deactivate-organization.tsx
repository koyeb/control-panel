import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { useOnboardingStep } from 'src/application/onboarding';
import { routes } from 'src/application/routes';
import { LogoLoading } from 'src/components/logo-loading';
import { useNavigate, useRouteParam } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('account.deactivateOrganization');

export function ConfirmDeactivateOrganization() {
  const invalidate = useInvalidateApiQuery();
  const navigate = useNavigate();
  const t = T.useTranslate();

  const confirmationId = useRouteParam('confirmationId');
  const onboardingStep = useOnboardingStep();

  const confirmDeactivation = useMutation({
    ...useApiMutationFn('organizationConfirmation', (confirmationId: string) => ({
      path: { id: confirmationId },
    })),
    async onSuccess() {
      await invalidate('getCurrentOrganization');
      notify.info(t('deactivationSuccessNotification'));
    },
    onSettled() {
      navigate(onboardingStep ? '/?settings' : routes.organizationSettings.index());
    },
  });

  useEffect(() => {
    if (confirmDeactivation.isIdle) {
      confirmDeactivation.mutate(confirmationId);
    }
  }, [confirmationId, confirmDeactivation]);

  return <LogoLoading />;
}
