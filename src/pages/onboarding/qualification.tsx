import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { FormProvider, useController, useForm, useFormContext, useWatch } from 'react-hook-form';

import { Stepper } from '@koyeb/design-system';
import { api } from 'src/api/api';
import { useOrganization, useUser } from 'src/api/hooks/session';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { useTrackEvent } from 'src/application/posthog';
import { useToken } from 'src/application/token';
import { ControlledInput } from 'src/components/controlled';
import { Dialog } from 'src/components/dialog';
import { createTranslate } from 'src/intl/translate';
import { defined } from 'src/utils/assert';
import { Extend } from 'src/utils/types';

import { AuthButton } from '../authentication/components/auth-button';

const T = createTranslate('pages.onboarding.qualification');

type Step = 'fullName' | 'usage' | 'primaryUseCase' | 'currentSpending';
type Usage = 'personal' | 'education' | 'professional';
// prettier-ignore
type Occupation = 'founder' | 'cto' | 'devops'  | 'softwareEngineer' | 'engineeringManager' | 'freelancer' | 'hobbyist' | 'student' | 'teacher' | 'other';
// prettier-ignore
type PrimaryUseCase = 'ai' | 'training' | 'inference' | 'video' | 'web' | 'api' | 'company' | 'blog' | 'personal' | 'school' | 'bot' | 'other';
type CurrentSpending = 'lessThan500' | '500To2000' | '2000To10000' | 'moreThan10000';

type QualificationFormType = {
  fullName?: string;
  step: Step;
  usage?: Usage;
  occupation?: Occupation;
  primaryUseCase?: PrimaryUseCase;
  currentSpending?: CurrentSpending;
};

export function Qualification() {
  const user = useUser();
  const organization = useOrganization();

  const { token } = useToken();
  const invalidate = useInvalidateApiQuery();

  const track = useTrackEvent();
  const openDialog = Dialog.useOpen();

  const form = useForm<QualificationFormType>({
    defaultValues: {
      step: user.githubUser ? 'fullName' : 'usage',
    },
  });

  const mutation = useMutation({
    async mutationFn(form: QualificationFormType) {
      if (form.fullName !== '') {
        await api.updateUser({
          token,
          body: { name: form.fullName },
          query: {},
        });
      }

      const values: Record<string, unknown> = {
        version: 3,
        usage: form.usage,
        occupation: form.occupation,
        currentSpending: form.currentSpending,
        primaryUseCase: form.primaryUseCase,
        submittedAt: new Date().toISOString(),
      };

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

      if (organization.trial) {
        openDialog('TrialWelcome');
      }
    },
  });

  const steps: Step[] = ['usage', 'primaryUseCase'];
  const step = form.watch('step');

  if (user.githubUser) {
    steps.unshift('fullName');
  }

  if (form.watch('usage') === 'professional') {
    steps.push('currentSpending');
  }

  const handleSubmit = (values: QualificationFormType) => {
    if (step === 'fullName') {
      form.setValue('step', 'usage');
    }

    if (step === 'usage') {
      form.setValue('step', 'primaryUseCase');
    }

    if (step === 'primaryUseCase') {
      if (form.getValues().usage === 'professional') {
        form.setValue('step', 'currentSpending');
      } else {
        mutation.mutate(values);
      }
    }

    if (step === 'currentSpending') {
      mutation.mutate(values);
    }
  };

  return (
    <>
      <section className="row justify-between">
        <Stepper activeStep={steps.indexOf(step) + 1} totalSteps={steps.length + 2} />
        <AuthButton
          onClick={() => handleSubmit(form.getValues())}
          className={clsx('border border-strong bg-neutral !text-default hover:bg-neutral', {
            invisible: step === 'fullName' || step === 'usage',
          })}
        >
          <T id="skip" />
        </AuthButton>
      </section>

      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="col flex-1 items-start justify-center gap-8"
      >
        <FormProvider {...form}>
          <QualificationStep />

          <AuthButton
            type="submit"
            className={clsx({ invisible: step === 'usage' && form.watch('occupation') === undefined })}
          >
            <T id="continue" />
          </AuthButton>
        </FormProvider>
      </form>

      <div className="min-h-8" />
    </>
  );
}

function QualificationStep() {
  const form = useFormContext<QualificationFormType>();
  const step = form.watch('step');

  if (step === 'fullName') {
    return <FullNameStep />;
  }

  if (step === 'usage') {
    return (
      <>
        <UsageStep />
        {form.watch('usage') !== undefined && <OccupationStep />}
      </>
    );
  }

  if (step === 'primaryUseCase') {
    return <PrimaryUseCaseStep />;
  }

  if (step === 'currentSpending') {
    return <CurrentSpendingStep />;
  }

  return null;
}

