import { useMutation } from '@tanstack/react-query';

import { Alert, Button } from '@koyeb/design-system';
import { Deployment, Service } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { useSearchParam } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('pages.service.layout.latestDeploymentStashed');

type LatestDeploymentStashedAlertProps = {
  service: Service;
  latestDeployment?: Deployment;
};

export function LatestDeploymentStashedAlert({
  service,
  latestDeployment,
}: LatestDeploymentStashedAlertProps) {
  const [, setDeploymentId] = useSearchParam('deploymentId');
  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...useApiMutationFn('redeployService', { path: { id: service.id }, body: {} }),
    async onSuccess({ deployment }) {
      await invalidate('listDeployments', { query: { service_id: service.id } });
      setDeploymentId(deployment!.id!);
    },
  });

  if (latestDeployment?.status !== 'stashed') {
    return null;
  }

  return (
    <Alert variant="info" title={<T id="title" />} description={<T id="description" />}>
      <Button
        variant="outline"
        color="blue"
        loading={mutation.isPending}
        onClick={() => mutation.mutate()}
        className="self-center"
      >
        <T id="cta" />
      </Button>
    </Alert>
  );
}
