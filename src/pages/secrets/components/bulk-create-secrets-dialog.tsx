import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Dialog } from '@koyeb/design-system';
import { api } from 'src/api/api';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { useTrackEvent } from 'src/application/posthog';
import { useToken } from 'src/application/token';
import { ControlledTextArea } from 'src/components/controlled';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { Translate } from 'src/intl/translate';
import { dotenvParse } from 'src/utils/dotenv';
import { hasProperty } from 'src/utils/object';

const T = Translate.prefix('pages.secrets.bulkCreateSecretsDialog');

type BulkCreateSecretsDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function BulkCreateSecretsDialog({ open, onClose }: BulkCreateSecretsDialogProps) {
  const t = T.useTranslate();
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

  const { token } = useToken();
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

      onClose();
      track('BulkSecretsCreated', { count: created });
    },
  });

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      onClosed={() => form.reset()}
      title={<T id="title" />}
      description={<T id="description" />}
      width="lg"
      className="col gap-2"
    >
      <form onSubmit={handleSubmit(form, mutation.mutate)} className="col gap-4">
        <ControlledTextArea control={form.control} name="value" rows={10} />

        <div className="row justify-end gap-2">
          <Button variant="ghost" color="gray" onClick={onClose}>
            <Translate id="common.cancel" />
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            <Translate id="common.import" />
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
