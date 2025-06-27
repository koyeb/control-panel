import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';

import { useGithubApp } from 'src/api/hooks/git';
import { useApiMutationFn } from 'src/api/use-api';
import { routes } from 'src/application/routes';
import { IconGithub, IconArrowRight } from 'src/components/icons';
import { Intro } from 'src/components/intro';
import { useShortcut } from 'src/hooks/shortcut';
import IconDocker from 'src/icons/docker.svg?react';
import { createTranslate } from 'src/intl/translate';

import { useCreateServiceDialog } from '../use-create-service-dialog';

const T = createTranslate('modules.createServiceDialog');

export function Github() {
  const githubApp = useGithubApp();
  const installGithubApp = useInstallGithubApp();
  const { deploymentMethodChanged } = useCreateServiceDialog();

  const onClick = () => {
    if (githubApp) {
      deploymentMethodChanged('github');
    } else {
      installGithubApp();
    }
  };

  useShortcut(['Enter'], onClick);

  return (
    <Intro
      icon={<IconGithub className="icon" />}
      title={<T id="github" />}
      description={<T id="githubDescription" />}
      cta={
        <Button onClick={onClick}>
          {!githubApp && <T id="installGithubApp" />}
          {githubApp && <T id="deployWith" values={{ type: <T id="github" /> }} />}
          <IconArrowRight />
        </Button>
      }
      className="p-6"
    />
  );
}

function useInstallGithubApp() {
  const { serviceType } = useCreateServiceDialog();

  const { mutate: installGithubApp } = useMutation({
    ...useApiMutationFn('installGithubApp', (metadata: string) => ({
      body: { metadata },
    })),
    onSuccess(result) {
      window.location.href = result.url!;
    },
  });

  return () => {
    const params = new URLSearchParams({
      service_type: serviceType as string,
      step: 'importProject',
      type: 'git',
    });

    installGithubApp(`${routes.createService()}?${params.toString()}`);
  };
}

export function Docker() {
  const { deploymentMethodChanged } = useCreateServiceDialog();

  const onClick = () => {
    deploymentMethodChanged('docker');
  };

  useShortcut(['Enter'], onClick);

  return (
    <Intro
      icon={<IconDocker className="icon" />}
      title={<T id="docker" />}
      description={<T id="dockerDescription" />}
      cta={
        <Button onClick={onClick}>
          <T id="deployWith" values={{ type: <T id="docker" /> }} />
          <IconArrowRight />
        </Button>
      }
      className="p-6"
    />
  );
}
