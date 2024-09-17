import { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Button } from '@koyeb/design-system';
import { useSecrets } from 'src/api/hooks/secret';
import { notify } from 'src/application/notify';
import { readFile } from 'src/application/read-file';
import { FileDropZone } from 'src/components/file-drop-zone';
import { IconPlus } from 'src/components/icons';
import { Translate } from 'src/intl/translate';
import { CreateSecretDialog } from 'src/modules/secrets/simple/create-secret-dialog';

import { ServiceFormSection } from '../../components/service-form-section';
import { parseEnvironmentVariables } from '../../helpers/parse-environment-variables';
import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { BulkEnvironmentVariablesEditionDialog } from './bulk-environment-variables-edition';
import { EnvironmentVariableFields } from './environment-variable-fields';

const T = Translate.prefix('serviceForm.environmentVariables');

export function EnvironmentVariablesSection() {
  const t = T.useTranslate();
  const { setValue } = useFormContext<ServiceForm>();
  const variables = useWatchServiceForm('environmentVariables');
  const { fields, append, remove } = useFieldArray<ServiceForm, 'environmentVariables'>({
    name: 'environmentVariables',
  });

  const [bulkEditionDialogOpen, setBulkEditionDialogOpen] = useState(false);
  const [createSecretIndex, setCreateSecretIndex] = useState<number>();

  const secrets = useSecrets('simple');

  const environmentFileDropped = async (file: File) => {
    if (file.type !== '' && file.type !== 'text/plain') {
      notify.error(t('fileUpload.notPlainText'));
      return;
    }

    const { content } = await readFile(file);
    const variables = parseEnvironmentVariables(content, secrets);

    if (variables.length === 0) {
      notify.error(t('fileUpload.noEnvVars'));
    } else {
      setValue('environmentVariables', variables);
    }
  };

  return (
    <ServiceFormSection
      section="environmentVariables"
      title={<T id="title" values={{ count: variables.filter((field) => field.name !== '').length }} />}
      description={<T id="description" />}
      expandedTitle={<T id="expandedTitle" />}
    >
      <FileDropZone onDrop={([file]) => file && void environmentFileDropped(file)}>
        <div className="col gaps">
          <p>
            <T id="info" />
          </p>

          <div className="col gap-4">
            {fields.map((variable, index) => (
              <EnvironmentVariableFields
                key={variable.id}
                index={index}
                onRemove={() => remove(index)}
                onCreateSecret={() => setCreateSecretIndex(index)}
              />
            ))}
          </div>

          <div className="col sm:row items-start gap-4">
            <Button variant="ghost" color="gray" onClick={() => append({ name: '', value: '' })}>
              <IconPlus className="size-4" />
              <T id="addVariable" />
            </Button>

            <Button variant="outline" color="gray" onClick={() => setBulkEditionDialogOpen(true)}>
              <T id="bulkEdit" />
            </Button>
          </div>
        </div>
      </FileDropZone>

      <BulkEnvironmentVariablesEditionDialog
        isOpen={bulkEditionDialogOpen}
        onClose={() => setBulkEditionDialogOpen(false)}
      />

      <CreateSecretDialog
        open={createSecretIndex !== undefined}
        onClose={() => setCreateSecretIndex(undefined)}
        onCreated={(secretName) => {
          setValue(
            `environmentVariables.${createSecretIndex as number}.value`,
            `{{ secret.${secretName} }}`,
            { shouldValidate: true },
          );

          setCreateSecretIndex(undefined);
        }}
      />
    </ServiceFormSection>
  );
}
