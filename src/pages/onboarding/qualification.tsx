import { Stepper } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import omit from 'lodash-es/omit';
import { useMemo } from 'react';
import { FieldPath, FormProvider, useController, useForm, useFormContext, useWatch } from 'react-hook-form';

import { hasMessage } from 'src/api/api-errors';
import { useOrganization, useUser } from 'src/api/hooks/session';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { getApi } from 'src/application/container';
import { notify } from 'src/application/notify';
import { useTrackEvent } from 'src/application/posthog';
import { ControlledInput, ControlledTextArea } from 'src/components/controlled';
import { Dialog } from 'src/components/dialog';
import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import { createTranslate } from 'src/intl/translate';
import { OnboardingLayout } from 'src/layouts/onboarding/onboarding-layout';
import { assert, defined } from 'src/utils/assert';
import { Extend } from 'src/utils/types';

import { AuthButton } from '../authentication/components/auth-button';

const T = createTranslate('pages.onboarding.qualification');

type Step = 'fullName' | 'usage' | 'primaryUseCase' | 'currentSpending' | 'referralSource' | 'sendInvites';
type Usage = 'personal' | 'education' | 'professional';
// prettier-ignore
type Occupation = 'founder' | 'cto' | 'devops'  | 'softwareEngineer' | 'engineeringManager' | 'freelancer' | 'hobbyist' | 'student' | 'teacher' | 'aiEngineer' | 'mlEngineer' | 'dataEngineer' | 'dataScientist' | 'researchEngineer' | 'other';
// prettier-ignore
type PrimaryUseCase = 'ai' | 'rag' | 'embeddingService' | 'computerVision' | 'audioProcessing' | 'deployCustomModel' | 'training' | 'llmInference' | 'diffusion' | 'video' | 'web' | 'api' | 'nlp' | 'company' | 'blog' | 'personal' | 'school' | 'bot' | 'other';
type CurrentSpending = 'lessThan500' | '500To2000' | '2000To10000' | 'moreThan10000';
// prettier-ignore
type ReferralSource = 'searchEngine' | 'recommendation' | 'socialMedia' | 'hackerNews' | 'reddit' | 'podcast' | 'meetup' | 'other';

type QualificationFormType = {
  fullName?: string;
  step: Step;
  usage?: Usage;
  occupation?: Occupation;
  primaryUseCase?: PrimaryUseCase[];
  currentSpending?: CurrentSpending;
  referralSource?: ReferralSource;
  invites?: string;
};

