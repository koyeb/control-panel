import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { Dialog, TextArea, Button } from '@koyeb/design-system';
import { Translate } from 'src/intl/translate';

import { ServiceForm } from '../../service-form.types';

const T = Translate.prefix('serviceForm.environmentVariables.files.editContentDialog');

type EditFileContentDialogProps = {
  index: number | undefined;
  onClose: () => void;
};

export function EditFileContentDialog({ index, onClose }: EditFileContentDialogProps) {
  const form = useFormContext<ServiceForm>();
  const [text, setText] = useState('');

  useEffect(() => {
    if (index !== undefined) {
      setText(form.getValues().fileMounts[index]?.content ?? '');
    }
  }, [index, form]);

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
      <TextArea
        name={`fileMounts.${index as number}.content`}
        rows={12}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />

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
