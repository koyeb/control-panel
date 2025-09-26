import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { useAppsFull } from 'src/api/hooks/app';
import { deployParamsSchema } from 'src/application/deploy-params-schema';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { createTranslate } from 'src/intl/translate';
import { Activities } from 'src/modules/home/activities/activities';
import { Apps } from 'src/modules/home/apps/apps';
import { News } from 'src/modules/home/news/news';
import { ServiceCreation } from 'src/modules/service-creation/service-creation';

export const Route = createFileRoute('/_main/')({
  component: HomePage,

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

const T = createTranslate('pages.home');

function HomePage() {
  const query = useAppsFull();

  if (query.isPending) {
    return <Loading />;
  }

  if (query.isError) {
    return <QueryError error={query.error} />;
  }

  if (query.data.length === 0) {
    return <ServiceCreation from="/" />;
  }

  return (
    <>
      <h1 className="typo-heading">
        <T id="title" />
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1fr_24rem]">
        <div className="row-span-2 min-w-0">
          <Apps apps={query.data} />
        </div>

        <News />
        <Activities />
      </div>
    </>
  );
}
