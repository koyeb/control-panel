import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { listAppsFull, useAppsFull } from 'src/api';
import { deployParamsSchema } from 'src/application/deploy-params-schema';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { createTranslate } from 'src/intl/translate';
import { Activities } from 'src/modules/home/activities/activities';
import { Apps } from 'src/modules/home/apps/apps';
import { HomePageBanner } from 'src/modules/home/banner/banner';
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

  async loader({ context: { queryClient } }) {
    await queryClient.ensureQueryData({
      queryKey: ['listAppsFull'],
      queryFn: listAppsFull,
    });
  },
});

const T = createTranslate('pages.home');

const banner = {
  id: '',
  title: 'Discover scale-to-zero and autoscaling',
  description:
    'Take a deep dive into how our scale-to-zero and autoscaling can benefit your high performance production services.',
  cta: {
    label: 'Discover more',
    href: '#',
  },
};

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
      {banner.id && <HomePageBanner {...banner} />}

      <h1 className="my-8 typo-heading">
        <T id="title" />
      </h1>

      <div className="row gap-8">
        <div className="min-w-0 flex-1">
          <Apps apps={query.data} />
        </div>

        <div className="hidden w-sm xl:block">
          <Activities />
        </div>
      </div>
    </>
  );
}
