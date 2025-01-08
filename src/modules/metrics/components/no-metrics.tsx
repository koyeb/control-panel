import { Spinner } from '@koyeb/design-system';
import { hasMessage } from 'src/api/api-errors';
import { IconTriangleAlert } from 'src/components/icons';
import { Loading } from 'src/components/loading';
import { createTranslate, Translate } from 'src/intl/translate';

const T = createTranslate('modules.metrics');

type NoMetricsProps = {
  loading: boolean;
  error?: unknown;
  noData: boolean;
};

export function NoMetrics({ loading, error, noData }: NoMetricsProps) {
  const content = () => {
    if (loading) {
      return (
        <Loading>
          <Spinner className="icon" />
          <T id="loading" />
        </Loading>
      );
    }

    if (error) {
      return (
        <>
          <IconTriangleAlert className="icon" />
          {hasMessage(error) ? (
            <Translate id="common.errorMessage" values={{ message: error.message }} />
          ) : (
            <Translate id="common.unknownError" />
          )}
        </>
      );
    }

    if (noData) {
      return (
        <>
          <IconTriangleAlert className="icon" />
          <T id="noData" />
        </>
      );
    }
  };

  return <div className="row h-64 items-center justify-center gap-2 text-dim">{content()}</div>;
}
