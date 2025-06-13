import { z } from 'zod';

import { EnvironmentVariable } from 'src/api/model';
import { isSlug } from 'src/utils/strings';

import { File } from '../service-form.types';

const git = z.discriminatedUnion('repositoryType', [
  z.object({
    repositoryType: z.literal('organization'),
    organizationRepository: z.object({
      repositoryName: z.string(),
      branch: z.string().nullable(),
      autoDeploy: z.boolean(),
    }),
    workDirectory: z.string().nullable(),
  }),
  z.object({
    repositoryType: z.literal('public'),
    publicRepository: z.object({
      repositoryName: z.string(),
      url: z
        .string()
        .min(1)
        .refine((value) => value.match(/.+\/.+/)),
      branch: z.string().nullable(),
    }),
    workDirectory: z.string().nullable(),
  }),
]);

const docker = z.object({
  image: z.string().trim().min(1),
  registrySecret: z.string().nullable(),
});

const builder = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('buildpack'),
    buildpackOptions: z.object({
      buildCommand: z.string().nullable(),
      runCommand: z.string().nullable(),
      privileged: z.boolean(),
    }),
  }),
  z.object({
    type: z.literal('dockerfile'),
    dockerfileOptions: z.object({
      dockerfile: z.string().nullable(),
      entrypoint: z.array(z.string()).nullable(),
      command: z.string().nullable(),
      args: z.array(z.string()).nullable(),
      target: z.string().nullable(),
      privileged: z.boolean(),
    }),
  }),
]);

const dockerDeployment = z.object({
  entrypoint: z.array(z.string()).nullable(),
  command: z.string().nullable(),
  args: z.array(z.string()).nullable(),
  privileged: z.boolean(),
});

function preprocessEnvironmentVariable(value: unknown) {
  return (value as EnvironmentVariable[]).filter((value) => value.name !== '');
}

const environmentVariable = z.object({
  name: z.string().trim(),
  value: z.string(),
  regions: z.array(z.string()),
});

function preprocessFiles(value: unknown) {
  return (value as File[]).filter((value) => value.mountPath !== '');
}

const file = z.object({
  mountPath: z.string().startsWith('/'),
  content: z.string(),
});

const regions = z.array(z.string()).min(1);

const instance = z
  .string()
  .nullable()
  .refine((id) => id !== null);

const scaling = z
  .object({
    min: z.number().min(0).max(20),
    max: z.number().min(0).max(20),
    targets: z.object({
      cpu: target(1, 100),
      memory: target(1, 100),
      requests: target(1, 1e9),
      concurrentRequests: target(1, 1e9),
      responseTime: target(1, 1e9),
      sleepIdleDelay: target(3 * 60, 60 * 60),
    }),
  })
  .refine(({ min, max, targets }) => {
    if (min === max || max === 1) {
      return true;
    }

    const enabledTargets = Object.values(targets).filter((target) => target.enabled);
    return enabledTargets.length > 0;
  }, 'noTargetSelected');

function target(min: number, max: number) {
  return z.discriminatedUnion('enabled', [
    z.object({
      enabled: z.literal(true),
      value: z.number().min(min).max(max),
    }),
    z.object({
      enabled: z.literal(false),
      value: z.number(),
    }),
  ]);
}

const healthCheckCommon = z.object({
  gracePeriod: z
    .number()
    .min(5)
    .max(15 * 60),
  interval: z
    .number()
    .min(3)
    .max(5 * 60),
  restartLimit: z.number().min(1).max(10),
  timeout: z
    .number()
    .min(1)
    .max(10 * 60),
});

const healthCheck = z.discriminatedUnion('protocol', [
  healthCheckCommon.extend({ protocol: z.literal('tcp') }),
  healthCheckCommon.extend({
    protocol: z.literal('http'),
    method: z.string(),
    path: z.string().startsWith('/'),
    headers: z.array(
      z.object({
        name: z.string().min(1),
        value: z.string().min(1),
      }),
    ),
  }),
]);

const portCommon = z.object({
  portNumber: z.number().min(1).lt(65000),
  protocol: z.string(),
  proxy: z.boolean(),
  healthCheck,
});

const ports = z.discriminatedUnion('public', [
  portCommon.extend({
    public: z.literal(true),
    path: z
      .string()
      .startsWith('/')
      .refine((value) => !value.includes(' '), { params: { noWhiteSpace: true } }),
  }),
  portCommon.extend({
    public: z.literal(false),
  }),
]);

const volumes = z.object({
  volumeId: z.string().optional(),
  name: z.string(),
  size: z.number(),
  mountPath: z.string().startsWith('/'),
});

function preprocessVolumes(value: unknown) {
  return (value as Array<{ name: string }>).filter((value) => value.name !== '');
}

export const serviceFormSchema = z.object({
  meta: z.object({}).passthrough(),
  appName: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .refine(isSlug, { params: { refinement: 'isSlug' } }),
  serviceName: z
    .string()
    .trim()
    .min(2)
    .max(63)
    .refine(isSlug, { params: { refinement: 'isSlug' } }),
  serviceType: z.string(),
  source: z.discriminatedUnion('type', [
    z.object({ type: z.literal('archive'), archive: z.object({ archiveId: z.string() }) }),
    z.object({ type: z.literal('git'), git }),
    z.object({ type: z.literal('docker'), docker }),
  ]),
  builder,
  dockerDeployment,
  environmentVariables: z.preprocess(preprocessEnvironmentVariable, z.array(environmentVariable)),
  files: z.preprocess(preprocessFiles, z.array(file)),
  regions,
  instance,
  scaling,
  ports: z.array(ports),
  volumes: z.preprocess(preprocessVolumes, z.array(volumes)),
});
