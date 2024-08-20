import { useMutation } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';
import { z } from 'zod';

import { api } from 'src/api/api';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { reportError } from 'src/application/report-error';
import { routes } from 'src/application/routes';
import { useAccessToken } from 'src/application/token';
import { useMount } from 'src/hooks/lifecycle';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { AssertionError, assert } from 'src/utils/assert';

const schema = z.object({
  metadata: z.string().optional(),
});

export function GithubAppCallbackPage() {
  const { token } = useAccessToken();
  const searchParams = useSearchParams();
  const invalidate = useInvalidateApiQuery();
  const navigate = useNavigate();

  const mutation = useMutation({
    async mutationFn() {
      const installation_id = searchParams.get('installation_id');
      const setup_action = searchParams.get('setup_action');
      const state = searchParams.get('state');

      // prettier-ignore
      assert(installation_id !== null, new AssertionError('The "installation_id" query parameter is missing'));
      assert(setup_action !== null, new AssertionError('The "setup_action" query parameter is missing'));
      assert(state !== null, new AssertionError('The "state" query parameter is missing'));

      const { metadata = routes.home() } = schema.parse(jwtDecode(state));

      await api.installGithubAppCallback({
        token,
        body: {
          installation_id,
          setup_action,
          state,
        },
      });

      return metadata;
    },
    async onSuccess(redirect) {
      await invalidate('getGithubApp');
      navigate(redirect, { replace: true });
    },
    onError(error) {
      reportError(error);
      notify.error(error.message);
      navigate(routes.home(), { replace: true });
    },
  });

  useMount(() => {
    mutation.mutate();
  });

  return null;
}
