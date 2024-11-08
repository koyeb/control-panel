import { useMutation } from '@tanstack/react-query';
import { merge } from 'lodash-es';
import { Fragment, useMemo } from 'react';
import { Control, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@koyeb/design-system';
import { useInstances, useInstancesQuery, useRegions, useRegionsQuery } from 'src/api/hooks/catalog';
import { useGithubApp, useGithubAppQuery } from 'src/api/hooks/git';
import { ExampleApp } from 'src/api/model';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { ControlledInput } from 'src/components/controlled';
import { Loading } from 'src/components/loading';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
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
import { mapServiceFormApiValidationError } from './helpers/map-service-form-api-validation-error';
import { parseDeployParams } from './helpers/parse-deploy-params';
import { defaultServiceForm } from './initialize-service-form';
import { ServiceForm } from './service-form.types';
import { submitServiceForm } from './submit-service-form';

const T = Translate.prefix('serviceForm.exampleApp');

const schema = z.object({
  environmentVariables: z.array(z.object({ name: z.string(), value: z.string() })),
});

export function ExampleAppForm(props: { app: ExampleApp }) {
  const instances = useInstancesQuery();
  const regions = useRegionsQuery();
  const githubApp = useGithubAppQuery();

  if (instances.isPending || regions.isPending || githubApp.isPending) {
    return <Loading />;
  }

  return <ExampleAppForm_ {...props} />;
}

function ExampleAppForm_({ app }: React.ComponentProps<typeof ExampleAppForm>) {
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
    onError: useFormErrorHandler(form, mapError),
    onSuccess({ serviceId }) {
      navigate(routes.initialDeployment(serviceId));
    },
  });

  return (
    <form className="divide-y rounded-xl border" onSubmit={handleSubmit(form, mutation.mutateAsync)}>
      <Header app={app} />

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
        <Button color="gray">
          <Translate id="common.cancel" />
        </Button>

        <Button type="submit" loading={form.formState.isSubmitting}>
          <T id="submitButton" />
        </Button>
      </div>
    </form>
  );
}

function mapError(fields: Record<string, string>): Record<string, string> {
  const [mapped, unhandled] = mapServiceFormApiValidationError(fields);

  if (unhandled.length > 0) {
    notify.error(unhandled[0]?.message);
  }

  return mapped as Record<string, string>;
}

function Header({ app }: { app: ExampleApp }) {
  return (
    <header className="row items-start gap-4 p-4">
      <div className="rounded-md bg-black/60 p-1.5">
        <img src={app.logo} className="size-12 rounded-md grayscale" />
      </div>

      <div className="flex-1">
        <div className="text-xl">{app.name}</div>
        <div className="text-lg text-dim">{app.description}</div>
      </div>
    </header>
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
