import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';

import { Button, InputStart } from '@koyeb/design-system';
import { useOrganization } from 'src/api/hooks/session';
import { useApiMutationFn, useApiQueryFn, useInvalidateApiQuery } from 'src/api/use-api';
import { ControlledInput } from 'src/components/controlled';
import { SectionHeader } from 'src/components/section-header';
import { TextSkeleton } from 'src/components/skeleton';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { FormattedPrice } from 'src/intl/formatted';
import { createTranslate, Translate } from 'src/intl/translate';

const T = createTranslate('pages.organizationSettings.billing.spendingLimit');

export function SpendingAlerts() {
  const form = useForm<{ amount: number }>({
    defaultValues: { amount: NaN },
  });

  const { currentAmount, query, updateMutation, deleteMutation } = useSpendingLimit(form);

  useEffect(() => {
    form.reset({ amount: currentAmount !== null ? currentAmount / 100 : Number.NaN });
  }, [currentAmount, form]);

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

      {currentAmount === null && <T id="noCurrentLimit" />}

      {currentAmount !== null && (
        <T id="currentLimit" values={{ value: <FormattedPrice value={currentAmount} digits={0} /> }} />
      )}

      {query.isError && query.error.message}

      <form onSubmit={handleSubmit(form, onSubmit)} className="row gap-4">
        <ControlledInput
          control={form.control}
          name="amount"
          type="number"
          className="w-full max-w-xs"
          start={
            <InputStart>
              <T id="inputStart" />
            </InputStart>
          }
        />

        <Button type="submit" loading={updateMutation.isPending || deleteMutation.isPending}>
          <Translate id="common.save" />
        </Button>
      </form>
    </section>
  );
}

function useSpendingLimit(form: UseFormReturn<{ amount: number }>) {
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
      query: { amount: String(amount * 100) },
    })),
    onError: useFormErrorHandler(form),
    async onSuccess() {
      await invalidate('getBudget');
    },
  });

  const deleteMutation = useMutation({
    ...useApiMutationFn('deleteBudget', {
      path: { organization_id: organization.id },
    }),
    onError: useFormErrorHandler(form),
    async onSuccess() {
      await invalidate('getBudget');
    },
  });

  return {
    currentAmount: query.isSuccess && query.data > 0 ? query.data : null,
    query,
    updateMutation,
    deleteMutation,
  };
}
