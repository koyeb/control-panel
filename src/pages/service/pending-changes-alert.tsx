import { useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { dequal } from 'dequal';
import { diffJson } from 'diff';
import { useMemo, useState } from 'react';

import { Alert, Button, Dialog } from '@koyeb/design-system';
import { useDeployment } from 'src/api/hooks/service';
import { isComputeDeployment, mapDeployments } from 'src/api/mappers/deployment';
import { ComputeDeployment, Service } from 'src/api/model';
import { useApiMutationFn, useApiQueryFn, useInvalidateApiQuery } from 'src/api/use-api';
import { routes } from 'src/application/routes';
import { allApiDeploymentStatuses } from 'src/application/service-functions';
import { useNavigate } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';

const T = Translate.prefix('pages.service.layout.pendingChanges');

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
        statuses: allApiDeploymentStatuses.filter((status) => status !== 'STASHED'),
      },
    }),
    select: (result) => mapDeployments(result)[0],
  });

  const redeploy = useMutation({
    ...useApiMutationFn('redeployService', { path: { id: service.id }, body: {} }),
    async onSuccess({ deployment }) {
      await Promise.all([
        invalidate('getService', { path: { id: service.id } }),
        invalidate('listDeployments', { query: { service_id: service.id } }),
      ]);

      setChangesDialogOpen(false);
      navigate(routes.service.overview(service.id, deployment?.id));
    },
  });

  const [changesDialogOpen, setChangesDialogOpen] = useState(false);

  if (latestDeployment === undefined || latestNonStashedDeployment === undefined) {
    return null;
  }

  assert(isComputeDeployment(latestNonStashedDeployment));
  assert(isComputeDeployment(latestDeployment));

  const isLatestStashed = latestDeployment.status === 'stashed';

  const hasDiffWithLatestNonStashed = !dequal(
    latestDeployment.definitionApi,
    latestNonStashedDeployment.definitionApi,
  );

  if (!isLatestStashed || !hasDiffWithLatestNonStashed) {
    return null;
  }

  return (
    <Alert variant="info" title={<T id="title" />} description={<T id="description" />}>
      <Button
        variant="ghost"
        color="blue"
        loading={redeploy.isPending}
        onClick={() => setChangesDialogOpen(true)}
        className="self-center"
      >
        <T id="viewChanges" />
      </Button>

      <Button
        color="blue"
        loading={redeploy.isPending}
        onClick={() => redeploy.mutate()}
        className="self-center"
      >
        <T id="deploy" />
      </Button>

      <DeploymentsDiffDialog
        isOpen={changesDialogOpen}
        onClose={() => setChangesDialogOpen(false)}
        onDeploy={() => redeploy.mutate()}
        deploying={redeploy.isPending}
        deployment1={latestNonStashedDeployment}
        deployment2={latestDeployment}
      />
    </Alert>
  );
}

type DeploymentsDiffDialog = {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: () => void;
  deploying: boolean;
  deployment1: ComputeDeployment;
  deployment2: ComputeDeployment;
};

function DeploymentsDiffDialog({
  isOpen,
  onClose,
  onDeploy,
  deploying,
  deployment1,
  deployment2,
}: DeploymentsDiffDialog) {
  const diff = useMemo(
    () => diffJson(deployment1.definitionApi, deployment2.definitionApi),
    [deployment1, deployment2],
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={<T id="diffDialog.title" />}
      description={<T id="diffDialog.description" />}
      width="2xl"
    >
      {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
      <pre className="scrollbar-green max-h-[32rem] overflow-auto rounded bg-muted p-2 dark:bg-neutral">
        {diff.map(({ added, removed, value }, index) => (
          <span key={index} className={clsx(added && 'text-green', removed && 'text-red')}>
            {value}
          </span>
        ))}
      </pre>

      <footer className="row mt-4 justify-end gap-4">
        <Button loading={deploying} onClick={onDeploy}>
          <T id="deploy" />
        </Button>
      </footer>
    </Dialog>
  );
}
