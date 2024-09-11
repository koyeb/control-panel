import { useQuery } from '@tanstack/react-query';

import { useUserUnsafe } from 'src/api/hooks/session';

import { getConfig } from './config';

export function useIdenfyLink() {
  const user = useUserUnsafe();
  const { idenfyServiceBaseUrl } = getConfig();

  const query = useQuery({
    enabled: user !== undefined,
    meta: { showError: false },
    queryKey: ['idenfy', idenfyServiceBaseUrl, user?.id],
    async queryFn() {
      const response = await fetch(`${idenfyServiceBaseUrl}/${user?.id}`, { method: 'POST' });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.text();
    },
  });

  if (query.isSuccess) {
    return `https://ivs.idenfy.com/api/v2/redirect?authToken=${query.data}`;
  }
}
