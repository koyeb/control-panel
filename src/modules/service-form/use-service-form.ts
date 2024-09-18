import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { FieldPath, UseFormReturn, useForm, useWatch } from 'react-hook-form';

import { useInstances, useRegions } from 'src/api/hooks/catalog';
import { useGithubApp } from 'src/api/hooks/git';
import { useOrganization } from 'src/api/hooks/session';
import { useSearchParams } from 'src/hooks/router';
import { useTranslate } from 'src/intl/translate';

import { getServiceFormSections, sectionHasError } from './helpers/service-form-sections';
import { serviceFormSchema } from './helpers/service-form.schema';
import { initializeServiceForm } from './initialize-service-form';
import { ServiceForm, ServiceFormSection } from './service-form.types';

export function useServiceForm(appId?: string, serviceId?: string) {
  const translate = useTranslate();

  const params = useSearchParams();
  const regions = useRegions();
  const instances = useInstances();
  const organization = useOrganization();
  const githubApp = useGithubApp();
  const queryClient = useQueryClient();

  const form = useForm<ServiceForm>({
    mode: 'onChange',
    defaultValues: () => {
      return initializeServiceForm(
        params,
        regions,
        instances,
        organization,
        githubApp,
        appId,
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

      if (name === 'instance.category' && submitCount >= 1) {
        void trigger('instance.identifier');
      }

      if (name === 'scaling.type') {
        void trigger('scaling.autoscaling');
        void trigger('scaling.autoscaling.targets');
        void trigger('scaling.autoscaling.targets.requests.value');
        void trigger('scaling.autoscaling.targets.cpu.value');
        void trigger('scaling.autoscaling.targets.memory.value');
        void trigger('scaling.autoscaling.targets.concurrentRequests.value');
        void trigger('scaling.autoscaling.targets.responseTime.value');
      }

      if (name.match(/scaling.autoscaling.targets.[a-z]+.enabled/i)) {
        void trigger('scaling.autoscaling');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [watch, trigger, submitCount]);
}
