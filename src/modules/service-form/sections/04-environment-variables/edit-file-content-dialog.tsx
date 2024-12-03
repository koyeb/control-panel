import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { Dialog, TextArea, Button } from '@koyeb/design-system';
import { notify } from 'src/application/notify';
import { readFile } from 'src/application/read-file';
import { FileDropZone } from 'src/components/file-drop-zone';
import { Translate } from 'src/intl/translate';

import { ServiceForm } from '../../service-form.types';

const T = Translate.prefix('serviceForm.environmentVariables.files.editContentDialog');

type EditFileContentDialogProps = {
  index: number | undefined;
  onClose: () => void;
};

export function EditFileContentDialog({ index, onClose }: EditFileContentDialogProps) {
  const t = T.useTranslate();
  const form = useFormContext<ServiceForm>();
  const [text, setText] = useState('');

  useEffect(() => {
    if (index !== undefined) {
      setText(form.getValues().fileMounts[index]?.content ?? '');
    }
  }, [index, form]);

  const onFileDropped = async (file: File) => {
    if (file.size > 4096) {
      notify.error(t('fileTooLarge'));
      return;
    }

    readFile(file).then(({ content }) => setText(content), notify.error);
  };

  return (
    <Dialog
      isOpen={index !== undefined}
      onClose={onClose}
      title={<T id="title" />}
      description={
        <T id="description" values={{ mountPath: form.watch(`fileMounts.${index as number}.mountPath`) }} />
      }
      width="3xl"
    >
      <FileDropZone onDrop={([file]) => file && onFileDropped(file)}>
        <TextArea
          name={`fileMounts.${index as number}.content`}
          rows={12}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </FileDropZone>

      <footer className="row mt-2 justify-end gap-2">
        <Button variant="ghost" color="gray" onClick={onClose}>
          <Translate id="common.cancel" />
        </Button>

        <Button
          onClick={() => {
            form.setValue(`fileMounts.${index as number}.content`, text);
            onClose();
          }}
        >
          <Translate id="common.save" />
        </Button>
      </footer>
    </Dialog>
  );
}
