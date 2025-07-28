import z from 'zod';

export const deployParamsSchema = z
  .object({
    // common
    type: z.union([z.literal('git'), z.literal('docker'), z.literal('model')]).optional(),
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
    ports: z.union([z.string(), z.array(z.string())]).optional(),
    regions: z.union([z.string(), z.array(z.string())]).optional(),
    privileged: z.boolean().optional(),
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
    entrypoint: z.array(z.string()).optional(),
    command: z.string().optional(),
    args: z.array(z.string()).optional(),

    // misc
    app_id: z.string().optional(),
    app_name: z.string().optional(),
    service_id: z.string().optional(),
  })
  .passthrough();
