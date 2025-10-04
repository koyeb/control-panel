import { CommandPaletteItem } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useCallback, useEffect } from 'react';

import { apiMutation, getApi, isComputeDeployment, mapDeployment, useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { getServiceUrls, isServiceRunning } from 'src/application/service-functions';
import { openDialog } from 'src/components/dialog';
import { useClipboard } from 'src/hooks/clipboard';
import { useNavigate } from 'src/hooks/router';
import { IconCopy, IconList, IconPause, IconPlay, IconRotateCw } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { App, ComputeDeployment, Deployment, Service } from 'src/model';
import { assert } from 'src/utils/assert';
import { isDefined } from 'src/utils/generic';
import { shortId } from 'src/utils/strings';

import { useCommandPaletteContext } from '../command-palette-context';

const T = createTranslate('modules.commandPalette.commands');

export function useServiceCommands(service: Service) {
  const { id, name } = service;
  const t = T.useTranslate();

  const { addItem } = useCommandPaletteContext();

  const invalidate = useInvalidateApiQuery();

  const invalidateService = useCallback(async () => {
    await invalidate('get /v1/services');
    await invalidate('get /v1/services/{id}', { path: { id } });
  }, [invalidate, id]);

  const { mutateAsync: redeploy } = useMutation({
    ...apiMutation('post /v1/services/{id}/redeploy', { path: { id }, body: {} }),
    onSuccess: async () => {
      await invalidateService();
      notify.success(t('redeployService.success', { name }));
    },
  });

  const { mutateAsync: pause } = useMutation({
    ...apiMutation('post /v1/services/{id}/pause', { path: { id } }),
    onSuccess: async () => {
      await invalidateService();
      notify.success(t('pauseService.success', { name }));
    },
  });

  useEffect(() => {
    const name = service.name;
    const items = new Set<ReturnType<typeof addItem>>();

    const redeployCommand = (): Omit<CommandPaletteItem, 'id'> => ({
      label: t('redeployService.label'),
      description: t('redeployService.description', { name }),
      Icon: IconRotateCw,
      execute: redeploy,
    });

    const pauseCommand = (): Omit<CommandPaletteItem, 'id'> => ({
      label: t('pauseService.label'),
      description: t('pauseService.description', { name }),
      Icon: IconPause,
      execute: pause,
    });

    const resumeCommand = (): Omit<CommandPaletteItem, 'id'> => ({
      label: t('resumeService.label'),
      description: t('resumeService.description', { name }),
      Icon: IconPlay,
      execute: () => setTimeout(() => openDialog('ResumeService', service), 0),
    });

    if (isServiceRunning(service)) {
      items.add(addItem(redeployCommand()));
      items.add(addItem(pauseCommand()));
    }

    if (service.status === 'PAUSED') {
      items.add(addItem(resumeCommand()));
    }

    return () => {
      items.forEach((item) => item.remove());
    };
  }, [addItem, service, redeploy, pause, t]);
}

export function useCreateServiceUrlsCommands(app: App, service: Service, deployment?: Deployment) {
  const t = T.useTranslate();
  const { addItem } = useCommandPaletteContext();

  const copy = useClipboard();

  useEffect(() => {
    const name = service.name;
    const items = new Set<ReturnType<typeof addItem>>();

    const urls = getServiceUrls(app, service, deployment);
    const externalUrls = urls.map((url) => url.externalUrl!).filter(isDefined);
    const internalUrls = urls.map((url) => url.internalUrl!).filter(isDefined);

    const copyExternalUrlsCommand = (): Omit<CommandPaletteItem, 'id'> => ({
      label: t('copyPublicUrl.label'),
      description: t('copyPublicUrl.description', { name }),
      Icon: IconCopy,
      hasSubItems: externalUrls.length > 1,
      execute: () => {
        if (externalUrls.length === 1) {
          copy(externalUrls[0]!);
        } else {
          for (const url of externalUrls) {
            addItem({
              label: url,
              execute: () => copy(url),
            });
          }
        }
      },
    });

    const copyPrivateDomainCommand = (): Omit<CommandPaletteItem, 'id'> => ({
      label: t('copyPrivateDomain.label'),
      description: t('copyPrivateDomain.description', { name }),
      Icon: IconCopy,
      hasSubItems: internalUrls.length > 1,
      execute: () => {
        if (internalUrls.length === 1) {
          copy(internalUrls[0]!);
        } else {
          for (const url of internalUrls) {
            addItem({ label: url, execute: () => copy(url) });
          }
        }
      },
    });

    const copyDeploymentIdCommand = (deploymentId: string): Omit<CommandPaletteItem, 'id'> => ({
      label: t('copyDeploymentId.label'),
      description: t('copyDeploymentId.description', { name }),
      Icon: IconCopy,
      execute: () => copy(deploymentId),
    });

    if (externalUrls.length > 0) {
      items.add(addItem(copyExternalUrlsCommand()));
    }

    if (internalUrls.length > 0) {
      items.add(addItem(copyPrivateDomainCommand()));
    }

    if (deployment) {
      items.add(addItem(copyDeploymentIdCommand(deployment.id)));
    }

    return () => {
      items.forEach((item) => item.remove());
    };
  }, [addItem, app, service, deployment, copy, t]);
}

export function useDeploymentListCommand(service: Service) {
  const t = T.useTranslate();

  const { addItem, setIcon, setPlaceholder } = useCommandPaletteContext();
  const navigate = useNavigate();

  useEffect(() => {
    const name = service.name;

    const item = addItem({
      label: t('listDeployments.label'),
      description: t('listDeployments.description', { name }),
      Icon: IconList,
      hasSubItems: true,
      execute: async () => {
        const api = getApi();

        setIcon(IconList);
        setPlaceholder(t('listDeployments.placeholder'));

        const deployments = await api('get /v1/deployments', { query: { service_id: service.id } }).then(
          ({ deployments }) => deployments!.map(mapDeployment),
        );

        for (const deployment of deployments) {
          assert(isComputeDeployment(deployment));

          addItem({
            label: t('listDeployments.deploymentLabel', {
              deploymentId: shortId(deployment.id),
              date: formatDistanceToNow(deployment.date),
            }),
            description: getDeploymentDescription(deployment, t),
            execute: () => {
              // todo: translation
              setPlaceholder('Select a deployment');

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
      item.remove();
    };
  }, [addItem, setIcon, setPlaceholder, service, navigate, t]);
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
