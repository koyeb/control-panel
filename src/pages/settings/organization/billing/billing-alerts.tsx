import { Button, InputEnd, InputStart } from '@koyeb/design-system';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { UseFormReturn, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useOrganization } from 'src/api/hooks/session';
import { useApiMutationFn, useApiQueryFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/controlled';
import { SectionHeader } from 'src/components/section-header';
import { TextSkeleton } from 'src/components/skeleton';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { FormattedPrice } from 'src/intl/formatted';
import { Translate, createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.organizationSettings.billing.billingAlerts');

const schema = z.object({
  amount: z.union([z.nan(), z.literal(0), z.number().min(5)]),
});

export function BillingAlerts() {
  const organization = useOrganization();
  const isHobby = organization.plan === 'hobby';

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: { amount: NaN },
    resolver: useZodResolver(schema),
  });

  const { currentAmount, query, updateMutation, deleteMutation } = useSpendingLimit(form);

  useEffect(() => {
    form.reset({ amount: currentAmount !== null ? currentAmount / 100 : Number.NaN });
  }, [form, currentAmount]);

  const onSubmit = async ({ amount }: FormValues<typeof form>) => {
    if (Number.isNaN(amount) || amount === 0) {
      return deleteMutation.mutateAsync();
    } else {
      return updateMutation.mutateAsync(amount);
    }
  };

  return (
    <section className="col gap-6">
      <SectionHeader title={<T id="title" />} description={<T id="description" />} />

      {query.isPending && <TextSkeleton width={30} />}

      {query.isError && query.error.message}

      <form onSubmit={handleSubmit(form, onSubmit)} className="row items-start gap-4">
        <ControlledInput
          control={form.control}
          disabled={isHobby}
          name="amount"
          type="number"
          start={
            <InputStart>
              <T id="inputStart" />
            </InputStart>
          }
          end={
            <InputEnd>
              <T id="inputEnd" />
            </InputEnd>
          }
          className="w-full max-w-xs"
        />

        <Button
          type="submit"
          disabled={isHobby || (form.formState.submitCount > 0 && !form.formState.isValid)}
          loading={updateMutation.isPending || deleteMutation.isPending}
        >
          <Translate id="common.save" />
        </Button>
      </form>

      {isHobby && (
        <p className="border-l-4 border-green/50 pl-3 text-xs">
          <T id="hobbyPlanUpgrade" />
        </p>
      )}
    </section>
  );
}

function useSpendingLimit(form: UseFormReturn<{ amount: number }>) {
  const t = T.useTranslate();
  const organization = useOrganization();
  const invalidate = useInvalidateApiQuery();

  const query = useQuery({
    ...useApiQueryFn('getBudget', {
      path: { organization_id: organization.id },
    }),
    select({ budget }) {
      return Number(budget!.amount!);
    },
  });

  const updateMutation = useMutation({
    ...useApiMutationFn('updateBudget', (amount: number) => ({
      path: { organization_id: organization.id },
      body: { amount: String(amount * 100) },
    })),
    onError: useFormErrorHandler(form),
    async onSuccess({ budget }) {
      await invalidate('getBudget');
      notify.success(t('alertSetNotification', { value: <FormattedPrice value={Number(budget?.amount)} /> }));
    },
  });

  const deleteMutation = useMutation({
    ...useApiMutationFn('deleteBudget', {
      path: { organization_id: organization.id },
    }),
    onError: useFormErrorHandler(form),
    async onSuccess() {
      await invalidate('getBudget');
      notify.success(t('alertRemovedNotification'));
    },
  });

  return {
    currentAmount: query.isSuccess && query.data > 0 ? query.data : null,
    query,
    updateMutation,
    deleteMutation,
  };
}