export function Qualification() {
  const user = useUser();
  const organization = useOrganization();

  const openDialog = Dialog.useOpen();
  const invalidate = useInvalidateApiQuery();
  const track = useTrackEvent();

  const form = useForm<QualificationFormType>({
    defaultValues: {
      primaryUseCase: [],
      step: user.githubUser ? 'fullName' : 'usage',
    },
  });

  const mutation = useMutation({
    async mutationFn(form: QualificationFormType) {
      const api = getApi();

      if (form.fullName !== '') {
        await api.updateUser({
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
        referralSource: form.referralSource,
        submittedAt: new Date().toISOString(),
      };

      await api.updateSignupQualification({
        path: { id: organization.id },
        body: { signup_qualification: values as Record<string, never> },
      });

      for (const email of form.invites?.split(/[ ,]/) ?? []) {
        if (email === '') {
          continue;
        }

        try {
          await api.sendInvitation({ body: { email } });
        } catch (error) {
          if (hasMessage(error)) {
            notify.error(error.message);
          }
        }
      }
    },
    async onSuccess(_, values) {
      await invalidate('getCurrentUser');
      await invalidate('getCurrentOrganization');

      track('Form Submitted', {
        category: 'User Qualification',
        action: 'Clicked',
        ...omit(values, 'step', 'invites'),
      });

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

  steps.push('referralSource');

  if (['pro', 'scale', 'enterprise'].includes(organization.plan)) {
    steps.push('sendInvites');
  }

  const handleSubmit = (values: QualificationFormType) => {
    const nextStep = steps.at(steps.indexOf(values.step) + 1);

    if (nextStep) {
      form.setValue('step', nextStep);
    } else {
      mutation.mutate(values);
    }
  };

  return (
    <OnboardingLayout sentence={<T id={`${step}.sidebar`} />}>
      <section className="mb-8 row flex-wrap gap-6 lg:justify-between">
        <LogoKoyeb className="me-auto h-8 lg:hidden" />

        <Stepper activeStep={steps.indexOf(step)} totalSteps={steps.length + 1} />

        <AuthButton
          onClick={() => handleSubmit(form.getValues())}
          className={clsx('border border-zinc-400 bg-neutral !text-default hover:bg-neutral', {
            invisible: step === 'fullName' || step === 'usage',
          })}
        >
          <T id="skip" />
        </AuthButton>
      </section>

      {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
      <form onSubmit={form.handleSubmit(handleSubmit)} className="col flex-1 justify-center gap-8">
        <FormProvider {...form}>
          <QualificationStep />
        </FormProvider>
      </form>

      <div className="min-h-12" />
    </OnboardingLayout>
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

  if (step === 'referralSource') {
    return <ReferralSourceStep />;
  }

  if (step === 'sendInvites') {
    return <SendInvitesStep />;
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

      <ControlledInput name="fullName" required />

      <AuthButton type="submit" className="self-start">
        <T id="continue" />
      </AuthButton>
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
    personal:     ['founder', 'cto', 'devops', 'softwareEngineer', 'engineeringManager', 'freelancer', 'aiEngineer', 'mlEngineer', 'dataEngineer', 'dataScientist', 'researchEngineer', 'student', 'teacher', 'hobbyist', 'other'],
    education:    ['student', 'teacher', 'other'],
    professional: ['founder', 'cto', 'devops', 'softwareEngineer', 'engineeringManager', 'freelancer', 'aiEngineer', 'mlEngineer', 'dataEngineer', 'dataScientist', 'researchEngineer', 'other'],
  };

  return (
    <section className="mt-20 col gap-8">
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
            onClick={(event) => event.currentTarget.form?.requestSubmit()}
          />
        ))}
      </TagList>
    </section>
  );
}

function PrimaryUseCaseStep() {
  const t = T.useTranslate();
  const usage = useWatch<QualificationFormType, 'usage'>({ name: 'usage' });

  // prettier-ignore
  const options: Record<Usage, PrimaryUseCase[]> = {
    personal:     ['ai', 'rag', 'embeddingService', 'computerVision', 'audioProcessing', 'deployCustomModel', 'training', 'llmInference', 'diffusion', 'video', 'web', 'api', 'nlp', 'company', 'blog', 'personal', 'school', 'bot', 'other'],
    education:    ['ai', 'rag', 'embeddingService', 'computerVision', 'audioProcessing', 'deployCustomModel', 'training', 'llmInference', 'diffusion', 'video', 'web', 'api', 'nlp', 'company', 'blog', 'personal', 'school', 'bot', 'other'],
    professional: ['ai', 'rag', 'embeddingService', 'computerVision', 'audioProcessing', 'deployCustomModel', 'training', 'llmInference', 'diffusion', 'video', 'web', 'api', 'nlp', 'company', 'blog', 'personal', 'school', 'bot', 'other'],
  };

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
        {options[defined(usage)].map((useCase) => (
          <Tag
            key={useCase}
            name="primaryUseCase"
            type="checkbox"
            value={t(`primaryUseCase.${useCase}`)}
            label={<T id={`primaryUseCase.${useCase}`} />}
          />
        ))}
      </TagList>

      <AuthButton type="submit" className="self-start">
        <T id="continue" />
      </AuthButton>
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
      </header>

      <TagList>
        {options.map((option) => (
          <Tag
            key={option}
            name="currentSpending"
            type="radio"
            value={t(`currentSpending.${option}`)}
            label={<T id={`currentSpending.${option}`} />}
            onClick={(event) => event.currentTarget.form?.requestSubmit()}
          />
        ))}
      </TagList>
    </section>
  );
}

function ReferralSourceStep() {
  const t = T.useTranslate();

  const options = [
    'searchEngine',
    'recommendation',
    'socialMedia',
    'hackerNews',
    'reddit',
    'podcast',
    'meetup',
    'other',
  ] as const;

  return (
    <section className="col gap-8">
      <header className="col gap-1">
        <h1 className="text-3xl font-semibold">
          <T id="referralSource.title" />
        </h1>
      </header>

      <TagList>
        {options.map((option) => (
          <Tag
            key={option}
            name="referralSource"
            type="radio"
            value={t(`referralSource.${option}`)}
            label={<T id={`referralSource.${option}`} />}
            onClick={(event) => event.currentTarget.form?.requestSubmit()}
          />
        ))}
      </TagList>
    </section>
  );
}

function SendInvitesStep() {
  const t = T.useTranslate();

  return (
    <section className="col gap-8">
      <header className="col gap-1">
        <h1 className="text-3xl font-semibold">
          <T id="sendInvites.title" />
        </h1>

        <p className="text-dim">
          <T id="sendInvites.description" />
        </p>
      </header>

      <ControlledTextArea
        name="invites"
        rows={5}
        placeholder={t('sendInvites.placeholder')}
        className="bg-neutral"
      />

      <AuthButton type="submit" className="self-start">
        <T id="sendInvites.submit" />
      </AuthButton>
    </section>
  );
}

function TagList({ children }: { children: React.ReactNode }) {
  return <div className="row flex-wrap gap-2">{children}</div>;
}

type TagProps = Extend<
  React.ComponentProps<'input'>,
  { name: FieldPath<QualificationFormType>; label: React.ReactNode }
>;

function Tag({ name, label, ...props }: TagProps) {
  const { field } = useController({ name });

  const checked = useMemo(() => {
    if (props.type === 'checkbox') {
      assert(Array.isArray(field.value));
      return field.value.includes(props.value);
    }

    if (props.type === 'radio') {
      return field.value === props.value;
    }
  }, [props.type, props.value, field.value]);

  const handleChange = () => {
    const { type, value } = props;

    if (type === 'radio') {
      field.onChange(value);
    }

    if (type === 'checkbox') {
      assert(Array.isArray(field.value));

      if (field.value?.includes(value)) {
        field.onChange(field.value?.filter((v: unknown) => v !== value));
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        field.onChange([...(field.value ?? []), value]);
      }
    }
  };

  return (
    <label
      className={clsx(
        'inline-block cursor-pointer rounded-lg border px-4 py-2 font-semibold transition-colors',
        'has-[:checked]:border-green has-[:checked]:bg-green/10 has-[:checked]:text-green',
      )}
    >
      <input {...props} {...field} checked={checked} onChange={handleChange} className="sr-only" />
      {label}
    </label>
  );
}
