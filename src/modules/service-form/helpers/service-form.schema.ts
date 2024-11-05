import { z } from 'zod';

import { TranslateFn, TranslationKeys } from 'src/intl/translate';
import { isSlug } from 'src/utils/strings';

type RemovePrefix<T extends string, P extends string> = T extends `${P}${infer R}` ? R : never;
type Keys = RemovePrefix<TranslationKeys, 'serviceForm.errors.'>;

type TranslateErrorFunction = (key: Keys, values?: Record<string, string | number>) => string;

export function serviceFormSchema(translate: TranslateFn) {
  // @ts-expect-error this works
  const t: TranslateErrorFunction = (key, values) => {
    return translate(`serviceForm.errors.${key}`, values);
  };

  const appName = t('appName');
  const serviceName = t('serviceName');

  return z.object({
    meta: z.object({}).passthrough(),
    appName: z
      .string()
      .trim()
      .min(3, t('minLength', { label: appName, min: 3 }))
      .max(23, t('maxLength', { label: appName, max: 23 }))
      .refine(isSlug, t('slug', { label: appName })),
    serviceName: z
      .string()
      .trim()
      .min(2, t('minLength', { label: serviceName, min: 2 }))
      .max(63, t('maxLength', { label: serviceName, max: 63 }))
      .refine(isSlug, t('slug', { label: serviceName })),
    serviceType: z.string(),
    source: z.discriminatedUnion('type', [
      z.object({ type: z.literal('archive'), archive: z.object({ archiveId: z.string() }) }),
      z.object({ type: z.literal('git'), git: git(t) }),
      z.object({ type: z.literal('docker'), docker: docker(t) }),
    ]),
    builder: builder(),
    dockerDeployment: dockerDeployment(),
    environmentVariables: z
      .array(environmentVariable())
      .transform((variables) => variables.filter((variable) => variable.name !== '')),
    regions: regions(),
    instance: instance(),
    scaling: scaling(t),
    ports: z.array(ports(t)),
    volumes: z.array(volumes(t)),
  });
}

function number(t: TranslateErrorFunction, label: string, min: number, max: number) {
  return z
    .number({ invalid_type_error: t('min', { label, min }) })
    .min(min, t('min', { label, min }))
    .max(max, t('max', { label, max }));
}

function git(t: TranslateErrorFunction) {
  return z.discriminatedUnion('repositoryType', [
    z.object({
      repositoryType: z.literal('organization'),
      organizationRepository: z.object({
        repositoryName: z.string({
          invalid_type_error: t('source.git.organizationRepository.repositoryName'),
        }),
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
          .min(1, t('source.git.publicRepository.url'))
          .refine((value) => value.match(/.+\/.+/), t('source.git.publicRepository.url')),
        branch: z.string().nullable(),
      }),
      workDirectory: z.string().nullable(),
    }),
  ]);
}

function docker(t: TranslateErrorFunction) {
  return z.object({
    image: z.string().trim().min(1, t('source.docker.image')),
    registrySecret: z.string().nullable(),
  });
}

function builder() {
  return z.discriminatedUnion('type', [
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
}

function dockerDeployment() {
  return z.object({
    entrypoint: z.array(z.string()).nullable(),
    command: z.string().nullable(),
    args: z.array(z.string()).nullable(),
    privileged: z.boolean(),
  });
}

function environmentVariable() {
  return z.object({
    name: z.string().trim(),
    value: z.string(),
  });
}

function regions() {
  return z.array(z.string()).min(1, 'noRegionSelected');
}

function instance() {
  return z.object({
    identifier: z
      .string()
      .nullable()
      .refine((identifier) => identifier !== null, 'noInstanceSelected'),
  });
}

function scaling(t: TranslateErrorFunction) {
  return z.discriminatedUnion('type', [
    z.object({
      type: z.literal('fixed'),
      fixed: number(t, t('scaling.fixedLabel'), 0, 10),
    }),
    z.object({
      type: z.literal('autoscaling'),
      autoscaling: autoScaling(t),
    }),
  ]);
}

function autoScaling(t: TranslateErrorFunction) {
  return z
    .object({
      min: number(t, t('scaling.autoScalingMinLabel'), 0, 10),
      max: number(t, t('scaling.autoScalingMaxLabel'), 0, 10),
      targets: z.object({
        cpu: autoScalingTarget(t, 1, 100),
        memory: autoScalingTarget(t, 1, 100),
        requests: autoScalingTarget(t, 1, 1e9),
        concurrentRequests: autoScalingTarget(t, 1, 1e9),
        responseTime: autoScalingTarget(t, 1, 1e9),
        sleepIdleDelay: autoScalingTarget(t, 1, 1e9),
      }),
    })
    .refine(({ max, targets }) => {
      if (max === 1) {
        return true;
      }

      const enabledTargets = Object.values(targets).filter((target) => target.enabled);
      return enabledTargets.length > 0;
    }, 'noTargetSelected');
}

function autoScalingTarget(t: TranslateErrorFunction, min: number, max: number) {
  return z.discriminatedUnion('enabled', [
    z.object({
      enabled: z.literal(true),
      value: z
        .number({ invalid_type_error: t('scaling.targetEmpty') })
        .min(min, t('scaling.targetTooSmall', { min: min - 1 }))
        .max(max, t('scaling.targetTooBig', { max })),
    }),
    z.object({
      enabled: z.literal(false),
      value: z.number(),
    }),
  ]);
}

function ports(t: TranslateErrorFunction) {
  const protocol = z.string();
  const portNumber = z
    .number({ invalid_type_error: t('port.portNumber.min') })
    .min(1, t('port.portNumber.min'))
    .max(64999, t('port.portNumber.max'));

  return z.discriminatedUnion('public', [
    z.object({
      public: z.literal(true),
      portNumber,
      protocol,
      path: z
        .string()
        .startsWith('/', t('port.path.startWithSlash'))
        .refine((value) => !value.includes(' '), t('port.path.noWhiteSpaces')),
      healthCheck: healthCheckSchema(t),
    }),
    z.object({
      public: z.literal(false),
      portNumber,
      protocol,
      healthCheck: healthCheckSchema(t),
    }),
  ]);
}

function healthCheckSchema(t: TranslateErrorFunction) {
  const common = z.object({
    gracePeriod: number(t, t('healthCheck.gracePeriod'), 5, 5 * 60),
    interval: number(t, t('healthCheck.interval'), 30, 5 * 60),
    restartLimit: number(t, t('healthCheck.restartLimit'), 1, 10),
    timeout: number(t, t('healthCheck.timeout'), 1, 10 * 60),
  });

  return z.discriminatedUnion('protocol', [
    common.extend({ protocol: z.literal('tcp') }),
    common.extend({
      protocol: z.literal('http'),
      method: z.string(),
      path: z.string().startsWith('/', t('healthCheck.path.startWithSlash')),
      headers: z.array(
        z.object({
          name: z.string().min(1, t('healthCheck.headerName')),
          value: z.string().min(1, t('healthCheck.headerValue')),
        }),
      ),
    }),
  ]);
}

function volumes(t: TranslateErrorFunction) {
  return z.object({
    volumeId: z.string().optional(),
    name: z.string(),
    size: z.number(),
    mountPath: z.string().startsWith('/', t('volumes.mountPath.startWithSlash')),
  });
}
