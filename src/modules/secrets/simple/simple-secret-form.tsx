import { IconButton } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';
import { FieldValues, FormState, useForm } from 'react-hook-form';
import { z } from 'zod';

import { api } from 'src/api/api';
import { Secret } from 'src/api/model';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { ControlledInput, ControlledSwitch, ControlledTextArea } from 'src/components/controlled';
import { IconEye, IconEyeOff } from 'src/components/icons';
import { useFormErrorHandler } from 'src/hooks/form';
import { useUpdateEffect } from 'src/hooks/lifecycle';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.secrets.simpleSecretForm');

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
  const invalidate = useInvalidateApiQuery();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      name: secret?.name ?? '',
      value: '',
      multiline: false,
    },
    resolver: useZodResolver(schema),
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
          path: { id: secret.id },
          query: {},
          body: { type: 'SIMPLE', ...param },
        });
      } else {
        return api.createSecret({
          body: { type: 'SIMPLE', ...param },
        });
      }
    },
    async onSuccess({ secret }) {
      await Promise.all([
        invalidate('listSecrets'),
        invalidate('revealSecret', { path: { id: secret!.id! } }),
        invalidate('getServiceVariables', { body: { definition: {} } }),
      ]);

      form.reset();
      onSubmitted(secret!.name!);
    },
    onError: useFormErrorHandler(form),
  });

  const [showValue, setShowValue] = useState(false);

  const valueLabel = (
    <div className="row items-center justify-between gap-1">
      <T id="valueLabel" />
      <IconButton
        Icon={showValue ? IconEyeOff : IconEye}
        variant="ghost"
        color="gray"
        size={1}
        onClick={() => setShowValue(!showValue)}
      />
    </div>
  );

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
          rows={3}
          label={valueLabel}
          spellCheck="false"
          textAreaClassName={clsx('scrollbar-thin scrollbar-green', !showValue && 'text-security-disc')}
        />
      ) : (
        <ControlledInput
          control={form.control}
          name="value"
          label={valueLabel}
          type={showValue ? 'text' : 'password'}
          autoComplete="one-time-code"
        />
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
