import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { FieldPath, Resolver, UseFormReturn, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { useDatacenters, useInstances, useRegions } from 'src/api/hooks/catalog';
import { useGithubApp } from 'src/api/hooks/git';
import { useOrganization } from 'src/api/hooks/session';
import { useApi } from 'src/api/use-api';
import { createValidationGuard } from 'src/application/create-validation-guard';
import { useSearchParams } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { TranslateFn, TranslateValues, TranslationKeys, useTranslate } from 'src/intl/translate';
import { Trim } from 'src/utils/types';

import { initializeServiceForm } from './helpers/initialize-service-form';
import { getServiceFormSections, sectionHasError } from './helpers/service-form-sections';
import { serviceFormSchema } from './helpers/service-form.schema';
import { useUnknownInterpolationErrors } from './helpers/unknown-interpolations';
import { ServiceForm, ServiceFormSection } from './service-form.types';

export function useServiceForm(serviceId?: string) {
  const api = useApi();
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
        api,
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
    resolver: useServiceFormResolver(),
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

function useServiceFormResolver() {
  const translate = useTranslate();
  const getUnknownInterpolationErrors = useUnknownInterpolationErrors();
  const schemaResolver = useZodResolver(serviceFormSchema, errorMessageHandler(translate));

  return useCallback<Resolver<ServiceForm>>(
    async (values, context, options) => {
      const errors = await getUnknownInterpolationErrors(values);

      if (Object.keys(errors).length > 0) {
        return { values: {}, errors };
      }

      return schemaResolver(values, context, options);
    },
    [schemaResolver, getUnknownInterpolationErrors],
  );
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

    if (path.match(/^scaling.(scaleToZero|targets).\w+.value$/)) {
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
