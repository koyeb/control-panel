import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useSecrets } from 'src/api/hooks/secret';
import { getApiQueryKey } from 'src/api/use-api';
import { getApi } from 'src/application/container';
import { hasProperty } from 'src/utils/object';
import { wait } from 'src/utils/promises';

export function useVerifyDockerImage(image: string, registrySecretName: string | undefined) {
  const secrets = useSecrets('registry');
  const secretId = secrets?.find(hasProperty('name', registrySecretName))?.id;

  const {
    data,
    error: queryError,
    isFetching,
    refetch,
  } = useQuery({
    enabled: image.length > 0,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: false,
    queryKey: getApiQueryKey('verifyDockerImage', { query: { image, secret_id: secretId } }),
    async queryFn({ signal }) {
      const api = getApi();

      if (!(await wait(500, signal))) {
        return null;
      }

      return api.verifyDockerImage({
        query: {
          image: image.trim(),
          secret_id: secretId,
        },
      });
    },
  });

  const error = useMemo(() => {
    if (queryError) {
      return {
        message: queryError.message,
      };
    }

    if (data?.success === false) {
      return {
        type: data.code,
        message: data.reason,
      };
    }
  }, [queryError, data]);

  return {
    verifying: isFetching,
    verified: !isFetching && data?.success === true,
    error,
    retry: () => void refetch(),
  };
}
