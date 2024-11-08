import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, UseFormReturn } from 'react-hook-form';

import { useInstances, useInstancesQuery, useRegionsQuery } from 'src/api/hooks/catalog';
import { useGithubAppQuery } from 'src/api/hooks/git';
import {
  useOrganization,
  useOrganizationQuery,
  useOrganizationQuotas,
  useOrganizationSummaryQuery,
  useUserQuery,
} from 'src/api/hooks/session';
import { OrganizationPlan } from 'src/api/model';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { useTrackEvent } from 'src/application/analytics';
import { notify } from 'src/application/notify';
import { PaymentDialog } from 'src/components/payment-form';
import { handleSubmit, useFormErrorHandler, useFormValues } from 'src/hooks/form';
import { Translate } from 'src/intl/translate';
import { hasProperty } from 'src/utils/object';

import { GpuAlert } from './components/gpu-alert';
import { QuotaAlert } from './components/quota-alert';
import { RestrictedGpuDialogOpen } from './components/restricted-gpu-dialog';
import { ServiceFormSkeleton } from './components/service-form-skeleton';
import { SubmitButton } from './components/submit-button';
import { ServiceCost, useEstimatedCost } from './helpers/estimated-cost';
import { mapServiceFormApiValidationError } from './helpers/map-service-form-api-validation-error';
import { getDeployParams } from './helpers/parse-deploy-params';
import { getServiceFormSections } from './helpers/service-form-sections';
import { ServiceNameSection } from './sections/00-service-name/service-name.section';
import { ServiceTypeSection } from './sections/01-service-type/service-type.section';
import { SourceSection } from './sections/02-source/source.section';
import { BuilderSection } from './sections/03-builder/builder.section';
import { DeploymentSection } from './sections/03-deployment/deployment.section';
import { EnvironmentVariablesSection } from './sections/04-environment-variables/environment-variables.section';
import { RegionsSection } from './sections/05-regions/regions.section';
import { InstanceSection } from './sections/06-instance/instance.section';
import { ScalingSection } from './sections/07-scaling/scaling.section';
import { VolumesSection } from './sections/08-volumes/volumes.section';
import { PortsSection } from './sections/09-ports/ports.section';
import { HealthChecksSection } from './sections/10-health-checks/health-checks.section';
import { ServiceFormSection, type ServiceForm } from './service-form.types';
import { submitServiceForm } from './submit-service-form';
import { useServiceForm } from './use-service-form';

const T = Translate.prefix('serviceForm');

type ServiceFormProps = {
  appId?: string;
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
  appId,
  serviceId,
  className,
  onDeployed,
  onSaved,
  onCostChanged,
  onDeployUrlChanged,
}: ServiceFormProps) {
  const organization = useOrganization();
  const quotas = useOrganizationQuotas();
  const instances = useInstances();

  const invalidate = useInvalidateApiQuery();
  const trackEvent = useTrackEvent();

  const form = useServiceForm(appId, serviceId);
  const formRef = useRef<HTMLFormElement>(null);

  const [requiredPlan, setRequiredPlan] = useState<OrganizationPlan>();
  const [restrictedGpuDialogOpen, setRestrictedGpuDialogOpen] = useState(false);

  const { mutateAsync } = useMutation({
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

  const onSubmit = async (values: ServiceForm) => {
    const instance = instances.find(hasProperty('identifier', values.instance.identifier));

    const isRestrictedGpu =
      instance?.category === 'gpu' &&
      quotas?.maxInstancesByType[instance.identifier] === 0 &&
      instance.status === 'restricted';

    if (instance?.category === 'gpu') {
      trackEvent('gpu_deployed', { gpu_id: instance.identifier });
    }

    if (instance?.plans !== undefined && !instance.plans.includes(organization.plan)) {
      setRequiredPlan(instance.plans[0] as OrganizationPlan);
    } else if (isRestrictedGpu) {
      setRestrictedGpuDialogOpen(true);
    } else {
      await mutateAsync(values);
    }
  };

  return (
    <>
      <FormProvider {...form}>
        <form
          ref={formRef}
          id="service-form"
          className={clsx('col gap-4', className)}
          onSubmit={handleSubmit(form, onSubmit)}
        >
          <GpuAlert />

          <QuotaAlert
            serviceId={form.watch('meta.serviceId') ?? undefined}
            instance={form.watch('instance.identifier') ?? undefined}
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

      <RestrictedGpuDialogOpen
        open={restrictedGpuDialogOpen}
        onClose={() => setRestrictedGpuDialogOpen(false)}
        instanceIdentifier={form.watch('instance.identifier')}
      />

      <PaymentDialog
        open={requiredPlan !== undefined}
        onClose={() => setRequiredPlan(undefined)}
        plan={requiredPlan}
        onPlanChanged={() => {
          setRequiredPlan(undefined);

          // re-render with new organization plan before submitting
          setTimeout(() => formRef.current?.requestSubmit(), 0);
        }}
        title={<T id="paymentDialog.title" />}
        description={
          <T
            id="paymentDialog.description"
            values={{
              plan: <span className="capitalize text-green">{requiredPlan}</span>,
              price: requiredPlan === 'starter' ? 0 : 79,
            }}
          />
        }
        submit={<T id="paymentDialog.submitButton" />}
      />
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
  regions: RegionsSection,
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
