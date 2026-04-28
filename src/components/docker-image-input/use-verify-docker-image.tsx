import { useQuery } from '@tanstack/react-query';
import { useAuth } from 'src/application/authkit';
import { useMemo } from 'react';

import { apiQuery, useSecrets } from 'src/api';
import { getConfig } from 'src/application/config';
import { hasProperty } from 'src/utils/object';

export function useVerifyDockerImage(image: string, registrySecretName: string | undefined) {
  const { getAccessToken } = useAuth();

  const secrets = useSecrets('REGISTRY');
  const secretId = secrets?.find(hasProperty('name', registrySecretName))?.id;

  const skipVerification = getConfig('environment') === 'development';

  const {
    data,
    error: queryError,
    isFetching,
    refetch,
  } = useQuery({
    enabled: image.length > 0 && !skipVerification,
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
    if (skipVerification) {
      return undefined;
    }

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
  }, [skipVerification, queryError, data]);

  return {
    verifying: !skipVerification && isFetching,
    verified: skipVerification ? image.length > 0 : !isFetching && data?.success === true,
    error,
    retry: () => void refetch(),
  };
}
