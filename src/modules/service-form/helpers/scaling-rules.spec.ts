import { renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { FormProvider, UseFormReturn, useForm } from 'react-hook-form';
import { beforeEach, describe, expect, it } from 'vitest';

import { create } from 'src/utils/factories';

import { ServiceForm } from '../service-form.types';

import { defaultServiceForm } from './initialize-service-form';
import { useScalingRules } from './scaling-rules';

describe('useScalingRules', () => {
  const free = create.instance({ id: 'free', category: 'eco' });
  const eco = create.instance({ category: 'eco' });
  const standard = create.instance({ category: 'standard' });
  const gpu = create.instance({ category: 'gpu' });
  const tenstorrentGpu = create.instance({ id: 'gpu-tenstorrent-n300s', category: 'gpu' });

  let form: UseFormReturn<ServiceForm>;
  let hook: ReturnType<typeof useScalingRules>;

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    form = useForm({
      defaultValues: defaultServiceForm(),
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return createElement(FormProvider, form, children);
  };

  beforeEach(() => {
    const { result } = renderHook(() => useScalingRules(), { wrapper });

    hook = result.current;
  });

  describe('onScalingChanged', () => {
    it('disables light sleep when min > 0', () => {
      form.setValue('scaling.min', 0);
      form.setValue('scaling.scaleToZero.idlePeriod', 60);
      form.setValue('scaling.scaleToZero.lightSleepEnabled', true);

      hook.onScalingChanged(1, 1);

      expect(form.getValues()).toHaveProperty('scaling.scaleToZero.lightSleepEnabled', false);
      expect(form.getValues()).toHaveProperty('scaling.scaleToZero.idlePeriod', 3900);
    });

    it('enables the requests autoscaling target for web services', () => {
      hook.onScalingChanged(0, 2);

      expect(form.getValues()).toHaveProperty('scaling.targets.requests.enabled', true);
      expect(form.getValues()).toHaveProperty('scaling.targets.cpu.enabled', false);
    });

    it('enables the cpu autoscaling target for workers', () => {
      form.setValue('serviceType', 'worker');

      hook.onScalingChanged(0, 2);

      expect(form.getValues()).toHaveProperty('scaling.targets.requests.enabled', false);
      expect(form.getValues()).toHaveProperty('scaling.targets.cpu.enabled', true);
    });

    it('disables all autoscaling targets when max is set to 1', () => {
      form.setValue('scaling.targets.requests.enabled', true);
      form.setValue('scaling.targets.cpu.enabled', true);

      hook.onScalingChanged(0, 1);

      expect(form.getValues()).toHaveProperty('scaling.targets.requests.enabled', false);
      expect(form.getValues()).toHaveProperty('scaling.targets.cpu.enabled', false);
    });

    it('disables all autoscaling targets when min and max are equal', () => {
      form.setValue('scaling.targets.requests.enabled', true);
      form.setValue('scaling.targets.cpu.enabled', true);

      hook.onScalingChanged(2, 2);

      expect(form.getValues()).toHaveProperty('scaling.targets.requests.enabled', false);
      expect(form.getValues()).toHaveProperty('scaling.targets.cpu.enabled', false);
    });
  });

  describe('onScalingTargetToggled', () => {
    it("resets the target's value when disabled", () => {
      form.setValue('scaling.targets.cpu', { enabled: true, value: 200 });

      hook.onScalingTargetChanged('cpu', false);

      expect(form.getValues('scaling.targets.cpu.value')).toBe(80);
    });
  });

  describe('onInstanceChanged', () => {
    it('sets min = 0 and max = 1 when the free instance is selected', () => {
      form.setValue('scaling.min', 1);
      form.setValue('scaling.max', 2);
      form.setValue('scaling.targets.requests.enabled', true);

      hook.onInstanceChanged(standard, free);

      expect(form.getValues()).toHaveProperty('scaling.min', 0);
      expect(form.getValues()).toHaveProperty('scaling.max', 1);
      expect(form.getValues()).toHaveProperty('scaling.targets.requests.enabled', false);
    });

    it('sets min = max when the a non free eco instance is selected', () => {
      form.setValue('scaling.min', 1);
      form.setValue('scaling.max', 2);
      form.setValue('scaling.targets.requests.enabled', true);

      hook.onInstanceChanged(standard, eco);

      expect(form.getValues()).toHaveProperty('scaling.min', 2);
      expect(form.getValues()).toHaveProperty('scaling.max', 2);
      expect(form.getValues()).toHaveProperty('scaling.targets.requests.enabled', false);
    });

    it('enables scale to zero when selecting a GPU for a new service', () => {
      form.setValue('scaling.min', 1);
      form.setValue('scaling.max', 2);

      hook.onInstanceChanged(standard, gpu);

      expect(form.getValues()).toHaveProperty('scaling.min', 0);
      expect(form.getValues()).toHaveProperty('scaling.targets.requests.enabled', true);
    });

    it('sets min = 1 when selecting a tenstorrent GPU', () => {
      form.setValue('scaling.min', 0);

      hook.onInstanceChanged(standard, tenstorrentGpu);

      expect(form.getValues()).toHaveProperty('scaling.min', 1);
    });

    it('sets min = 0 when selecting a GPU different from a tenstorrent GPU', () => {
      form.setValue('scaling.min', 1);

      hook.onInstanceChanged(tenstorrentGpu, standard);

      expect(form.getValues()).toHaveProperty('scaling.min', 0);
    });

    it('disables light sleep when a GPU is selected', () => {
      form.setValue('scaling.min', 0);
      form.setValue('scaling.scaleToZero.lightSleepEnabled', true);

      hook.onInstanceChanged(standard, gpu);

      expect(form.getValues()).toHaveProperty('scaling.scaleToZero.lightSleepEnabled', false);
    });
  });

  describe('onServiceTypeChanged', () => {
    it('sets min = 1 when min = 0 and changing the service type to worker', () => {
      form.setValue('scaling.min', 0);
      form.setValue('scaling.scaleToZero.lightSleepEnabled', true);

      hook.onServiceTypeChanged('worker');

      expect(form.getValues()).toHaveProperty('scaling.min', 1);
      expect(form.getValues()).toHaveProperty('scaling.scaleToZero.lightSleepEnabled', false);
    });

    it('does not change min when it is > 0', () => {
      form.setValue('scaling.min', 2);

      hook.onServiceTypeChanged('worker');

      expect(form.getValues()).toHaveProperty('scaling.min', 2);
    });

    it('disable web service autoscaling targets when switching to worker', () => {
      form.setValue('scaling.targets.cpu.enabled', true);
      form.setValue('scaling.targets.memory.enabled', true);
      form.setValue('scaling.targets.requests.enabled', true);
      form.setValue('scaling.targets.concurrentRequests.enabled', true);
      form.setValue('scaling.targets.responseTime.enabled', true);

      hook.onServiceTypeChanged('worker');

      expect(form.getValues()).toHaveProperty('scaling.targets.cpu.enabled', true);
      expect(form.getValues()).toHaveProperty('scaling.targets.memory.enabled', true);
      expect(form.getValues()).toHaveProperty('scaling.targets.requests.enabled', false);
      expect(form.getValues()).toHaveProperty('scaling.targets.concurrentRequests.enabled', false);
      expect(form.getValues()).toHaveProperty('scaling.targets.responseTime.enabled', false);
    });
  });
});
