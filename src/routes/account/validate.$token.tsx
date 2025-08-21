import { createFileRoute, redirect } from '@tanstack/react-router';

import { api } from 'src/api/api';
import { hasMessage } from 'src/api/api-errors';
import { getApiQueryKey } from 'src/api/use-api';
import { container } from 'src/application/container';
import { notify } from 'src/application/notify';
import { Loading } from 'src/components/loading';
import { TOKENS } from 'src/tokens';

export const Route = createFileRoute('/account/validate/$token')({
  component: Loading,

  async loader({ params, context }) {
    const { queryClient } = context;
    const auth = container.resolve(TOKENS.authentication);
    const seon = container.resolve(TOKENS.seon);

    try {
      await api.validateAccount({
        path: { id: params.token },
        token: auth.token,
        header: { 'seon-fp': await seon.getFingerprint() },
      });

      await queryClient.invalidateQueries({ queryKey: getApiQueryKey('getCurrentUser', {}) });

      // todo
      // notify.success(t('emailAddressValidated'));

      throw redirect({ to: '/', state: { createOrganization: true } });
    } catch (error) {
      if (hasMessage(error)) {
        notify.error(error.message);
      }

      throw redirect({ to: '/' });
    }
  },
});
