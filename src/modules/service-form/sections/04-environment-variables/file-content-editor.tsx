import { Field, FieldHelperText, FieldLabel, IconButton } from '@koyeb/design-system';
import { useId, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { notify } from 'src/application/notify';
import { readFile } from 'src/application/read-file';
import { hasMessage } from 'src/application/validation';
import { CodeEditor, CodeEditorLanguageSelect } from 'src/components/code-editor/code-editor';
import { useCodeEditor } from 'src/components/code-editor/use-code-editor';
import { FileDropZone } from 'src/components/file-drop-zone';
import { FullScreen } from 'src/components/full-screen';
import { IconFullscreen, IconX } from 'src/icons';
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
  const [fullScreen, setFullScreen] = useState(false);

  const codeEditor = useCodeEditor(mountPath);

  return (
    <FileDropZone onDrop={([file]) => file && onFileDropped(file)}>
      <Field
        id={id}
        label={
          <div className="row flex-wrap items-end gap-2 self-stretch">
            <FieldLabel className="me-auto">{<T id="label" />}</FieldLabel>

            <CodeEditorLanguageSelect codeEditor={codeEditor} placeholder={t('languageSelect.placeholder')} />

            <IconButton size={1} color="gray" Icon={IconFullscreen} onClick={() => setFullScreen(true)}>
              <T id="toggleFullScreen" />
            </IconButton>
          </div>
        }
        helperText={
          <FieldHelperText invalid={fieldState.invalid}>{fieldState.error?.message}</FieldHelperText>
        }
        className="relative"
      >
        <FullScreen enabled={fullScreen} exit={() => setFullScreen(false)} className="col w-full">
          {fullScreen && (
            <div className="row justify-between p-2">
              <div className="truncate text-lg">
                <T id="fullScreenTitle" values={{ mountPath }} />
              </div>

              <IconButton variant="ghost" color="gray" Icon={IconX} onClick={() => setFullScreen(false)} />
            </div>
          )}

          <CodeEditor
            autoFocus
            id={id}
            editor={codeEditor}
            value={field.value}
            onChange={field.onChange}
            className="flex-1"
          />
        </FullScreen>
      </Field>
    </FileDropZone>
  );
}
