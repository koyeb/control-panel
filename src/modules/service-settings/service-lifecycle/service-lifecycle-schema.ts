import { differenceInSeconds } from 'date-fns';
import z from 'zod';

import { OrganizationQuotas, Service } from 'src/model';

import { TimeUnit } from './service-lifecycle-form';

const timeUnit = z.union([z.literal('seconds'), z.literal('minutes'), z.literal('hours'), z.literal('days')]);

export function serviceLifecycleSchema(now: Date, service: Service, { lifeCycle }: OrganizationQuotas) {
  const deleteAfterCreateMin = lifeCycle?.deleteAfterCreateMin ?? 0;
  const deleteAfterCreateMax = lifeCycle?.deleteAfterCreateMax ?? Infinity;
  const deleteAfterSleepMin = lifeCycle?.deleteAfterSleepMin ?? 0;
  const deleteAfterSleepMax = lifeCycle?.deleteAfterSleepMax ?? Infinity;

  return z.object({
    deleteAfterCreate: z.discriminatedUnion('enabled', [
      z.object({
        enabled: z.literal(false),
        value: z.nan(),
        unit: timeUnit,
      }),
      z
        .object({
          enabled: z.literal(true),
          value: z.union([z.nan(), z.number()]),
          unit: timeUnit,
        })
        .superRefine((data, ctx) => {
          const offset = differenceInSeconds(service.createdAt, now);

          const minimum = Math.ceil(getTimeValueFromUnit(deleteAfterCreateMin + offset, data.unit));
          const maximum = Math.floor(getTimeValueFromUnit(deleteAfterCreateMax + offset, data.unit));

          if (data.value < minimum) {
            ctx.addIssue({ code: 'too_small', origin: 'number', minimum, path: ['value'] });
          }

          if (data.value > maximum) {
            ctx.addIssue({ code: 'too_big', origin: 'number', maximum, path: ['value'] });
          }
        }),
    ]),
    deleteAfterSleep: z.discriminatedUnion('enabled', [
      z.object({
        enabled: z.literal(false),
        value: z.nan(),
        unit: timeUnit,
      }),
      z
        .object({
          enabled: z.literal(true),
          value: z.union([z.nan(), z.number()]),
          unit: timeUnit,
        })
        .superRefine((data, ctx) => {
          const minimum = Math.ceil(getTimeValueFromUnit(deleteAfterSleepMin, data.unit));
          const maximum = Math.floor(getTimeValueFromUnit(deleteAfterSleepMax, data.unit));

          if (data.value < minimum) {
            ctx.addIssue({ code: 'too_small', origin: 'number', minimum, path: ['value'] });
          }

          if (data.value > maximum) {
            ctx.addIssue({ code: 'too_big', origin: 'number', maximum, path: ['value'] });
          }
        }),
    ]),
  });
}

function getTimeValueFromUnit(seconds: number, unit: TimeUnit): number {
  const factor = {
    seconds: 1,
    minutes: 60,
    hours: 60 * 60,
    days: 60 * 60 * 24,
  }[unit];

  return seconds / factor;
}
