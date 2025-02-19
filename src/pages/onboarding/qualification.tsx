import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { FormProvider, useController, useForm, useFormContext, useWatch } from 'react-hook-form';

import { Button } from '@koyeb/design-system';
import { api } from 'src/api/api';
import { useOrganization, useUser } from 'src/api/hooks/session';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { useTrackEvent } from 'src/application/posthog';
import { useToken } from 'src/application/token';
import { ControlledInput, ControlledSelect } from 'src/components/controlled';
import { Dialog } from 'src/components/dialog';
import { IconArrowRight } from 'src/components/icons';
import { handleSubmit } from 'src/hooks/form';
import { createTranslate, Translate } from 'src/intl/translate';
import { identity } from 'src/utils/generic';

import { OnboardingStepper } from './stepper';

const T = createTranslate('pages.onboarding.qualification');

export function Qualification() {
  const user = useUser();

  return (
    <section className="col w-full max-w-xl gap-6">
      <OnboardingStepper step={3} />

      <div>
        <h1 className="typo-heading mb-1">
          <T id="title" />
        </h1>
        <p className="text-dim">
          <T id="line1" values={{ email: user.email }} />
        </p>
      </div>

      <QualificationForm />
    </section>
  );
}

type QualificationFormType = {
  version: number;
  fullName?: string;
  usage?: 'personal' | 'education' | 'professional';
  companyName?: string;
  occupation?: string;
  currentSpending?: string;
  primaryUseCase?: string;
  primaryLanguage?: string;
  referralSource?: string;
};

function QualificationForm() {
  const organization = useOrganization();
  const { token } = useToken();
  const invalidate = useInvalidateApiQuery();
  const track = useTrackEvent();
  const openDialog = Dialog.useOpen();

  const form = useForm<QualificationFormType>({
    defaultValues: {
      version: 2,
      fullName: '',
      companyName: '',
      occupation: '',
      currentSpending: '',
      primaryUseCase: '',
      primaryLanguage: '',
      referralSource: '',
    },
  });

  const mutation = useMutation({
    async mutationFn({ fullName, ...rest }: QualificationFormType) {
      if (fullName !== '') {
        await api.updateUser({
          token,
          body: { name: fullName },
          query: {},
        });
      }

      const values: Record<string, unknown> = {
        ...rest,
        submittedAt: new Date().toISOString(),
      };

      for (const key in values) {
        if (values[key] === '') {
          delete values[key];
        }
      }

      await api.updateSignupQualification({
        token,
        path: { id: organization.id },
        body: { signup_qualification: values as Record<string, never> },
      });
    },
    async onSuccess(_, values) {
      await invalidate('getCurrentUser');
      await invalidate('getCurrentOrganization');
      track('Form Submitted', { category: 'User Qualification', action: 'Clicked', ...values });

      if (organization.trialing) {
        openDialog('TrialWelcome');
      }
    },
  });

  return (
    <FormProvider {...form}>
      <form className="col gap-6" onSubmit={handleSubmit(form, mutation.mutateAsync)}>
        <FullNameField />
        <UsageField />
        <CompanyNameField />
        <OccupationField />
        <CurrentSpendingField />
        <PrimaryUseCaseField />
        <PrimaryLanguageField />
        <ReferralSourceField />
        <Button
          type="submit"
          disabled={!form.formState.isValid}
          loading={form.formState.isSubmitting}
          className="self-end"
        >
          <Translate id="common.next" />
          <IconArrowRight />
        </Button>
      </form>
    </FormProvider>
  );
}

function FullNameField() {
  const user = useUser();

  if (user.githubUser === '') {
    return null;
  }

  return <ControlledInput required name="fullName" label={<T id="fullName.label" />} />;
}

function UsageField() {
  const t = T.useTranslate();
  const { resetField } = useFormContext<QualificationFormType>();

  const options = {
    personal: t('usage.personal'),
    education: t('usage.education'),
    professional: t('usage.professional'),
  };

  const { field, fieldState } = useController<QualificationFormType, 'usage'>({
    name: 'usage',
    rules: { required: true },
  });

  const handleChange = (option: string) => {
    field.onChange(option);
    resetField('companyName');
    resetField('occupation');
    resetField('primaryUseCase');
  };

  return (
    <div className="col gap-2">
      <div>
        <T id="usage.label" />
      </div>

      <div role="radiogroup" className="row gap-2">
        {Object.entries(options).map(([option, label]) => (
          <div
            key={option}
            role="radio"
            className={clsx(
              'cursor-pointer rounded-md border px-3 py-2',
              field.value === option && 'border-green',
            )}
            onClick={() => handleChange(option)}
          >
            {label}
          </div>
        ))}
      </div>

      {fieldState.error?.type === 'required' && (
        <div className="text-xs text-red">
          <T id="usage.required" />
        </div>
      )}
    </div>
  );
}

