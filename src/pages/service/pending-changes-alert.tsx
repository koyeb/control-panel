import { Alert, Button, DialogFooter } from '@koyeb/design-system';
import { UseMutationResult, useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { dequal } from 'dequal';
import { diffJson } from 'diff';
import { useMemo } from 'react';

import {
  apiMutation,
  apiQuery,
  isComputeDeployment,
  mapDeployment,
  useDeployment,
  useInvalidateApiQuery,
} from 'src/api';
import { useTrackEvent } from 'src/application/posthog';
import { allApiDeploymentStatuses } from 'src/application/service-functions';
import { Dialog, DialogHeader, closeDialog, openDialog } from 'src/components/dialog';
import { useNavigate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { Service } from 'src/model';
import { exclude } from 'src/utils/arrays';
import { assert } from 'src/utils/assert';

const T = createTranslate('pages.service.layout.pendingChanges');

type PendingChangesAlertProps = {
  service: Service;
};

export function PendingChangesAlert({ service }: PendingChangesAlertProps) {
  const latestDeployment = useDeployment(service.latestDeploymentId);
  const latestNonStashedDeployment = useLatestNonStashedDeployment(service);

  const discard = useDiscardChanges(service);
  const deploy = useApplyChanges(service, closeDialog);

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
        onClick={() => openDialog('DeploymentsDiff', [latestNonStashedDeployment, latestDeployment])}
        className="self-center"
      >
        <T id="viewChanges" />
      </Button>

      <Button color="blue" loading={deploy.isPending} onClick={() => deploy.mutate()} className="self-center">
        <T id="deploy" />
      </Button>

      <DeploymentsDiffDialog deploy={deploy} discard={discard} />
    </Alert>
  );
}

function useLatestNonStashedDeployment(service: Service) {
  const { data } = useQuery({
    ...apiQuery('get /v1/deployments', {
      query: {
        service_id: service.id,
        statuses: exclude(allApiDeploymentStatuses, 'STASHED'),
        limit: '1',
      },
    }),
    refetchInterval: 5_000,
    select: ({ deployments }) => deployments!.map(mapDeployment).at(0),
  });

  return data;
}

function useDiscardChanges(service: Service) {
  const latestNonStashedDeployment = useLatestNonStashedDeployment(service);
  const invalidate = useInvalidateApiQuery();
  const track = useTrackEvent();

  return useMutation({
    ...apiMutation('put /v1/services/{id}', (_: void) => {
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
      await Promise.all([
        invalidate('get /v1/services/{id}', { path: { id: service.id } }),
        invalidate('get /v1/deployments', { query: { service_id: service.id } }),
      ]);

      closeDialog();
      track('service_change_discarded');
    },
  });
}

function useApplyChanges(service: Service, onSuccess: () => void) {
  const invalidate = useInvalidateApiQuery();
  const navigate = useNavigate();

  return useMutation({
    ...apiMutation('post /v1/services/{id}/redeploy', { path: { id: service.id }, body: {} }),
    async onSuccess({ deployment }) {
      await Promise.all([
        invalidate('get /v1/services/{id}', { path: { id: service.id } }),
        invalidate('get /v1/deployments', { query: { service_id: service.id } }),
      ]);

      closeDialog();
      onSuccess();

      await navigate({
        to: '/services/$serviceId',
        params: { serviceId: service.id },
        search: { deploymentId: deployment?.id },
      });
    },
  });
}

type DeploymentsDiffDialog = {
  deploy: UseMutationResult<unknown, unknown, void>;
  discard: UseMutationResult<unknown, unknown, void>;
};

function DeploymentsDiffDialog({ deploy, discard }: DeploymentsDiffDialog) {
  return (
    <Dialog id="DeploymentsDiff" className="w-full max-w-4xl">
      {([deployment1, deployment2]) => (
        <>
          <DialogHeader title={<T id="diffDialog.title" />} />

          <p className="text-dim">
            <T id="diffDialog.description" />
          </p>

          <Diff left={deployment1.definitionApi} right={deployment2.definitionApi} />

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
        </>
      )}
    </Dialog>
  );
}

function Diff({ left, right }: { left: object; right: object }) {
  const diff = useMemo(() => diffJson(left, right), [left, right]);

  return (
    <pre className="max-h-128 overflow-auto rounded-sm bg-muted p-2 scrollbar-green dark:bg-neutral">
      {diff.map(({ added, removed, value }, index) => (
        <span key={index} className={clsx(added && 'text-green', removed && 'text-red')}>
          {value}
        </span>
      ))}
    </pre>
  );
}
