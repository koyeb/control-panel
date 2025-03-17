import { useId, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { Field, FieldHelperText, FieldLabel, IconButton } from '@koyeb/design-system';
import { hasMessage } from 'src/api/api-errors';
import { notify } from 'src/application/notify';
import { readFile } from 'src/application/read-file';
import { CodeEditor, CodeEditorLanguageSelect } from 'src/components/code-editor/code-editor';
import { useCodeEditorLanguage } from 'src/components/code-editor/use-code-editor-language';
import { FileDropZone } from 'src/components/file-drop-zone';
import { FullScreen } from 'src/components/full-screen';
import { IconClose, IconFullscreen } from 'src/components/icons';
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

  const mountPath = form.watch(`files.${index}.mountPath`);
  const [language, setLanguage] = useCodeEditorLanguage(mountPath);
  const [fullScreen, setFullScreen] = useState(false);

  return (
    <FileDropZone onDrop={([file]) => file && onFileDropped(file)}>
      <Field
        label={
          <div className="row flex-wrap items-end gap-2 self-stretch">
            <FieldLabel htmlFor={id} className="me-auto">
              {<T id="label" />}
            </FieldLabel>

            <CodeEditorLanguageSelect
              placeholder={t('languageSelect.placeholder')}
              value={language}
              onChange={setLanguage}
            />

            <IconButton size={1} color="gray" Icon={IconFullscreen} onClick={() => setFullScreen(true)}>
              <T id="toggleFullScreen" />
            </IconButton>
          </div>
        }
        helperText={
          <FieldHelperText id={helperTextId} invalid={fieldState.invalid}>
            {fieldState.error?.message}
          </FieldHelperText>
        }
        className="relative"
      >
        <FullScreen enabled={fullScreen} exit={() => setFullScreen(false)} className="col w-full">
          {fullScreen && (
            <div className="row justify-between p-2">
              <div className="truncate text-lg">
                <T id="fullScreenTitle" values={{ mountPath }} />
              </div>

              <IconButton
                variant="ghost"
                color="gray"
                Icon={IconClose}
                onClick={() => setFullScreen(false)}
              />
            </div>
          )}

          <CodeEditor
            autoFocus
            value={field.value}
            onChange={field.onChange}
            language={language}
            className="flex-1"
          />
        </FullScreen>
      </Field>
    </FileDropZone>
  );
}
