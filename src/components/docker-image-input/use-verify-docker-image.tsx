import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { api } from 'src/api/api';
import { useSecrets } from 'src/api/hooks/secret';
import { useAccessToken } from 'src/application/token';
import { hasProperty } from 'src/utils/object';
import { wait } from 'src/utils/promises';

export function useVerifyDockerImage(image: string, registrySecretName: string | undefined) {
  const { token } = useAccessToken();

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
    queryKey: ['verifyDockerImage', { token, image, secretId }] as const,
    async queryFn({ signal }) {
      if (!(await wait(500, signal))) {
        return;
      }

      return api.verifyDockerImage({
        token,
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
