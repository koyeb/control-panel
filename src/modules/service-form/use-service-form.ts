import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { FieldPath, UseFormReturn, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { useDatacenters, useInstance, useInstances, useRegions } from 'src/api/hooks/catalog';
import { useGithubApp } from 'src/api/hooks/git';
import { useOrganization } from 'src/api/hooks/session';
import { createValidationGuard } from 'src/application/create-validation-guard';
import { isTenstorrentGpu } from 'src/application/tenstorrent';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { usePrevious } from 'src/hooks/lifecycle';
import { useSearchParams } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { TranslateFn, TranslateValues, TranslationKeys, useTranslate } from 'src/intl/translate';
import { hasProperty, trackChanges } from 'src/utils/object';
import { Trim } from 'src/utils/types';

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
    resolver: useZodResolver(serviceFormSchema, errorMessageHandler(translate)),
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

function errorMessageHandler(translate: TranslateFn) {
  const t = (key: Trim<TranslationKeys, `modules.serviceForm.errors.`>, values?: TranslateValues) => {
    return translate(`modules.serviceForm.errors.${key}`, values);
  };

  return (error: z.ZodIssueOptionalMessage) => {
    const path = error.path.join('.') as FieldPath<ServiceForm>;

    if (isStartsWithSlash(error)) {
      return t('startWithSlash');
    }

    if (path === 'source.git.organizationRepository.repositoryName' && error.code === 'invalid_type') {
      return t('noRepositorySelected');
    }

    if (path === 'source.git.publicRepository.url' && error.code === 'custom') {
      return t('invalidGithubRepositoryUrl');
    }

    if (path === 'source.docker.image' && error.code === 'too_small') {
      return t('noDockerImageSelected');
    }

    if (path.match(/^scaling.targets.\w+.value$/)) {
      if (error.code === 'invalid_type') return t('scalingTargetEmpty');
      if (error.code === 'too_small') return t('scalingTargetTooSmall', { min: error.minimum });
      if (error.code === 'too_big') return t('scalingTargetTooBig', { max: error.maximum });
    }

    if (path.match(/^ports.\d+.portNumber$/)) {
      if (error.code === 'invalid_type') return t('portNumberTooSmall');
      if (error.code === 'too_small') return t('portNumberTooSmall');
      if (error.code === 'too_big') return t('portNumberTooBig', { max: error.maximum });
    }

    if (path.match(/^ports.\d+.path$/) && error.code === 'custom' && error.params?.noWhiteSpace) {
      return t('portPathHasWhiteSpaces');
    }
  };
}

const isStartsWithSlash = createValidationGuard(
  z.object({
    code: z.literal('invalid_string'),
    validation: z.object({ startsWith: z.literal('/') }),
  }),
);

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

      const { meta, serviceType, scaling, ports } = values;
      const instance = instances.find(hasProperty('id', values.instance));

      if (scaleToZero && instance?.id === 'free') {
        scaling.min = 0;
        scaling.max = 1;
      }

      if (instance?.category === 'eco' && instance.id !== 'free') {
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

      if (scaling.min === 0 && instance?.id !== 'free' && !ports.some((port) => port.public)) {
        scaling.min = 1;
      }

      if (scaling.min === 0 && isTenstorrentGpu(instance)) {
        scaling.min = 1;
      }

      if (isTenstorrentGpu(previousInstance) && !isTenstorrentGpu(instance)) {
        scaling.min = 0;
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
  }, [scaleToZero, instances, previousInstance, watch, setValue, trigger]);
}
