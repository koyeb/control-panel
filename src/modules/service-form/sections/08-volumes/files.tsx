import clsx from 'clsx';
import { useState } from 'react';
import { useFieldArray } from 'react-hook-form';

import { Button, InfoTooltip } from '@koyeb/design-system';
import { ControlledInput } from 'src/components/controlled';
import { IconPlus } from 'src/components/icons';
import { Translate } from 'src/intl/translate';

import { ServiceForm } from '../../service-form.types';

import { FileContentEditor } from './file-content-editor';

const T = Translate.prefix('serviceForm.mounts.files');

export function Files() {
  const { fields, append, remove } = useFieldArray<ServiceForm, 'fileMounts'>({ name: 'fileMounts' });

  const [expandedIndex, setExpandedIndex] = useState<number>();
  const isExpanded = (index: number) => index === expandedIndex;

  return (
    <div className="col gap-2">
      <div className="row items-center justify-between">
        <div className="row items-center gap-1">
          <T id="title" />
          <InfoTooltip content="?" />
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

      {fields.length === 0 && (
        <div className="row items-center justify-between gap-4 rounded-md border p-3">
          <p>Seamlessly mount runtime files with dynamic interpolation and secure permissions</p>

          <Button
            variant="outline"
            color="gray"
            onClick={() => append({ mountPath: '', content: '', permissions: '' })}
            className="self-center"
          >
            <IconPlus className="size-4" />
            <T id="add" />
          </Button>
        </div>
      )}

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

            <Button variant="outline" color="gray" onClick={() => remove(index)} className="self-start">
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
