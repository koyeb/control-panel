import { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Button, TabButton, TabButtons } from '@koyeb/design-system';
import { useSecrets } from 'src/api/hooks/secret';
import { notify } from 'src/application/notify';
import { readFile } from 'src/application/read-file';
import { FileDropZone } from 'src/components/file-drop-zone';
import { IconPlus } from 'src/components/icons';
import { FeatureFlag, useFeatureFlag } from 'src/hooks/feature-flag';
import { Translate } from 'src/intl/translate';
import { CreateSecretDialog } from 'src/modules/secrets/simple/create-secret-dialog';

import { ServiceFormSection } from '../../components/service-form-section';
import { parseEnvironmentVariables } from '../../helpers/parse-environment-variables';
import { ServiceForm } from '../../service-form.types';

import { BulkEnvironmentVariablesEditionDialog } from './bulk-environment-variables-edition';
import { EnvironmentVariableFields } from './environment-variable-fields';
import { Files } from './files';
import { UnknownInterpolationAlert } from './unknown-interpolation-alert';

const T = Translate.prefix('serviceForm.environmentVariables');

export function EnvironmentVariablesSection() {
  const variables = useFormContext<ServiceForm>()
    .watch('environmentVariables')
    .filter((field) => field.name !== '');
  const files = useFormContext<ServiceForm>().watch('files');
  const [tab, setTab] = useState<'environmentVariables' | 'files'>('environmentVariables');

  const hasMountFiles = useFeatureFlag('mount-files');
  const id = <T extends string>(id: T): `${T}.new` | T => (hasMountFiles ? `${id}.new` : id);

  return (
    <ServiceFormSection
      section="environmentVariables"
      title={<T id={id('title')} values={{ variables: variables.length, files: files.length }} />}
      description={<T id={id('description')} />}
      expandedTitle={<T id={id('expandedTitle')} />}
      className="col gaps"
    >
      {hasMountFiles && (
        <TabButtons>
          <TabButton selected={tab === 'environmentVariables'} onClick={() => setTab('environmentVariables')}>
            <T id="tabs.environmentVariables" />
          </TabButton>
          <TabButton selected={tab === 'files'} onClick={() => setTab('files')}>
            <T id="tabs.files" />
          </TabButton>
        </TabButtons>
      )}

      <FeatureFlag feature="missing-interpolation-warning">
        <UnknownInterpolationAlert />
      </FeatureFlag>

      {tab === 'environmentVariables' && <EnvironmentVariables />}
      {tab === 'files' && <Files />}
    </ServiceFormSection>
  );
}

function EnvironmentVariables() {
  const t = T.useTranslate();
  const { setValue } = useFormContext<ServiceForm>();

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
                onCreateSecret={() => setCreateSecretIndex(index)}
              />
            ))}
          </div>

          <div className="col sm:row items-start gap-4">
            <Button variant="ghost" color="gray" onClick={() => append({ name: '', value: '', regions: [] })}>
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
    </>
  );
}
