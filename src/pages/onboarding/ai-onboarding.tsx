import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { useInstances } from 'src/api/hooks/catalog';
import { useOrganization } from 'src/api/hooks/session';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { AiModel, aiModels } from 'src/application/ai-models-catalog';
import { routes } from 'src/application/routes';
import { useNavigate } from 'src/hooks/router';
import { hasProperty } from 'src/utils/object';

export function AiOnboarding() {
  const organization = useOrganization();
  const invalidate = useInvalidateApiQuery();
  const navigate = useNavigate();

  const [gpu, setGpu] = useState<string>();
  const [deploymentSource, setDeploymentSource] = useState<string>();
  const [model, setModel] = useState<AiModel | 'custom'>();

  const mutation = useMutation({
    ...useApiMutationFn('updateSignupQualification', (gpu: string) => ({
      path: { id: organization.id },
      body: { signup_qualification: { ...organization.signupQualification, gpu } as never },
    })),
    async onSuccess() {
      await invalidate('getCurrentOrganization');

      if (gpu !== undefined) {
        handleNavigate(navigate, gpu, deploymentSource, model);
      }
    },
  });

  return (
    <div className="col w-full max-w-lg gap-8">
      {gpu === undefined && (
        <GpuStep
          onSelected={(gpu) => {
            if (gpu === 'none') {
              mutation.mutate(gpu);
            } else {
              setGpu(gpu);
            }
          }}
        />
      )}

      {gpu !== undefined && deploymentSource === undefined && (
        <DeploymentSourceStep
          onSelected={(source) => {
            setDeploymentSource(source);

            if (source !== 'model') {
              mutation.mutate(gpu);
            }
          }}
        />
      )}

      {gpu !== undefined && deploymentSource === 'model' && (
        <ModelStep
          onSelected={(model) => {
            setModel(model);
            mutation.mutate(gpu);
          }}
        />
      )}
    </div>
  );
}

function handleNavigate(
  navigate: (path: string) => void,
  gpu: string,
  deploymentSource: string | undefined,
  model: AiModel | 'custom' | undefined,
) {
  const params = new URLSearchParams();

  params.set('instance_type', gpu);

  if (!model) {
    params.set('step', 'importProject');

    if (deploymentSource === 'docker') {
      params.set('type', 'docker');
    }

    if (deploymentSource === 'github') {
      params.set('type', 'git');
    }

    navigate(`${routes.createService()}?${params.toString()}`);
  } else {
    if (model !== 'custom') {
      params.set('model', model.slug);
      params.set('type', 'docker');
      params.set('image', model.image);
    } else {
      params.set('model', model);
      params.set('type', 'git');
      params.set('builder', 'dockerfile');
      params.set('repository', 'github.com/koyeb/example-vllm');
      params.set('branch', 'main');
    }

    navigate(`${routes.deploy()}?${params.toString()}`);
  }
}

function GpuStep({ onSelected }: { onSelected: (gpu: string) => void }) {
  const instances = useInstances();

  return (
    <section className="col gap-4">
      <p className="text-lg font-medium">Which GPU do you want to use?</p>

      <ul className="col gap-2">
        {instances.filter(hasProperty('category', 'gpu')).map((instance) => (
          <li key={instance.identifier}>
            <button
              onClick={() => onSelected(instance.identifier)}
              className="w-full rounded border px-4 py-2 text-start font-medium"
            >
              {instance.displayName}
            </button>
          </li>
        ))}

        <li>
          <button
            onClick={() => onSelected('none')}
            className="w-full rounded border px-4 py-2 text-start font-medium"
          >
            {"I don't need a GPU"}
          </button>
        </li>
      </ul>
    </section>
  );
}

function DeploymentSourceStep({ onSelected }: { onSelected: (source: string) => void }) {
  return (
    <section className="col gap-4">
      <p className="text-lg font-medium">What do ou want to deploy?</p>

      <ul className="col gap-2">
        <li>
          <button
            onClick={() => onSelected('model')}
            className="w-full rounded border px-4 py-2 text-start font-medium"
          >
            Model
          </button>
        </li>

        <li>
          <button
            onClick={() => onSelected('docker')}
            className="w-full rounded border px-4 py-2 text-start font-medium"
          >
            Docker image
          </button>
        </li>

        <li>
          <button
            onClick={() => onSelected('github')}
            className="w-full rounded border px-4 py-2 text-start font-medium"
          >
            Github repository
          </button>
        </li>
      </ul>
    </section>
  );
}

function ModelStep({ onSelected }: { onSelected: (model: AiModel | 'custom') => void }) {
  return (
    <section className="col gap-4">
      <p className="text-lg font-medium">Which model do you want to deploy?</p>

      <ul className="col gap-2">
        {aiModels.map((model) => (
          <li key={model.slug}>
            <button
              onClick={() => onSelected(model)}
              className="w-full rounded border px-4 py-2 text-start font-medium"
            >
              {model.name}
            </button>
          </li>
        ))}

        <li>
          <button
            onClick={() => onSelected('custom')}
            className="w-full rounded border px-4 py-2 text-start font-medium"
          >
            {'Deploy my own model'}
          </button>
        </li>
      </ul>
    </section>
  );
}
