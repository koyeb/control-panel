import { useCallback, useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Button, Dialog, TextArea } from '@koyeb/design-system';
import { useSecrets } from 'src/api/hooks/secret';
import { Translate } from 'src/intl/translate';

import {
  SecretNotFoundError,
  parseEnvironmentVariables,
  stringifyEnvironmentVariables,
} from '../../helpers/parse-environment-variables';
import { useWatchServiceForm } from '../../use-service-form';

const T = Translate.prefix('serviceForm.environmentVariables.bulkEdition');

type BulkEnvironmentVariablesEditionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function BulkEnvironmentVariablesEditionDialog({
  isOpen,
  onClose,
}: BulkEnvironmentVariablesEditionDialogProps) {
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
          setValue('environmentVariables', [{ name: '', value: '' }]);
        }

        void trigger('environmentVariables');
        onClose();
      } catch (error) {
        if (error instanceof SecretNotFoundError) {
          setUnknownSecretName(error.name);
        } else {
          throw error;
        }
      }
    },
    [setValue, trigger, onClose, secrets],
  );

  useEffect(() => {
    setUnknownSecretName(undefined);
  }, [isOpen]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={<T id="title" />}
      description={<T id="description" />}
      width="xl"
      className="col gap-6"
    >
      <p className="text-dim">
        <T id="line1" values={{ code }} />
      </p>

      <form onSubmit={handleSubmit}>
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

        <footer className="row mt-2 justify-end gap-2">
          <Button variant="ghost" color="gray" onClick={onClose}>
            <T id="cancel" />
          </Button>

          <Button type="submit">
            <T id="save" />
          </Button>
        </footer>
      </form>
    </Dialog>
  );
}

function code(children: React.ReactNode) {
  return <code>{children}</code>;
}
