import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@workos-inc/authkit-react';
import { useMemo } from 'react';

import { apiQuery, useSecrets } from 'src/api';
import { hasProperty } from 'src/utils/object';

export function useVerifyDockerImage(image: string, registrySecretName: string | undefined) {
  const { getAccessToken } = useAuth();

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
    meta: { getAccessToken, delay: 500 },
    ...apiQuery('get /v1/docker-helper/verify', {
      query: {
        image: image.trim(),
        secret_id: secretId,
      },
    }),
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
