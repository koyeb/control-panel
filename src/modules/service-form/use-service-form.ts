import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { FieldPath, Resolver, UseFormReturn, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { useOrganization, useOrganizationQuotas } from 'src/api';
import { createValidationGuard } from 'src/application/validation';
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
  const params = useSearchParams();
  const queryClient = useQueryClient();

  const form = useForm<ServiceForm>({
    mode: 'onChange',
    defaultValues: () => initializeServiceForm(params, serviceId, queryClient),
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

  const organization = useOrganization();
  const quotas = useOrganizationQuotas();

  const schemaResolver = useZodResolver(
    serviceFormSchema(organization, quotas),
    errorMessageHandler(translate),
  );

  const getUnknownInterpolationErrors = useUnknownInterpolationErrors();

  return useCallback<Resolver<ServiceForm>>(
    async (values, context, options) => {
      const schemaResult = await schemaResolver(values, context, options);

      if (Object.keys(schemaResult.errors).length > 0) {
        return schemaResult;
      }

      const interpolationResults = await getUnknownInterpolationErrors(values);

      if (Object.keys(interpolationResults).length > 0) {
        return { values: {}, errors: interpolationResults };
      }

      return schemaResult;
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
