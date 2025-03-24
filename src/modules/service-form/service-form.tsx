import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { useEffect, useMemo, useRef } from 'react';
import { FormProvider, UseFormReturn } from 'react-hook-form';

import { useInstance, useInstancesQuery, useRegionsQuery } from 'src/api/hooks/catalog';
import { useGithubAppQuery } from 'src/api/hooks/git';
import { useOrganizationQuery, useOrganizationSummaryQuery, useUserQuery } from 'src/api/hooks/session';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { handleSubmit, useFormErrorHandler, useFormValues } from 'src/hooks/form';

import { GpuAlert } from './components/gpu-alert';
import { QuotaAlert } from './components/quota-alert';
import { QuotaIncreaseRequestDialog } from './components/quota-increase-request-dialog';
import { ServiceFormSkeleton } from './components/service-form-skeleton';
import { ServiceFormUpgradeDialog } from './components/service-form-upgrade-dialog';
import { SubmitButton } from './components/submit-button';
import { ServiceCost, useEstimatedCost } from './helpers/estimated-cost';
import { getDeployParams } from './helpers/get-deploy-params';
import { mapServiceFormApiValidationError } from './helpers/map-service-form-api-validation-error';
import { usePreSubmitServiceForm } from './helpers/pre-submit-service-form';
import { getServiceFormSections } from './helpers/service-form-sections';
import { submitServiceForm } from './helpers/submit-service-form';
import { ServiceNameSection } from './sections/00-service-name/service-name.section';
import { ServiceTypeSection } from './sections/01-service-type/service-type.section';
import { SourceSection } from './sections/02-source/source.section';
import { BuilderSection } from './sections/03-builder/builder.section';
import { DeploymentSection } from './sections/03-deployment/deployment.section';
import { EnvironmentVariablesSection } from './sections/04-environment-variables/environment-variables.section';
import { InstanceSection } from './sections/05-instance/instance.section';
import { ScalingSection } from './sections/06-scaling/scaling.section';
import { VolumesSection } from './sections/07-volumes/volumes.section';
import { PortsSection } from './sections/08-ports/ports.section';
import { HealthChecksSection } from './sections/09-health-checks/health-checks.section';
import { ServiceFormSection, type ServiceForm } from './service-form.types';
import { useServiceForm } from './use-service-form';

type ServiceFormProps = {
  serviceId?: string;
  className?: string;
  onDeployed: (appId: string, serviceId: string, deploymentId: string) => void;
  onSaved?: () => void;
  onCostChanged?: (cost: ServiceCost | undefined) => void;
  onDeployUrlChanged?: (url: string) => void;
};

export function ServiceForm(props: ServiceFormProps) {
  return (
    <FetchServiceFormResources className={props.className}>
      <ServiceForm_ {...props} />
    </FetchServiceFormResources>
  );
}

function ServiceForm_({
  serviceId,
  className,
  onDeployed,
  onSaved,
  onCostChanged,
  onDeployUrlChanged,
}: ServiceFormProps) {
  const invalidate = useInvalidateApiQuery();

  const form = useServiceForm(serviceId);
  const formRef = useRef<HTMLFormElement>(null);

  const mutation = useMutation({
    mutationFn: submitServiceForm,
    onError: useFormErrorHandler(form, mapError),
    async onSuccess(result, { meta }) {
      await Promise.all([
        invalidate('listApps'),
        invalidate('getService', { path: { id: result.serviceId } }),
        invalidate('listDeployments', { query: { service_id: result.serviceId } }),
      ]);

      if (meta.saveOnly) {
        onSaved?.();
      } else {
        onDeployed(result.appId, result.serviceId, result.deploymentId);
      }
    },
  });

  const [requiredPlan, preSubmit] = usePreSubmitServiceForm(form.watch('meta.previousInstance'));

  const instance = useInstance(form.watch('instance'));
  const cost = useEstimatedCost(useFormValues(form));
  const deployUrl = useDeployUrl(form);

  useEffect(() => {
    onCostChanged?.(cost);
  }, [onCostChanged, cost]);

  useEffect(() => {
    if (deployUrl !== undefined) {
      onDeployUrlChanged?.(deployUrl);
    }
  }, [onDeployUrlChanged, deployUrl]);

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

          <SubmitButton loading={form.formState.isSubmitting} />
        </form>
      </FormProvider>

      <QuotaIncreaseRequestDialog catalogInstanceId={form.watch('instance')} />
      <ServiceFormUpgradeDialog plan={requiredPlan} submitForm={() => formRef.current?.requestSubmit()} />
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

type FetchServiceFormResourcesProps = {
  className?: string;
  children: React.ReactNode;
};

function FetchServiceFormResources({ className, children }: FetchServiceFormResourcesProps) {
  const userQuery = useUserQuery();
  const organizationQuery = useOrganizationQuery();
  const organizationSummaryQuery = useOrganizationSummaryQuery();
  const regionsQuery = useRegionsQuery();
  const instancesQuery = useInstancesQuery();
  const githubAppQuery = useGithubAppQuery();

  if (
    userQuery.isPending ||
    organizationQuery.isPending ||
    organizationSummaryQuery.isPending ||
    regionsQuery.isPending ||
    instancesQuery.isPending ||
    githubAppQuery.isPending
  ) {
    return <ServiceFormSkeleton className={className} />;
  }

  return children;
}

function useDeployUrl({ formState, getValues }: UseFormReturn<ServiceForm>) {
  return useMemo(() => {
    if (formState.isLoading) {
      return;
    }

    return `${window.location.origin}/deploy?${getDeployParams(getValues()).toString()}`;
  }, [formState, getValues]);
}
