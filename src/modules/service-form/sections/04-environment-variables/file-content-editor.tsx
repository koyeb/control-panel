import { useFormContext } from 'react-hook-form';

import { hasMessage } from 'src/api/api-errors';
import { notify } from 'src/application/notify';
import { readFile } from 'src/application/read-file';
import { ControlledTextArea } from 'src/components/controlled';
import { FileDropZone } from 'src/components/file-drop-zone';
import { Translate } from 'src/intl/translate';

import { ServiceForm } from '../../service-form.types';

const T = Translate.prefix('serviceForm.files.content');

type FileContentEditorProps = {
  index: number;
};

export function FileContentEditor({ index }: FileContentEditorProps) {
  const t = T.useTranslate();
  const form = useFormContext<ServiceForm>();

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

  return (
    <FileDropZone onDrop={([file]) => file && onFileDropped(file)}>
      <ControlledTextArea<ServiceForm, `files.${number}.content`>
        autoFocus
        name={`files.${index}.content`}
        label={<T id="label" />}
        placeholder={t('placeholder')}
        rows={12}
      />
    </FileDropZone>
  );
}
