import { Button, TabButton, TabButtons } from '@koyeb/design-system';
import { useState } from 'react';
import { useFieldArray, useFormContext, useFormState } from 'react-hook-form';

import { useSecrets } from 'src/api';
import { notify } from 'src/application/notify';
import { readFile } from 'src/application/read-file';
import { Dialog } from 'src/components/dialog';
import { FileDropZone } from 'src/components/file-drop-zone';
import { useMount } from 'src/hooks/lifecycle';
import { IconPlus } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { CreateSecretDialog } from 'src/modules/secrets/simple/create-secret-dialog';

import { ServiceFormSection } from '../../components/service-form-section';
import { parseEnvironmentVariables } from '../../helpers/parse-environment-variables';
import { ServiceForm } from '../../service-form.types';

import { BulkEnvironmentVariablesEditionDialog } from './bulk-environment-variables-edition';
import { EnvironmentVariableFields } from './environment-variable-fields';
import { Files } from './files';

const T = createTranslate('modules.serviceForm.environmentVariables');

export function EnvironmentVariablesSection() {
  const variables = useFormContext<ServiceForm>()
    .watch('environmentVariables')
    .filter((field) => field.name !== '');

  const files = useFormContext<ServiceForm>()
    .watch('files')
    .filter((file) => file.mountPath !== '' || file.content !== '');

  const [tab, setTab] = useState<'environmentVariables' | 'files'>('environmentVariables');

  return (
    <ServiceFormSection
      section="environmentVariables"
      title={<T id="title" />}
      action={<T id="action" />}
      summary={<T id="summary" values={{ variables: variables.length, files: files.length }} />}
      className="col gaps"
    >
      <TabButtons>
        <TabButton selected={tab === 'environmentVariables'} onClick={() => setTab('environmentVariables')}>
          <T id="tabs.environmentVariables" />
        </TabButton>
        <TabButton selected={tab === 'files'} onClick={() => setTab('files')}>
          <T id="tabs.files" />
        </TabButton>
      </TabButtons>

      <WatchFilesErrors onError={() => setTab('files')} />

      {tab === 'environmentVariables' && <EnvironmentVariables />}
      {tab === 'files' && <Files />}
    </ServiceFormSection>
  );
}

function WatchFilesErrors({ onError }: { onError: () => void }) {
  const { errors } = useFormState<ServiceForm>();

  useMount(() => {
    if (errors.files !== undefined) {
      onError();
    }
  });

  return null;
}

function EnvironmentVariables() {
  const t = T.useTranslate();
  const openDialog = Dialog.useOpen();

  const { setValue } = useFormContext<ServiceForm>();

  const { fields, append, remove } = useFieldArray<ServiceForm, 'environmentVariables'>({
    name: 'environmentVariables',
  });

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
      setValue(
        'environmentVariables',
        variables.map((variable) => ({ ...variable, regions: [] })),
      );
    }
  };

  return (
    <>
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
                onRemove={() => {
                  if (fields.length === 1) {
                    setValue('environmentVariables.0', { name: '', value: '', regions: [] });
                  } else {
                    remove(index);
                  }
                }}
                onCreateSecret={() => {
                  setCreateSecretIndex(index);
                  openDialog('CreateSecret');
                }}
              />
            ))}
          </div>

          <div className="col items-start gap-4 sm:row">
            <Button variant="ghost" color="gray" onClick={() => append({ name: '', value: '', regions: [] })}>
              <IconPlus className="size-4" />
              <T id="addVariable" />
            </Button>

            <Button
              variant="outline"
              color="gray"
              onClick={() => openDialog('BulkEnvironmentVariablesEdition')}
            >
              <T id="bulkEdit" />
            </Button>
          </div>
        </div>
      </FileDropZone>

      <BulkEnvironmentVariablesEditionDialog />

      <CreateSecretDialog
        onCreated={(secretName) => {
          setValue(
            `environmentVariables.${createSecretIndex as number}.value`,
            `{{ secret.${secretName} }}`,
            { shouldValidate: true },
          );

          setCreateSecretIndex(undefined);
        }}
      />
    </>
  );
}
