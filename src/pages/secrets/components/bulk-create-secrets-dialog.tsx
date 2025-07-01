import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { api } from 'src/api/api';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { useAuth } from 'src/application/authentication';
import { notify } from 'src/application/notify';
import { useTrackEvent } from 'src/application/posthog';
import { ControlledTextArea } from 'src/components/controlled';
import { CloseDialogButton, Dialog, DialogFooter, DialogHeader } from 'src/components/dialog';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { Translate, createTranslate } from 'src/intl/translate';
import { dotenvParse } from 'src/utils/dotenv';
import { hasProperty } from 'src/utils/object';

const T = createTranslate('pages.secrets.bulkCreateSecretsDialog');

export function BulkCreateSecretsDialog() {
  const t = T.useTranslate();
  const closeDialog = Dialog.useClose();
  const track = useTrackEvent();

  const form = useForm<{ value: string }>({
    defaultValues: {
      value: '',
    },
    resolver: zodResolver(
      z.object({
        value: z
          .string()
          .refine((value) => Object.keys(dotenvParse(value)).length <= 30, t('tooManySecrets')),
      }),
    ),
  });

  const { token } = useAuth();
  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    async mutationFn({ value }: FormValues<typeof form>) {
      const values = dotenvParse(value);

      const results = await Promise.allSettled(
        Object.entries(values).map(([name, value]) =>
          api.createSecret({ token, body: { type: 'SIMPLE', name, value } }),
        ),
      );

      return {
        created: results.filter(hasProperty('status', 'fulfilled')).length,
        errors: results
          .filter(hasProperty('status', 'rejected'))
          .map((_, index) => Object.keys(values).at(index) as string),
      };
    },
    async onSuccess({ created, errors }) {
      await invalidate('listSecrets');

      if (created > 0) {
        notify.success(<T id="successNotification" values={{ created }} />);
      }

      if (errors.length > 0) {
        notify.warning(<T id="errorNotification" values={{ names: errors.join(', ') }} />);
      }

      closeDialog();
      track('BulkSecretsCreated', { count: created });
    },
  });

  return (
    <Dialog id="BulkCreateSecrets" onClosed={() => form.reset()} className="col w-full max-w-2xl gap-4">
      <DialogHeader title={<T id="title" />} />

      <p className="text-dim">
        <T id="description" />
      </p>

      <form onSubmit={handleSubmit(form, mutation.mutate)} className="col gap-4">
        <ControlledTextArea control={form.control} name="value" rows={10} />

        <DialogFooter>
          <CloseDialogButton>
            <Translate id="common.cancel" />
          </CloseDialogButton>

          <Button type="submit" loading={mutation.isPending}>
            <Translate id="common.import" />
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
