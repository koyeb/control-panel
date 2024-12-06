import clsx from 'clsx';
import { useState } from 'react';
import { useFieldArray } from 'react-hook-form';

import { Button } from '@koyeb/design-system';
import { ControlledInput } from 'src/components/controlled';
import { IconPlus } from 'src/components/icons';
import { Translate } from 'src/intl/translate';

import { ServiceForm } from '../../service-form.types';

import { FileContentEditor } from './file-content-editor';

const T = Translate.prefix('serviceForm.mounts.files');

export function Files() {
  const { fields, append, remove, update } = useFieldArray<ServiceForm, 'fileMounts'>({ name: 'fileMounts' });

  const [expandedIndex, setExpandedIndex] = useState<number>();
  const isExpanded = (index: number) => index === expandedIndex;

  const handleRemove = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      update(index, { mountPath: '', permissions: '', content: '' });
    }
  };

  return (
    <div className="col gap-2">
      <div className="row items-center justify-between">
        <div>
          <T id="title" />
        </div>

        <Button
          variant="ghost"
          color="gray"
          onClick={() => append({ mountPath: '', content: '', permissions: '' })}
          className={clsx({ hidden: fields.length === 0 })}
        >
          <IconPlus className="size-4" />
          <T id="add" />
        </Button>
      </div>

      {fields.map((file, index) =>
        isExpanded(index) ? (
          <div key={file.id} className="col gap-4 rounded border p-4">
            <FileContentEditor index={index} />

            <div className="row items-end gap-4">
              <ControlledInput<ServiceForm, `fileMounts.${number}.mountPath`>
                name={`fileMounts.${index}.mountPath`}
                label={<T id="mountPathLabel" />}
                className="w-full"
              />

              <ControlledInput<ServiceForm, `fileMounts.${number}.permissions`>
                name={`fileMounts.${index}.permissions`}
                label={<T id="permissionsLabel" />}
                className="w-full"
              />
            </div>

            <Button variant="outline" color="gray" onClick={() => handleRemove(index)} className="self-start">
              <T id="unmount" />
            </Button>
          </div>
        ) : (
          <div key={file.id} className="row items-end gap-4 rounded border p-4">
            <ControlledInput<ServiceForm, `fileMounts.${number}.mountPath`>
              name={`fileMounts.${index}.mountPath`}
              label={<T id="mountPathLabel" />}
              className="w-full"
            />

            <Button variant="outline" color="gray" onClick={() => setExpandedIndex(index)}>
              <T id="showDetailsLabel" />
            </Button>
          </div>
        ),
      )}
    </div>
  );
}
