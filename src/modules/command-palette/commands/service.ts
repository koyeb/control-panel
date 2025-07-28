import { useMutation } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useCallback, useEffect } from 'react';

import { isComputeDeployment, mapDeployment } from 'src/api/mappers/deployment';
import { App, ComputeDeployment, Deployment, Service } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { getApi } from 'src/application/container';
import { notify } from 'src/application/notify';
import { getServiceUrls, isServiceRunning } from 'src/application/service-functions';
import { Dialog } from 'src/components/dialog';
import { useClipboard } from 'src/hooks/clipboard';
import { useNavigate } from 'src/hooks/router';
import { IconCopy, IconList, IconPause, IconPlay, IconRotateCw } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';
import { isDefined } from 'src/utils/generic';
import { shortId } from 'src/utils/strings';

import { useCommandPaletteContext } from '../command-palette-context';

const T = createTranslate('modules.commandPalette.commands');

export function useCreateServiceCommands(service: Service) {
  const { id, name } = service;
  const t = T.useTranslate();

  const { addOption, removeOption } = useCommandPaletteContext();

  const openDialog = Dialog.useOpen();
  const invalidate = useInvalidateApiQuery();

  const invalidateService = useCallback(async () => {
    await invalidate('listServices');
    await invalidate('getService', { path: { id } });
  }, [invalidate, id]);

  const { mutateAsync: redeploy } = useMutation({
    ...useApiMutationFn('redeployService', { path: { id }, body: {} }),
    onSuccess: async () => {
      await invalidateService();
      notify.success(t('redeployService.success', { name }));
    },
  });

  const { mutateAsync: pause } = useMutation({
    ...useApiMutationFn('pauseService', { path: { id } }),
    onSuccess: async () => {
      await invalidateService();
      notify.success(t('pauseService.success', { name }));
    },
  });

  useEffect(() => {
    const name = service.name;

    if (isServiceRunning(service)) {
      addOption({
        id: 'redeployService',
        label: t('redeployService.label'),
        description: t('redeployService.description', { name }) as string,
        Icon: IconRotateCw,
        execute: redeploy,
      });

      addOption({
        id: 'pauseService',
        label: t('pauseService.label'),
        description: t('pauseService.description', { name }) as string,
        Icon: IconPause,
        execute: pause,
      });
    }

    if (service.status === 'PAUSED') {
      addOption({
        id: 'resumeService',
        label: t('resumeService.label'),
        description: t('resumeService.description', { name }) as string,
        Icon: IconPlay,
        execute: () => setTimeout(() => openDialog('ResumeService', { resourceId: service.id }), 0),
      });
    }

    return () => {
      removeOption('redeployService');
      removeOption('resumeService');
      removeOption('pauseService');
    };
  }, [service, addOption, removeOption, redeploy, pause, openDialog, t]);
}

export function useCreateServiceUrlsCommands(app: App, service: Service, deployment?: Deployment) {
  const t = T.useTranslate();
  const { addOption, removeOption } = useCommandPaletteContext();

  const copy = useClipboard();

  useEffect(() => {
    const name = service.name;

    const urls = getServiceUrls(app, service, deployment);
    const externalUrls = urls.map((url) => url.externalUrl!).filter(isDefined);
    const internalUrls = urls.map((url) => url.internalUrl!).filter(isDefined);

    if (externalUrls.length > 0) {
      addOption({
        id: 'copyPublicUrl',
        label: t('copyPublicUrl.label'),
        description: t('copyPublicUrl.description', { name }) as string,
        Icon: IconCopy,
        hasSubOptions: externalUrls.length > 1,
        execute: () => {
          if (externalUrls.length === 1) {
            copy(externalUrls[0]!);
          } else {
            for (const url of externalUrls) {
              addOption({
                id: url,
                label: url,
                execute: () => copy(url),
              });
            }
          }
        },
      });
    }

    if (internalUrls.length > 0) {
      addOption({
        id: 'copyPrivateDomain',
        label: t('copyPrivateDomain.label'),
        description: t('copyPrivateDomain.description', { name }) as string,
        Icon: IconCopy,
        hasSubOptions: internalUrls.length > 1,
        execute: () => {
          if (internalUrls.length === 1) {
            copy(internalUrls[0]!);
          } else {
            for (const url of internalUrls) {
              addOption({
                id: url,
                label: url,
                execute: () => copy(url),
              });
            }
          }
        },
      });
    }

    if (deployment) {
      addOption({
        id: 'copyDeploymentId',
        label: t('copyDeploymentId.label'),
        description: t('copyDeploymentId.description', { name }) as string,
        Icon: IconCopy,
        execute: () => copy(deployment.id),
      });
    }

    return () => {
      removeOption('copyPublicUrl');
      removeOption('copyPrivateDomain');
      removeOption('copyDeploymentId');
    };
  }, [app, service, deployment, addOption, removeOption, copy, t]);
}

export function useDeploymentListCommand(service: Service) {
  const t = T.useTranslate();

  const { addOption, removeOption } = useCommandPaletteContext();
  const navigate = useNavigate();

  useEffect(() => {
    const name = service.name;

    addOption({
      id: 'listDeployments',
      label: t('listDeployments.label'),
      description: t('listDeployments.description', { name }) as string,
      Icon: IconList,
      hasSubOptions: true,
      placeholder: t('listDeployments.placeholder'),
      execute: async () => {
        const deployments = await getApi()
          .listDeployments({ query: { service_id: service.id } })
          .then(({ deployments }) => deployments!.map(mapDeployment));

        for (const deployment of deployments) {
          assert(isComputeDeployment(deployment));

          addOption({
            id: deployment.id,
            label: t('listDeployments.deploymentLabel', {
              deploymentId: shortId(deployment.id),
              date: formatDistanceToNow(deployment.date),
            }) as string,
            description: getDeploymentDescription(deployment, t),
            placeholder: 'Select a deployment',
            execute: () => {
              return navigate({
                to: '/services/$serviceId',
                params: { serviceId: service.id },
                search: { deploymentId: deployment.id },
              });
            },
          });
        }
      },
    });

    return () => {
      removeOption('listDeployments');
    };
  }, [service, addOption, removeOption, navigate, t]);
}

function getDeploymentDescription(deployment: ComputeDeployment, t: ReturnType<typeof T.useTranslate>) {
  const { trigger } = deployment;

  if (trigger?.type == 'initial') {
    return t('listDeployments.trigger.initial');
  }

  if (trigger?.type == 'resume') {
    return t('listDeployments.trigger.resume');
  }

  if (trigger?.type == 'git') {
    return trigger.commit.message;
  }

  return t('listDeployments.trigger.redeploy');
}
