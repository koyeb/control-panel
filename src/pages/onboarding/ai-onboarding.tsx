import { useMutation } from '@tanstack/react-query';

import { useOrganization } from 'src/api/hooks/session';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { routes } from 'src/application/routes';
import { IconGithub, IconPackage } from 'src/components/icons';
import { useNavigate } from 'src/hooks/router';
import IconDocker from 'src/icons/docker.svg?react';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('onboarding.ai');

export function AiOnboarding() {
  const organization = useOrganization();
  const invalidate = useInvalidateApiQuery();
  const navigate = useNavigate();

  const mutation = useMutation({
    ...useApiMutationFn('updateSignupQualification', (aiDeploymentSource: string) => ({
      path: { id: organization.id },
      body: { signup_qualification: { ...organization.signupQualification, aiDeploymentSource } as never },
    })),
    async onSuccess(_, source) {
      await invalidate('getCurrentOrganization');

      const url = new URL('', window.location.origin);

      if (source === 'git') {
        url.searchParams.set('step', 'importProject');
        url.searchParams.set('type', 'git');
        url.pathname = routes.createService();
      }

      if (source === 'docker') {
        url.searchParams.set('step', 'importProject');
        url.searchParams.set('type', 'docker');
        url.pathname = routes.createService();
      }

      if (source === 'model') {
        url.searchParams.set('type', 'model');
        url.pathname = routes.deploy();
      }

      navigate(url);
    },
  });

  return (
    <section className="col w-full max-w-lg gap-4">
      <p className="text-lg font-medium">
        <T id="title" />
      </p>

      <DeploymentSourceOption
        Icon={IconGithub}
        title={<T id="github.title" />}
        description={<T id="github.description" />}
        onClick={() => mutation.mutate('git')}
      />

      <DeploymentSourceOption
        Icon={IconDocker}
        title={<T id="docker.title" />}
        description={<T id="docker.description" />}
        onClick={() => mutation.mutate('docker')}
      />

      <DeploymentSourceOption
        Icon={IconPackage}
        title={<T id="model.title" />}
        description={<T id="model.description" />}
        onClick={() => mutation.mutate('model')}
      />
    </section>
  );
}

type DeploymentSourceOptionProps = {
  Icon: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  description: React.ReactNode;
  onClick: () => void;
};

function DeploymentSourceOption({ Icon, title, description, onClick }: DeploymentSourceOptionProps) {
  return (
    <button
      type="button"
      className="row items-center gap-3 rounded-xl border p-3 text-start"
      onClick={onClick}
    >
      <div className="rounded-lg bg-muted p-3">
        <Icon className="size-10" />
      </div>
      <div>
        <div className="mb-1 font-medium">{title}</div>
        <div className="text-dim">{description}</div>
      </div>
    </button>
  );
}