function CompanyNameField() {
  const usage = useWatch<QualificationFormType, 'usage'>({ name: 'usage' });

  if (usage !== 'professional') {
    return null;
  }

  return <ControlledInput required name="companyName" label={<T id="companyName.label" />} />;
}

function OccupationField() {
  const t = T.useTranslate();

  const usage = useWatch<QualificationFormType, 'usage'>({ name: 'usage' });

  const options = {
    personal: [
      t('occupation.founder'),
      t('occupation.cto'),
      t('occupation.devops'),
      t('occupation.software'),
      t('occupation.engineering'),
      t('occupation.freelancer'),
      t('occupation.hobbyist'),
      t('occupation.other'),
    ],
    education: [
      //
      t('occupation.student'),
      t('occupation.teacher'),
      t('occupation.other'),
    ],
    professional: [
      t('occupation.founder'),
      t('occupation.cto'),
      t('occupation.devops'),
      t('occupation.software'),
      t('occupation.engineering'),
      t('occupation.freelancer'),
      t('occupation.other'),
    ],
  };

  return (
    <ControlledSelect
      name="occupation"
      label={<T id="occupation.label" />}
      items={usage ? options[usage] : []}
      getKey={identity}
      itemToString={identity}
      itemToValue={identity}
      renderItem={identity}
    />
  );
}

function CurrentSpendingField() {
  const t = T.useTranslate();

  const usage = useWatch<QualificationFormType, 'usage'>({ name: 'usage' });

  if (usage !== 'professional') {
    return null;
  }

  const options = [
    t('currentSpending.lessThan500'),
    t('currentSpending.500To2000'),
    t('currentSpending.2000To10000'),
    t('currentSpending.moreThan10000'),
  ];

  return (
    <ControlledSelect
      name="currentSpending"
      label={<T id="currentSpending.label" />}
      items={options}
      getKey={identity}
      itemToString={identity}
      itemToValue={identity}
      renderItem={identity}
    />
  );
}

function PrimaryUseCaseField() {
  const t = T.useTranslate();

  const usage = useWatch<QualificationFormType, 'usage'>({ name: 'usage' });

  const nonProfessionalUsageOptions = [
    t('primaryUseCase.ai'),
    t('primaryUseCase.training'),
    t('primaryUseCase.inference'),
    t('primaryUseCase.video'),
    t('primaryUseCase.web'),
    t('primaryUseCase.api'),
    t('primaryUseCase.blog'),
    t('primaryUseCase.personal'),
    t('primaryUseCase.school'),
    t('primaryUseCase.bot'),
    t('primaryUseCase.other'),
  ];

  const professionalUsageOptions = [
    t('primaryUseCase.ai'),
    t('primaryUseCase.training'),
    t('primaryUseCase.inference'),
    t('primaryUseCase.video'),
    t('primaryUseCase.web'),
    t('primaryUseCase.api'),
    t('primaryUseCase.company'),
    t('primaryUseCase.blog'),
    t('primaryUseCase.other'),
  ];

  return (
    <ControlledSelect
      name="primaryUseCase"
      label={<T id="primaryUseCase.label" />}
      items={usage === 'professional' ? professionalUsageOptions : nonProfessionalUsageOptions}
      getKey={identity}
      itemToString={identity}
      itemToValue={identity}
      renderItem={identity}
    />
  );
}

function PrimaryLanguageField() {
  const t = T.useTranslate();

  const options = [
    t('primaryLanguage.ruby'),
    t('primaryLanguage.php'),
    t('primaryLanguage.python'),
    t('primaryLanguage.golang'),
    t('primaryLanguage.node'),
    t('primaryLanguage.java'),
    t('primaryLanguage.rust'),
    t('primaryLanguage.elixir'),
    t('primaryLanguage.scala'),
    t('primaryLanguage.clojure'),
    t('primaryLanguage.docker'),
    t('primaryLanguage.other'),
    t('primaryLanguage.notDeveloper'),
  ];

  return (
    <ControlledSelect
      name="primaryLanguage"
      label={<T id="primaryLanguage.label" />}
      items={options}
      getKey={identity}
      itemToString={identity}
      itemToValue={identity}
      renderItem={identity}
    />
  );
}

function ReferralSourceField() {
  const t = T.useTranslate();

  const options = [
    t('referralSource.searchEngine'),
    t('referralSource.recommendation'),
    t('referralSource.socialMedia'),
    t('referralSource.hackerNews'),
    t('referralSource.reddit'),
    t('referralSource.podcast'),
    t('referralSource.meetup'),
    t('referralSource.other'),
  ];

  return (
    <ControlledSelect
      name="referralSource"
      label={<T id="referralSource.label" />}
      items={options}
      getKey={identity}
      itemToString={identity}
      itemToValue={identity}
      renderItem={identity}
    />
  );
}
