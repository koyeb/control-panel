import { useId } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { Field, FieldHelperText, FieldLabel } from '@koyeb/design-system';
import { hasMessage } from 'src/api/api-errors';
import { notify } from 'src/application/notify';
import { readFile } from 'src/application/read-file';
import { CodeEditor, CodeEditorLanguageSelect } from 'src/components/code-editor/code-editor';
import { useCodeEditorLanguage } from 'src/components/code-editor/use-code-editor-language';
import { FileDropZone } from 'src/components/file-drop-zone';
import { createTranslate } from 'src/intl/translate';

import { ServiceForm } from '../../service-form.types';

const T = createTranslate('modules.serviceForm.files.content');

type FileContentEditorProps = {
  index: number;
};

export function FileContentEditor({ index }: FileContentEditorProps) {
  const t = T.useTranslate();
  const form = useFormContext<ServiceForm>();

  const id = useId();
  const helperTextId = `${id}-error-text`;

  const onFileDropped = (file: File) => {
    if (file.size > 4096) {
      notify.error(t('fileTooLarge'));
      return;
    }

    readFile(file).then(
      ({ content }) => form.setValue(`files.${index}.content`, content),
      (error: unknown) => hasMessage(error) && notify.error(error.message),
    );
  };

  const { field, fieldState } = useController<ServiceForm, `files.${number}.content`>({
    name: `files.${index}.content`,
  });

  const [language, setLanguage] = useCodeEditorLanguage(form.watch(`files.${index}.mountPath`));

  return (
    <FileDropZone onDrop={([file]) => file && onFileDropped(file)}>
      <Field
        label={
          <div className="row flex-wrap items-end justify-between gap-4 self-stretch">
            <FieldLabel htmlFor={id}>{<T id="label" />}</FieldLabel>
            <CodeEditorLanguageSelect
              placeholder={t('languageSelect.placeholder')}
              value={language}
              onChange={setLanguage}
            />
          </div>
        }
        helperText={
          <FieldHelperText id={helperTextId} invalid={fieldState.invalid}>
            {fieldState.error?.message}
          </FieldHelperText>
        }
        className="relative"
      >
        <CodeEditor autoFocus value={field.value} onChange={field.onChange} language={language} />
      </Field>
    </FileDropZone>
  );
}
