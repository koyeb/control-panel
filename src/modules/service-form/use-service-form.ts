import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { FieldPath, UseFormReturn, useForm, useWatch } from 'react-hook-form';

import { useDatacenters, useInstance, useInstances, useRegions } from 'src/api/hooks/catalog';
import { useGithubApp } from 'src/api/hooks/git';
import { useOrganization } from 'src/api/hooks/session';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { usePrevious } from 'src/hooks/lifecycle';
import { useSearchParams } from 'src/hooks/router';
import { useTranslate } from 'src/intl/translate';
import { hasProperty, trackChanges } from 'src/utils/object';

import { initializeServiceForm } from './helpers/initialize-service-form';
import { getServiceFormSections, sectionHasError } from './helpers/service-form-sections';
import { serviceFormSchema } from './helpers/service-form.schema';
import { Scaling, ServiceForm, ServiceFormSection } from './service-form.types';

export function useServiceForm(serviceId?: string) {
  const translate = useTranslate();

  const params = useSearchParams();
  const datacenters = useDatacenters();
  const regions = useRegions();
  const instances = useInstances();
  const organization = useOrganization();
  const githubApp = useGithubApp();
  const queryClient = useQueryClient();

  const form = useForm<ServiceForm>({
    mode: 'onChange',
    defaultValues() {
      return initializeServiceForm(
        params,
        datacenters,
        regions,
        instances,
        organization,
        githubApp,
        serviceId,
        queryClient,
      );
    },
    resolver: zodResolver(serviceFormSchema(translate)),
  });

  const sections = !form.formState.isLoading ? getServiceFormSections(form.watch()) : [];

  useTriggerInstanceValidationOnLoad(form);
  useExpandFirstSectionInError(form, sections);
  useTriggerValidationOnChange(form);
  useEnsureScalingBusinessRules(form);

  return form;
}

export function useWatchServiceForm<Path extends FieldPath<ServiceForm>>(name: Path) {
  return useWatch<ServiceForm, Path>({ name });
}

function useTriggerInstanceValidationOnLoad(form: UseFormReturn<ServiceForm>) {
  const { trigger, formState } = form;
  const { isLoading } = formState;

  useEffect(() => {
    if (!isLoading) {
      void trigger('instance');
    }
  }, [trigger, isLoading]);
}

function useExpandFirstSectionInError(form: UseFormReturn<ServiceForm>, sections: ServiceFormSection[]) {
  useEffect(() => {
    const errors = form.formState.errors;
    const expandedSection = form.getValues('meta.expandedSection');
    const sectionsInError = sections.filter((section) => sectionHasError(section, errors));
    const firstSectionInError = sectionsInError[0];

    if (firstSectionInError === undefined) {
      return;
    }

    if (!sectionsInError.includes(expandedSection as ServiceFormSection)) {
      form.setValue('meta.expandedSection', firstSectionInError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.formState.submitCount]);
}

function useTriggerValidationOnChange({ watch, trigger, formState }: UseFormReturn<ServiceForm>) {
  const { submitCount } = formState;

  useEffect(() => {
    const subscription = watch((values, { type, name }) => {
      if (type !== 'change' || name === undefined) {
        return;
      }

      if (name === 'source.type' && submitCount >= 1) {
        void trigger('source');
      }

      if (name === 'source.git.repositoryType' && submitCount >= 1) {
        void trigger('source.git');
      }

      if (name.match(/scaling.targets.[a-z]+.enabled/i)) {
        void trigger('scaling');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [watch, trigger, submitCount]);
}

const scaleAboveZeroTargets: Array<keyof Scaling['targets']> = [
  'cpu',
  'memory',
  'requests',
  'concurrentRequests',
  'responseTime',
];

function useEnsureScalingBusinessRules({ watch, setValue, trigger }: UseFormReturn<ServiceForm>) {
  const scaleToZero = useFeatureFlag('scale-to-zero');
  const scaleToZeroIdleDelay = useFeatureFlag('scale-to-zero-idle-delay');
  const instances = useInstances();
  const previousInstance = usePrevious(useInstance(watch('instance')));

  useEffect(() => {
    const subscription = watch((formValues, { type, name }) => {
      if (type !== 'change' || name === undefined) {
        return;
      }

      let triggerScalingValidation = false;

      const values = trackChanges(formValues as ServiceForm, (key, value) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue(key as any, value as any, { shouldValidate: true });

        if (key.startsWith('scaling')) {
          triggerScalingValidation = true;
        }
      });

      const { meta, serviceType, scaling } = values;
      const instance = instances.find(hasProperty('identifier', values.instance));

      if (scaleToZero && instance?.identifier === 'free') {
        scaling.min = 0;
        scaling.max = 1;
      }

      if (instance?.category === 'eco' && instance.identifier !== 'free') {
        scaling.min = scaling.max;
      }

      if (name === 'instance' && meta.serviceId === null) {
        if (previousInstance?.category !== 'gpu' && instance?.category === 'gpu') {
          scaling.min = 0;
        } else if (previousInstance?.category === 'gpu' && instance?.category === 'standard') {
          scaling.min = 1;
        }
      }

      if (scaling.min === 0 && !scaleToZero) {
        scaling.min = 1;
      }

      if (scaling.min === 0 && serviceType !== 'web') {
        scaling.min = 1;
      }

      if (scaling.min > scaling.max) {
        if (name === 'scaling.min') {
          scaling.max = scaling.min;
        }

        if (name === 'scaling.max') {
          scaling.min = scaling.max;
        }
      }

      scaling.targets.sleepIdleDelay.enabled = scaling.min === 0;

      if (scaling.min === scaling.max || scaling.max === 1) {
        scaleAboveZeroTargets.forEach((target) => {
          scaling.targets[target].enabled = false;
        });
      } else if (!name.startsWith('scaling.targets')) {
        const hasEnabledTarget = scaleAboveZeroTargets.some((target) => scaling.targets[target].enabled);

        if (!hasEnabledTarget) {
          const target: keyof Scaling['targets'] = serviceType === 'worker' ? 'cpu' : 'requests';

          scaling.targets[target].enabled = true;
        }
      }

      if (triggerScalingValidation) {
        void trigger('scaling');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [scaleToZero, scaleToZeroIdleDelay, instances, previousInstance, watch, setValue, trigger]);
}
