import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { useRef } from 'react';
import { FormProvider, UseFormReturn } from 'react-hook-form';

import { useCatalogInstance, useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { Translate } from 'src/intl/translate';

import { GpuAlert } from './components/gpu-alert';
import { QuotaAlert } from './components/quota-alert';
import { ServiceFormSkeleton } from './components/service-form-skeleton';
import { SubmitButton } from './components/submit-button';
import { mapServiceFormApiValidationError } from './helpers/map-service-form-api-validation-error';
import { usePreSubmitServiceForm } from './helpers/pre-submit-service-form';
import { getServiceFormSections } from './helpers/service-form-sections';
import { submitServiceForm } from './helpers/submit-service-form';
import { ServiceNameSection } from './sections/00-service-name/service-name.section';
import { ServiceTypeSection } from './sections/01-service-type/service-type.section';
import { SourceSection } from './sections/02-source/source.section';
import { BuilderSection } from './sections/03-builder/builder.section';
import { DeploymentSection } from './sections/03-deployment/deployment.section';
import { BulkEnvironmentVariablesEditionDialog } from './sections/04-environment-variables/bulk-environment-variables-edition';
import { EnvironmentVariablesSection } from './sections/04-environment-variables/environment-variables.section';
import { InstanceSection } from './sections/05-instance/instance.section';
import { ScalingSection } from './sections/06-scaling/scaling.section';
import { CreateVolumeDialog } from './sections/07-volumes/create-volume-dialog';
import { VolumesSection } from './sections/07-volumes/volumes.section';
import { PortsSection } from './sections/08-ports/ports.section';
import { HealthChecksSection } from './sections/09-health-checks/health-checks.section';
import { type ServiceForm, ServiceFormSection } from './service-form.types';

type ServiceFormProps = {
  form: UseFormReturn<ServiceForm>;
  className?: string;
  onDeployed: (appId: string, serviceId: string, deploymentId: string) => void;
  onSaved?: () => void;
  onBack?: () => void;
};

export function ServiceForm({ form, className, onDeployed, onSaved, onBack }: ServiceFormProps) {
  const invalidate = useInvalidateApiQuery();
  const instance = useCatalogInstance(form.watch('instance'));

  const formRef = useRef<HTMLFormElement>(null);
  const preSubmit = usePreSubmitServiceForm(formRef.current, form.watch('meta.previousInstance'));

  const mutation = useMutation({
    mutationFn: submitServiceForm,
    onError: useFormErrorHandler(form, mapError),
    async onSuccess(result, { meta }) {
      await Promise.all([
        invalidate('get /v1/apps'),
        invalidate('get /v1/services/{id}', { path: { id: result.serviceId } }),
        invalidate('get /v1/deployments', { query: { service_id: result.serviceId } }),
      ]);

      if (meta.saveOnly) {
        onSaved?.();
      } else {
        onDeployed(result.appId, result.serviceId, result.deploymentId);
      }
    },
  });

  if (form.formState.isLoading) {
    return <ServiceFormSkeleton className={className} />;
  }

  return (
    <>
      <FormProvider {...form}>
        <form
          ref={formRef}
          id="service-form"
          className={clsx('col gap-4', className)}
          onSubmit={handleSubmit(form, (values) => {
            if (instance && preSubmit(instance)) {
              return mutation.mutateAsync(values);
            }
          })}
        >
          <GpuAlert />

          <QuotaAlert
            serviceId={form.watch('meta.serviceId') ?? undefined}
            instance={form.watch('instance') ?? undefined}
            regions={form.watch('regions')}
            scaling={form.watch('scaling')}
          />

          <div className="rounded-lg border">
            {getServiceFormSections(form.watch()).map((section) => {
              const Component = sectionComponents[section];
              return <Component key={section} />;
            })}
          </div>

          <div className="row gap-4">
            {onBack && (
              <Button color="gray" onClick={onBack}>
                <Translate id="common.back" />
              </Button>
            )}

            <SubmitButton loading={form.formState.isSubmitting} />
          </div>
        </form>
      </FormProvider>

      <BulkEnvironmentVariablesEditionDialog form={form} />
      <CreateVolumeDialog form={form} />
    </>
  );
}

const sectionComponents: Record<ServiceFormSection, React.ComponentType<unknown>> = {
  serviceType: ServiceTypeSection,
  source: SourceSection,
  builder: BuilderSection,
  deployment: DeploymentSection,
  environmentVariables: EnvironmentVariablesSection,
  instance: InstanceSection,
  scaling: ScalingSection,
  volumes: VolumesSection,
  ports: PortsSection,
  healthChecks: HealthChecksSection,
  serviceName: ServiceNameSection,
};

function mapError(fields: Record<string, string>): Record<string, string> {
  const [mapped, unhandled] = mapServiceFormApiValidationError(fields);

  if (unhandled.length > 0) {
    notify.error(unhandled[0]?.message);
  }

  return mapped as Record<string, string>;
}
