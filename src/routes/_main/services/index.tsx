import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { useAppsFull } from 'src/api';
import { deployParamsSchema } from 'src/application/deploy-params-schema';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { Apps } from 'src/modules/home/apps/apps';
import { ServiceCreation } from 'src/modules/service-creation/service-creation';

export const Route = createFileRoute('/_main/services/')({
  component: ServicesPage,

  validateSearch: deployParamsSchema.extend({
    type: z
      .union([z.literal('git'), z.literal('docker'), z.literal('private'), z.literal('model')])
      .optional(),
    step: z
      .union([
        z.literal('serviceType'),
        z.literal('importProject'),
        z.literal('builder'),
        z.literal('instanceRegions'),
        z.literal('review'),
        z.literal('initialDeployment'),
      ])
      .optional(),
  }),
});

function ServicesPage() {
  const query = useAppsFull();

  if (query.isPending) {
    return <Loading />;
  }

  if (query.isError) {
    return <QueryError error={query.error} />;
  }

  if (query.data.length === 0) {
    return <ServiceCreation from="/services" />;
  }

  return <Apps apps={query.data} showFilters />;
}