function FullNameStep() {
  return (
    <section className="col gap-8">
      <header className="col gap-1">
        <h1 className="text-3xl font-semibold">
          <T id="fullName.title" />
        </h1>

        <p className="text-dim">
          <T id="fullName.description" />
        </p>
      </header>

      <ControlledInput name="fullName" />
    </section>
  );
}

function UsageStep() {
  const usages: Usage[] = ['personal', 'education', 'professional'];

  return (
    <section className="col gap-8">
      <header className="col gap-1">
        <h1 className="text-3xl font-semibold">
          <T id="usage.title" />
        </h1>

        <p className="text-dim">
          <T id="usage.description" />
        </p>
      </header>

      <TagList>
        {usages.map((usage) => (
          <Tag key={usage} name="usage" type="radio" value={usage} label={<T id={`usage.${usage}`} />} />
        ))}
      </TagList>
    </section>
  );
}

function OccupationStep() {
  const t = T.useTranslate();
  const usage = useWatch<QualificationFormType, 'usage'>({ name: 'usage' });

  // prettier-ignore
  const options: Record<Usage, Occupation[]> = {
    personal: ['founder', 'cto', 'devops', 'softwareEngineer', 'engineeringManager', 'freelancer', 'hobbyist', 'other'],
    education: ['student', 'teacher', 'other'],
    professional: ['founder', 'cto', 'devops', 'softwareEngineer', 'engineeringManager', 'freelancer', 'other'],
  };

  return (
    <section className="col mt-20 gap-8">
      <header className="col gap-1">
        <h1 className="text-3xl font-semibold">
          <T id="occupation.title" />
        </h1>

        <p className="text-dim">
          <T id="occupation.description" />
        </p>
      </header>

      <TagList>
        {options[defined(usage)].map((occupation) => (
          <Tag
            key={occupation}
            name="occupation"
            type="radio"
            value={t(`occupation.${occupation}`)}
            label={<T id={`occupation.${occupation}`} />}
          />
        ))}
      </TagList>
    </section>
  );
}

function PrimaryUseCaseStep() {
  const t = T.useTranslate();
  const usage = useWatch<QualificationFormType, 'usage'>({ name: 'usage' });

  const options: Array<PrimaryUseCase> = [
    'ai',
    'training',
    'inference',
    'video',
    'web',
    'api',
    'blog',
    'personal',
    'school',
    'bot',
    'other',
  ];

  if (usage === 'professional') {
    delete options[options.indexOf('personal')];
    delete options[options.indexOf('school')];
    options.splice(7, 0, 'company');
  }

  return (
    <section className="col gap-8">
      <header className="col gap-1">
        <h1 className="text-3xl font-semibold">
          <T id="primaryUseCase.title" />
        </h1>

        <p className="text-dim">
          <T id="primaryUseCase.description" />
        </p>
      </header>

      <TagList>
        {options.map((useCase) => (
          <Tag
            key={useCase}
            name="primaryUseCase"
            type="radio"
            value={t(`primaryUseCase.${useCase}`)}
            label={<T id={`primaryUseCase.${useCase}`} />}
          />
        ))}
      </TagList>
    </section>
  );
}

function CurrentSpendingStep() {
  const t = T.useTranslate();
  const options = ['lessThan500', '500To2000', '2000To10000', 'moreThan10000'] as const;

  return (
    <section className="col gap-8">
      <header className="col gap-1">
        <h1 className="text-3xl font-semibold">
          <T id="currentSpending.title" />
        </h1>

        <p className="text-dim">
          <T id="currentSpending.description" />
        </p>
      </header>

      <TagList>
        {options.map((useCase) => (
          <Tag
            key={useCase}
            name="currentSpending"
            type="radio"
            value={t(`currentSpending.${useCase}`)}
            label={<T id={`currentSpending.${useCase}`} />}
          />
        ))}
      </TagList>
    </section>
  );
}

function TagList({ children }: { children: React.ReactNode }) {
  return <div className="row flex-wrap gap-2">{children}</div>;
}

function Tag({
  label,
  ...props
}: Extend<React.ComponentProps<'input'>, { name: string; label: React.ReactNode }>) {
  const { field } = useController({ name: props.name });

  return (
    <label
      className={clsx(
        'inline-block cursor-pointer rounded-lg border px-4 py-2 font-semibold transition-colors',
        'has-[:checked]:border-green has-[:checked]:bg-green/10 has-[:checked]:text-green',
      )}
    >
      <input {...field} {...props} className="sr-only" />
      {label}
    </label>
  );
}
