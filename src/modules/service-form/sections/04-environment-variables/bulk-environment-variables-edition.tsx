import { useCallback, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Button, TextArea } from '@koyeb/design-system';
import { useSecrets } from 'src/api/hooks/secret';
import { CloseDialogButton, Dialog, DialogFooter, DialogHeader } from 'src/components/dialog';
import { createTranslate } from 'src/intl/translate';

import {
  SecretNotFoundError,
  parseEnvironmentVariables,
  stringifyEnvironmentVariables,
} from '../../helpers/parse-environment-variables';
import { useWatchServiceForm } from '../../use-service-form';

const T = createTranslate('modules.serviceForm.environmentVariables.bulkEdition');

export function BulkEnvironmentVariablesEditionDialog() {
  const closeDialog = Dialog.useClose();
  const t = T.useTranslate();

  const { setValue, trigger } = useFormContext();
  const environmentVariables = useWatchServiceForm('environmentVariables');
  const stringifiedEnvironmentVariables = stringifyEnvironmentVariables(environmentVariables);
  const [unknownSecretName, setUnknownSecretName] = useState<string>();

  const secrets = useSecrets('simple');

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const data = new FormData(event.currentTarget);
      const value = data.get('environment-variables') as string;

      try {
        const variables = parseEnvironmentVariables(value, secrets);

        if (variables.length > 0) {
          setValue('environmentVariables', variables);
        } else {
          setValue('environmentVariables', [{ name: '', value: '', regions: [] }]);
        }

        void trigger('environmentVariables');
        closeDialog();
      } catch (error) {
        if (error instanceof SecretNotFoundError) {
          setUnknownSecretName(error.name);
        } else {
          throw error;
        }
      }
    },
    [setValue, trigger, closeDialog, secrets],
  );

  return (
    <Dialog
      id="BulkEnvironmentVariablesEdition"
      onClosed={() => setUnknownSecretName(undefined)}
      className="col w-full max-w-2xl gap-4"
    >
      <DialogHeader title={<T id="title" />} />

      <p className="text-dim">
        <T id="description" />
      </p>

      <p className="text-dim">
        <T id="line1" values={{ code }} />
      </p>

      <form onSubmit={handleSubmit} className="col gap-4">
        <TextArea
          name="environment-variables"
          placeholder={t('variablesPlaceholder')}
          rows={6}
          defaultValue={stringifiedEnvironmentVariables}
          onChange={() => setUnknownSecretName(undefined)}
          error={
            unknownSecretName !== undefined && <T id="unknownSecret" values={{ name: unknownSecretName }} />
          }
        />

        <DialogFooter>
          <CloseDialogButton>
            <T id="cancel" />
          </CloseDialogButton>

          <Button type="submit">
            <T id="save" />
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function code(children: React.ReactNode) {
  return <code>{children}</code>;
}
