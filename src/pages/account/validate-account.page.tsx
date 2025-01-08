import { useMutation } from '@tanstack/react-query';

import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { Loading } from 'src/components/loading';
import { useMount } from 'src/hooks/lifecycle';
import { useNavigate, useRouteParam } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.onboarding.emailValidation');

export function ValidateAccountPage() {
  const navigate = useNavigate();
  const invalidate = useInvalidateApiQuery();
  const validationToken = useRouteParam('token');
  const t = T.useTranslate();

  const { mutate } = useMutation({
    ...useApiMutationFn('validateAccount', {
      path: { id: validationToken },
      header: {},
    }),
    async onSuccess() {
      await invalidate('getCurrentUser');
      notify.success(t('emailAddressValidated'));
    },
    onError(error) {
      notify.error(error.message);
    },
    onSettled() {
      navigate(routes.home());
    },
  });

  useMount(mutate);

  return <Loading />;
}
