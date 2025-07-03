import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { useOnboardingStep } from 'src/application/onboarding';
import { LogoLoading } from 'src/components/logo-loading';
import { useNavigate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.account.deactivateOrganization');

export function ConfirmDeactivateOrganization({ confirmationId }: { confirmationId: string }) {
  const invalidate = useInvalidateApiQuery();
  const navigate = useNavigate();
  const t = T.useTranslate();

  const onboardingStep = useOnboardingStep();

  const { isIdle, mutate } = useMutation({
    ...useApiMutationFn('organizationConfirmation', (confirmationId: string) => ({
      path: { id: confirmationId },
    })),
    async onSuccess() {
      await invalidate('getCurrentOrganization');
      notify.info(t('deactivationSuccessNotification'));
    },
    onSettled() {
      navigate({
        to: onboardingStep ? '/' : '/settings',
        search: onboardingStep ? { settings: '' } : {},
      });
    },
  });

  useEffect(() => {
    if (isIdle) {
      mutate(confirmationId);
    }
  }, [confirmationId, isIdle, mutate]);

  return <LogoLoading />;
}
