import { UseQueryResult } from '@tanstack/react-query';

import { Alert } from '@koyeb/design-system';
import { isApiValidationError, isApiError } from 'src/api/api-errors';
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

export function QueryError({ error }: { error: Error }) {
  const description = () => {
    if (isApiValidationError(error) && error.fields[0]) {
      return error.fields[0].description;
    }

    if (isApiError(error)) {
      return <Translate id="common.apiError" />;
    }

    return <Translate id="common.unknownError" />;
  };

  return <Alert variant="error" title={error.message} description={description()} />;
}
