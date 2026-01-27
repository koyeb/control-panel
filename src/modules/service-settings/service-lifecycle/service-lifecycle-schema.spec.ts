import { beforeEach, describe, expect, test } from 'vitest';

import { OrganizationQuotas, Service } from 'src/model';
import { create } from 'src/utils/factories';

import { ServiceLifecycleFormType, TimeUnit } from './service-lifecycle-form';
import { serviceLifecycleSchema } from './service-lifecycle-schema';

describe('serviceLifecycleSchema', () => {
  let now: Date;
  let service: Service;
  let quotas: OrganizationQuotas;
  let schema: ReturnType<typeof serviceLifecycleSchema>;

  beforeEach(() => {
    now = new Date(500 * 1000);

    service = create.service({
      createdAt: new Date(100 * 1000).toISOString(),
    });

    quotas = create.quotas({
      lifeCycle: {
        deleteAfterCreateMin: 60,
        deleteAfterCreateMax: 86400,
        deleteAfterSleepMin: 60,
        deleteAfterSleepMax: 43200,
      },
    });

    schema = serviceLifecycleSchema(now, service, quotas);
  });

  const expectSuccess = (value: ServiceLifecycleFormType) => {
    const { success } = schema.safeParse(value);

    expect(success).toBe(true);
  };

  const expectError = (value: ServiceLifecycleFormType, message: string) => {
    const { success, error } = schema.safeParse(value);

    expect(success).toBe(false);
    expect(error?.message).toMatch(message);
  };

  describe('deleteAfterCreate', () => {
    const value = (value: number, unit: TimeUnit): ServiceLifecycleFormType => ({
      deleteAfterCreate: { enabled: true, value, unit },
      deleteAfterSleep: { enabled: false, value: NaN, unit: 'seconds' },
    });

    describe('seconds', () => {
      test('too small', () => {
        expectError(value(-341, 'seconds'), 'Too small: expected number to be >-340');
      });

      test('smallest', () => {
        expectSuccess(value(-340, 'seconds'));
      });

      test('biggest', () => {
        expectSuccess(value(86000, 'seconds'));
      });

      test('too big', () => {
        expectError(value(86001, 'seconds'), 'Too big: expected number to be <86000');
      });
    });

    describe('minutes', () => {
      test('too small', () => {
        expectError(value(-6, 'minutes'), 'Too small: expected number to be >-5');
      });

      test('smallest', () => {
        expectSuccess(value(-5, 'minutes'));
      });

      test('biggest', () => {
        expectSuccess(value(1433, 'minutes'));
      });

      test('too big', () => {
        expectError(value(1434, 'minutes'), 'Too big: expected number to be <1433');
      });
    });
  });

  describe('deleteAfterSleep', () => {
    const value = (value: number, unit: TimeUnit): ServiceLifecycleFormType => ({
      deleteAfterCreate: { enabled: false, value: NaN, unit: 'seconds' },
      deleteAfterSleep: { enabled: true, value, unit },
    });

    describe('seconds', () => {
      test('too small', () => {
        expectError(value(59, 'seconds'), 'Too small: expected number to be >60');
      });

      test('smallest', () => {
        expectSuccess(value(60, 'seconds'));
      });

      test('biggest', () => {
        expectSuccess(value(43200, 'seconds'));
      });

      test('too big', () => {
        expectError(value(43201, 'seconds'), 'Too big: expected number to be <43200');
      });
    });

    describe('minutes', () => {
      test('too small', () => {
        expectError(value(0, 'minutes'), 'Too small: expected number to be >1');
      });

      test('smallest', () => {
        expectSuccess(value(1, 'minutes'));
      });

      test('biggest', () => {
        expectSuccess(value(720, 'minutes'));
      });

      test('too big', () => {
        expectError(value(721, 'minutes'), 'Too big: expected number to be <720');
      });
    });
  });
});
