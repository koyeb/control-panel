import { useMutation } from '@tanstack/react-query';
import { merge } from 'lodash-es';
import { Fragment, useMemo } from 'react';
import { Control, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@koyeb/design-system';
import { useInstances, useInstancesQuery, useRegions, useRegionsQuery } from 'src/api/hooks/catalog';
import { useGithubApp, useGithubAppQuery } from 'src/api/hooks/git';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { ControlledInput } from 'src/components/controlled';
import { LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { Translate } from 'src/intl/translate';
import { BranchMetadata, RepositoryMetadata } from 'src/modules/deployment/metadata/build-metadata';
import { DockerImageMetadata } from 'src/modules/deployment/metadata/docker-metadata';
import {
  InstanceTypeMetadata,
  RegionsMetadata,
  ScalingMetadata,
} from 'src/modules/deployment/metadata/runtime-metadata';

import { EstimatedCost } from './components/estimated-cost';
import { parseDeployParams } from './helpers/parse-deploy-params';
import { defaultServiceForm } from './initialize-service-form';
import { ServiceForm } from './service-form.types';
import { submitServiceForm } from './submit-service-form';

const T = Translate.prefix('serviceForm.exampleApp');

const schema = z.object({
  environmentVariables: z.array(z.object({ name: z.string(), value: z.string() })),
});

export function ExampleAppForm() {
  const instances = useInstancesQuery();
  const regions = useRegionsQuery();
  const githubApp = useGithubAppQuery();

  if (instances.isPending || regions.isPending || githubApp.isPending) {
    return <Loading />;
  }

  return <ExampleAppForm_ />;
}

function ExampleAppForm_() {
  const searchParams = useSearchParams();
  const instances = useInstances();
  const regions = useRegions();
  const githubApp = useGithubApp();

  const serviceForm = useMemo(() => {
    return merge(
      defaultServiceForm(),
      parseDeployParams(searchParams, instances, regions, githubApp?.organizationName),
    );
  }, [searchParams, instances, regions, githubApp]);

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      environmentVariables: serviceForm.environmentVariables
        .map(({ name, value }) => ({ name, value }))
        .filter(({ name }) => name !== ''),
    },
    resolver: useZodResolver(schema),
  });

  const navigate = useNavigate();

  const mutation = useMutation({
    async mutationFn({ environmentVariables }: FormValues<typeof form>) {
      return submitServiceForm({ ...serviceForm, appName: serviceForm.serviceName, environmentVariables });
    },
    onError: (error) => notify.error(error.message),
    onSuccess({ serviceId }) {
      navigate(routes.initialDeployment(serviceId));
    },
  });

  return (
    <form className="divide-y rounded-xl border" onSubmit={handleSubmit(form, mutation.mutateAsync)}>
      <div className="col gap-6 p-4">
        <Section title={<T id="overview" />}>
          <DeploymentDefinitionMetadata form={serviceForm} />
        </Section>

        {form.watch('environmentVariables').length > 0 && (
          <Section title={<T id="environmentVariables" />}>
            <EnvironmentVariables control={form.control} />
          </Section>
        )}

        <Section title={<T id="estimatedCost" />}>
          <EstimatedCost form={serviceForm} />
        </Section>
      </div>

      <div className="row justify-end gap-2 p-4">
        <LinkButton color="gray" href={routes.home()}>
          <Translate id="common.cancel" />
        </LinkButton>

        <Button type="submit" loading={form.formState.isSubmitting}>
          <T id="submitButton" />
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="col gap-3">
      <div className="font-medium">{title}</div>
      {children}
    </section>
  );
}

function DeploymentDefinitionMetadata({ form }: { form: ServiceForm }) {
  const { source, instance, scaling } = form;
  const { repositoryName, branch } = source.git.publicRepository;

  return (
    <div className="divide-y rounded-md border">
      <div className="row flex-wrap gap-6 p-3">
        {source.type === 'git' && (
          <>
            <RepositoryMetadata repository={repositoryName ?? ''} />
            <BranchMetadata repository={repositoryName ?? ''} branch={branch ?? ''} />
          </>
        )}

        {source.type === 'docker' && <DockerImageMetadata image={source.docker.image} />}
      </div>

      <div className="row flex-wrap gap-6 p-3">
        <InstanceTypeMetadata instanceType={instance.identifier ?? ''} />

        <ScalingMetadata
          scaling={{
            type: scaling.type,
            instances: scaling.fixed,
            min: scaling.autoscaling.min,
            max: scaling.autoscaling.max,
          }}
        />

        <RegionsMetadata regions={form.regions} />
      </div>
    </div>
  );
}

function EnvironmentVariables({ control }: { control: Control<z.infer<typeof schema>> }) {
  const { fields } = useFieldArray({ control, name: 'environmentVariables' });

  return (
    <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
      {fields.map(({ id }, index) => (
        <Fragment key={id}>
          <ControlledInput
            control={control}
            name={`environmentVariables.${index}.name`}
            label={index === 0 ? <T id="nameLabel" /> : undefined}
            disabled
          />

          <ControlledInput
            control={control}
            name={`environmentVariables.${index}.value`}
            label={index === 0 ? <T id="valueLabel" /> : undefined}
          />
        </Fragment>
      ))}
    </div>
  );
}
