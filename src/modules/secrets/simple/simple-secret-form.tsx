import { useMutation } from '@tanstack/react-query';
import { FieldValues, FormState, useForm } from 'react-hook-form';
import { z } from 'zod';

import { api } from 'src/api/api';
import { Secret } from 'src/api/model';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { useAccessToken } from 'src/application/token';
import { ControlledInput, ControlledSwitch, ControlledTextArea } from 'src/components/controlled';
import { useFormErrorHandler } from 'src/hooks/form';
import { useUpdateEffect } from 'src/hooks/lifecycle';
import { useZodResolver } from 'src/hooks/validation';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('secrets.simpleSecretForm');

const schema = z.object({
  name: z.string().min(2).max(64),
  value: z.string(),
  multiline: z.boolean(),
});

type SecretFormProps = {
  secret?: Secret;
  renderFooter: (formState: FormState<FieldValues>) => React.ReactNode;
  onSubmitted: (secretName: string) => void;
};

export function SecretForm({ secret, renderFooter, onSubmitted }: SecretFormProps) {
  const t = T.useTranslate();
  const { token } = useAccessToken();
  const invalidate = useInvalidateApiQuery();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      name: secret?.name ?? '',
      value: '',
      multiline: false,
    },
    resolver: useZodResolver(schema, {
      name: t('nameLabel'),
      value: t('valueLabel'),
    }),
  });

  useUpdateEffect(() => {
    if (secret) {
      form.reset(secret);
    }
  }, [form, secret]);

  const { mutateAsync: createSecret } = useMutation({
    async mutationFn(param: { name: string; value: string }) {
      if (secret) {
        return api.updateSecret({
          token,
          path: { id: secret.id },
          query: {},
          body: { type: 'SIMPLE', ...param },
        });
      } else {
        return api.createSecret({
          token,
          body: { type: 'SIMPLE', ...param },
        });
      }
    },
    async onSuccess({ secret }) {
      await invalidate('listSecrets');
      await invalidate('revealSecret', { path: { id: secret!.id! } });
      form.reset();
      onSubmitted(secret!.name!);
    },
    onError: useFormErrorHandler(form),
  });

  return (
    <form
      className="col gap-4"
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onSubmit={(event) => {
        event.stopPropagation();
        return form.handleSubmit((values) => createSecret(values))(event);
      }}
    >
      <ControlledInput
        control={form.control}
        name="name"
        required
        readOnly={secret !== undefined}
        label={<T id="nameLabel" />}
        placeholder={t('namePlaceholder')}
      />

      {form.watch('multiline') ? (
        <ControlledTextArea
          control={form.control}
          name="value"
          label={<T id="valueLabel" />}
          textAreaClassName="text-security-disc"
        />
      ) : (
        <ControlledInput control={form.control} name="value" type="password" label={<T id="valueLabel" />} />
      )}

      <ControlledSwitch
        control={form.control}
        name="multiline"
        label="Multi-line"
        labelPosition="left"
        className="self-start"
      />

      {renderFooter(form.formState)}
    </form>
  );
}
