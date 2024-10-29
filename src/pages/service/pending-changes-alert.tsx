import { useMutation, useQuery } from '@tanstack/react-query';
import { dequal } from 'dequal';

import { Alert, Button } from '@koyeb/design-system';
import { ApiDeploymentStatus } from 'src/api/api-types';
import { useDeployment } from 'src/api/hooks/service';
import { isComputeDeployment, mapDeployments } from 'src/api/mappers/deployment';
import { Service } from 'src/api/model';
import { useApiMutationFn, useApiQueryFn, useInvalidateApiQuery } from 'src/api/use-api';
import { routes } from 'src/application/routes';
import { useNavigate } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';

const T = Translate.prefix('pages.service.layout.pendingChanges');

const allDeploymentStatuses: Array<ApiDeploymentStatus> = [
  'PENDING',
  'PROVISIONING',
  'SCHEDULED',
  'CANCELING',
  'CANCELED',
  'ALLOCATING',
  'STARTING',
  'HEALTHY',
  'DEGRADED',
  'UNHEALTHY',
  'STOPPING',
  'STOPPED',
  'ERRORING',
  'ERROR',
  'STASHED',
];

type PendingChangesAlertProps = {
  service: Service;
};

export function PendingChangesAlert({ service }: PendingChangesAlertProps) {
  const latestDeployment = useDeployment(service.latestDeploymentId);
  const invalidate = useInvalidateApiQuery();
  const navigate = useNavigate();

  const { data: latestNonStashedDeployment } = useQuery({
    ...useApiQueryFn('listDeployments', {
      query: {
        service_id: service.id,
        statuses: allDeploymentStatuses.filter((status) => status !== 'STASHED'),
      },
    }),
    select: (result) => mapDeployments(result)[0],
  });

  const redeploy = useMutation({
    ...useApiMutationFn('redeployService', { path: { id: service.id }, body: {} }),
    async onSuccess() {
      await Promise.all([
        invalidate('getService', { path: { id: service.id } }),
        invalidate('listDeployments', { query: { service_id: service.id } }),
      ]);

      navigate(routes.service.overview(service.id));
    },
  });

  if (latestDeployment === undefined || latestNonStashedDeployment === undefined) {
    return null;
  }

  assert(isComputeDeployment(latestNonStashedDeployment));
  assert(isComputeDeployment(latestDeployment));

  if (
    latestNonStashedDeployment.status !== 'stashed' &&
    dequal(latestNonStashedDeployment.definition, latestDeployment.definition)
  ) {
    return null;
  }

  return (
    <Alert variant="info" title={<T id="title" />} description={<T id="description" />}>
      <Button
        color="blue"
        loading={redeploy.isPending}
        onClick={() => redeploy.mutate()}
        className="self-center"
      >
        <T id="deploy" />
      </Button>
    </Alert>
  );
}
