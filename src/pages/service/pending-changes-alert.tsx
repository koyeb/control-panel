import { useMutation, UseMutationResult, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { dequal } from 'dequal';
import { diffJson } from 'diff';
import { useMemo } from 'react';

import { Alert, Button, DialogFooter } from '@koyeb/design-system';
import { useDeployment } from 'src/api/hooks/service';
import { isComputeDeployment, mapDeployment } from 'src/api/mappers/deployment';
import { ComputeDeployment, Service } from 'src/api/model';
import { useApiMutationFn, useApiQueryFn, useInvalidateApiQuery } from 'src/api/use-api';
import { useTrackEvent } from 'src/application/posthog';
import { routes } from 'src/application/routes';
import { allApiDeploymentStatuses } from 'src/application/service-functions';
import { Dialog, DialogHeader } from 'src/components/dialog';
import { useNavigate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';

const T = createTranslate('pages.service.layout.pendingChanges');

type PendingChangesAlertProps = {
  service: Service;
};

export function PendingChangesAlert({ service }: PendingChangesAlertProps) {
  const latestDeployment = useDeployment(service.latestDeploymentId);
  const latestNonStashedDeployment = useLatestNonStashedDeployment(service);

  const openDialog = Dialog.useOpen();
  const closeDialog = Dialog.useClose();

  const discard = useDiscardChanges(service);
  const deploy = useApplyChanges(service, () => closeDialog());

  if (latestDeployment === undefined || latestNonStashedDeployment === undefined) {
    return null;
  }

  assert(isComputeDeployment(latestNonStashedDeployment));
  assert(isComputeDeployment(latestDeployment));

  const isLatestStashed = latestDeployment.status === 'STASHED';

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
        loading={deploy.isPending}
        onClick={() => openDialog('DeploymentsDiff')}
        className="self-center"
      >
        <T id="viewChanges" />
      </Button>

      <Button color="blue" loading={deploy.isPending} onClick={() => deploy.mutate()} className="self-center">
        <T id="deploy" />
      </Button>

      <DeploymentsDiffDialog
        deploy={deploy}
        discard={discard}
        deployment1={latestNonStashedDeployment}
        deployment2={latestDeployment}
      />
    </Alert>
  );
}

function useLatestNonStashedDeployment(service: Service) {
  const { data: latestNonStashedDeployment } = useQuery({
    ...useApiQueryFn('listDeployments', {
      query: {
        service_id: service.id,
        statuses: allApiDeploymentStatuses.filter((status) => status !== 'STASHED'),
      },
    }),
    select: (result) => mapDeployment(result.deployments![0]!),
  });

  return latestNonStashedDeployment;
}

function useDiscardChanges(service: Service) {
  const latestNonStashedDeployment = useLatestNonStashedDeployment(service);
  const invalidate = useInvalidateApiQuery();
  const track = useTrackEvent();

  return useMutation({
    ...useApiMutationFn('updateService', (_: void) => {
      assert(isComputeDeployment(latestNonStashedDeployment));

      return {
        path: { id: service.id },
        query: { dry_run: false },
        body: {
          definition: latestNonStashedDeployment.definitionApi,
          save_only: true,
        },
      };
    }),
    async onSuccess() {
      track('service_change_discarded');

      await Promise.all([
        invalidate('getService', { path: { id: service.id } }),
        invalidate('listDeployments', { query: { service_id: service.id } }),
      ]);
    },
  });
}

function useApplyChanges(service: Service, onSuccess: () => void) {
  const invalidate = useInvalidateApiQuery();
  const navigate = useNavigate();

  return useMutation({
    ...useApiMutationFn('redeployService', { path: { id: service.id }, body: {} }),
    async onSuccess({ deployment }) {
      await Promise.all([
        invalidate('getService', { path: { id: service.id } }),
        invalidate('listDeployments', { query: { service_id: service.id } }),
      ]);

      onSuccess();
      navigate(routes.service.overview(service.id, deployment?.id));
    },
  });
}

type DeploymentsDiffDialog = {
  deploy: UseMutationResult<unknown, unknown, void>;
  discard: UseMutationResult<unknown, unknown, void>;
  deployment1: ComputeDeployment;
  deployment2: ComputeDeployment;
};

function DeploymentsDiffDialog({ deploy, discard, deployment1, deployment2 }: DeploymentsDiffDialog) {
  const diff = useMemo(
    () => diffJson(deployment1.definitionApi, deployment2.definitionApi),
    [deployment1, deployment2],
  );

  return (
    <Dialog id="DeploymentsDiff" className="w-full max-w-4xl">
      <DialogHeader title={<T id="diffDialog.title" />} />

      <p className="text-dim">
        <T id="diffDialog.description" />
      </p>

      {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
      <pre className="scrollbar-green max-h-[32rem] overflow-auto rounded bg-muted p-2 dark:bg-neutral">
        {diff.map(({ added, removed, value }, index) => (
          <span key={index} className={clsx(added && 'text-green', removed && 'text-red')}>
            {value}
          </span>
        ))}
      </pre>

      <DialogFooter>
        <Button
          variant="ghost"
          color="gray"
          loading={discard.isPending}
          onClick={() => discard.mutate()}
          className="self-center"
        >
          <T id="discard" />
        </Button>

        <Button loading={deploy.isPending} onClick={() => deploy.mutate()}>
          <T id="deploy" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
