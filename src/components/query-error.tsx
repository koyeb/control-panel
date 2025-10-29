import { Alert } from '@koyeb/design-system';
import { UseQueryResult } from '@tanstack/react-query';
import { useEffect } from 'react';

import { ApiError } from 'src/api';
import { Translate } from 'src/intl/translate';

import { Loading } from './loading';

type QueryGuardProps<Data> = {
  query: UseQueryResult<Data>;
  children?: (data: Data) => React.ReactNode;
};

export function QueryGuard<Data>({ query, children }: QueryGuardProps<Data>) {
  if (query.isPending) {
    return <Loading />;
  }

  if (query.isError) {
    return <QueryError error={query.error} />;
  }

  return children?.(query.data) ?? null;
}

export function QueryError({ error, className }: { error: Error; className?: string }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  const description = () => {
    if (ApiError.isValidationError(error) && error.body.fields[0]) {
      return error.body.fields[0].description;
    }

    if (ApiError.is(error)) {
      return <Translate id="common.apiError" />;
    }

    return <Translate id="common.unknownError" />;
  };

  return <Alert variant="error" title={error.message} description={description()} className={className} />;
}
