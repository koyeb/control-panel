import { createFileRoute, redirect } from '@tanstack/react-router';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { CreateServicePage } from 'src/pages/service/create-service.page';
import { z } from 'zod';

const deployParams = z.object({
  // common
  type: z.union([z.literal('git'), z.literal('docker')]).optional(),
  name: z.string().optional(),
  service_type: z
    .union([
      z.literal('web'),
      z.literal('worker'),
      z.literal('private'),
      z.literal('database'),
      z.literal('model'),
    ])
    .default('web'),
  instance_type: z.string().optional(),
  ports: z.string().array().optional(),
  regions: z.string().array().optional(),
  privileged: z.string().optional(),
  instances_min: z.string().optional(),
  instances_max: z.string().optional(),
  autoscaling_average_cpu: z.string().optional(),
  autoscaling_average_mem: z.string().optional(),
  autoscaling_requests_per_second: z.string().optional(),
  autoscaling_concurrent_requests: z.string().optional(),
  autoscaling_requests_response_time: z.string().optional(),
  autoscaling_sleep_idle_delay: z.string().optional(),

  // git
  repository: z.string().optional(),
  branch: z.string().optional(),
  workdir: z.string().optional(),
  builder: z.string().optional(),
  build_command: z.string().optional(),
  run_command: z.string().optional(),
  dockerfile: z.string().optional(),
  target: z.string().optional(),

  // docker
  image: z.string().optional(),

  // git | docker
  entrypoint: z.string().optional(),
  command: z.string().optional(),
  args: z.string().optional(),

  // misc
  app_id: z.string().optional(),
  app_name: z.string().optional(),
  service_id: z.string().optional(),
});

export const Route = createFileRoute('/_main/services/new')({
  component: CreateServicePage,

  validateSearch: deployParams.passthrough().extend({
    step: z
      .union([
        z.literal('serviceType'),
        z.literal('importProject'),
        z.literal('instanceRegions'),
        z.literal('review'),
        z.literal('initialDeployment'),
      ])
      .default('serviceType'),
  }),

  loader: ({ context, location }) => {
    context.breadcrumb = getBreadcrumb(location, 'createService');

    if (!('service_type' in location.search)) {
      throw redirect({ from: Route.fullPath, search: { ...location.search, service_type: 'web' } });
    }
  },
});
