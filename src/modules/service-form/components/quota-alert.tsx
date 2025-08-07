import { Alert } from '@koyeb/design-system';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { isApiValidationError } from 'src/api/api-errors';
import { getQueryKey, useApi } from 'src/api/use-api';
import { ExternalLinkButton } from 'src/components/link';
import { Translate } from 'src/intl/translate';
import { wait } from 'src/utils/promises';

import { defaultServiceForm } from '../helpers/initialize-service-form';
import { serviceFormToDeploymentDefinition } from '../helpers/service-form-to-deployment';
import { Scaling } from '../service-form.types';

type QuotaAlertProps = {
  serviceId?: string;
  instance?: string;
  regions?: string[];
  scaling?: Scaling;
};

export function QuotaAlert(props: QuotaAlertProps) {
  const api = useApi();

  const serviceId = props.serviceId;
  const values = getValues(props);

  const { data: message } = useQuery({
    placeholderData: keepPreviousData,
    queryKey: getQueryKey(serviceId ? 'updateService' : 'createService', { serviceId, dryRun: true, values }),
    refetchInterval: false,
    async queryFn({ signal }) {
      if (!(await wait(500, signal))) {
        return null;
      }

      const definition = serviceFormToDeploymentDefinition(values);

      try {
        if (serviceId) {
          await api.updateService({
            path: { id: serviceId },
            query: { dry_run: true },
            body: { definition },
          });
        } else {
          await api.createService({
            query: { dry_run: true },
            body: { app_id: values.meta.appId ?? '15c6a049-6594-4df0-99c3-a5c262e69624', definition },
          });
        }

        return null;
      } catch (error) {
        return getMessage(error);
      }
    },
  });

  if (typeof message !== 'string') {
    return null;
  }

  return (
    <Alert variant="info" description={message}>
      <ExternalLinkButton openInNewTab color="blue" href="/settings/plans" className="ml-auto">
        <Translate id="common.upgradePlan" />
      </ExternalLinkButton>
    </Alert>
  );
}

function getValues({ serviceId, instance, regions, scaling }: QuotaAlertProps) {
  const values = defaultServiceForm();

  values.serviceName = 'service';
  values.source.type = 'docker';
  values.source.docker.image = 'image';
  values.environmentVariables = [];

  if (serviceId !== undefined) {
    values.meta.serviceId = serviceId;
  }

  if (instance !== undefined) {
    values.instance = instance;
  }

  if (regions !== undefined) {
    values.regions = regions;
  }

  if (scaling !== undefined) {
    values.scaling = scaling;
  }

  return values;
}

function getMessage(error: unknown): string | null {
  if (!(error instanceof Error)) {
    return null;
  }

  if (error.message.match(/due to your quota.$/)) {
    return error.message;
  }

  if (isApiValidationError(error)) {
    for (const field of error.fields) {
      if (field.description.match('not available with current plan') !== null) {
        return field.description;
      }
    }
  }

  return null;
}
