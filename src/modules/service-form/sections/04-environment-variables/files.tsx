import clsx from 'clsx';
import { useState } from 'react';
import { useFieldArray } from 'react-hook-form';

import { Button, IconButton, useBreakpoint } from '@koyeb/design-system';
import { ControlledInput } from 'src/components/controlled';
import { IconPlus, IconTrash } from 'src/components/icons';
import { Translate } from 'src/intl/translate';

import { ServiceForm } from '../../service-form.types';

import { EditFileContentDialog } from './edit-file-content-dialog';

const T = Translate.prefix('serviceForm.environmentVariables.files');

export function Files() {
  const { fields, append, remove, update } = useFieldArray<ServiceForm, 'fileMounts'>({ name: 'fileMounts' });

  const showLabel = (index: number) => index === 0;
  const isMobile = !useBreakpoint('md');

  const [editContentIndex, setEditContentIndex] = useState<number>();

  const handleRemove = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      update(index, { mountPath: '', permissions: '', content: '' });
    }
  };

  return (
    <>
      {fields.map((file, index) => (
        <div
          key={file.id}
          className="col lg:row items-start gap-4 rounded border p-4 lg:items-end lg:border-none lg:p-0"
        >
          <ControlledInput<ServiceForm, `fileMounts.${number}.mountPath`>
            name={`fileMounts.${index}.mountPath`}
            label={showLabel(index) && <T id="mountPathLabel" />}
          />

          <ControlledInput<ServiceForm, `fileMounts.${number}.permissions`>
            name={`fileMounts.${index}.permissions`}
            label={showLabel(index) && <T id="permissionsLabel" />}
            className="max-w-32"
          />

          <Button variant="outline" color="gray" onClick={() => setEditContentIndex(index)}>
            <T id="editContentLabel" />
          </Button>

          {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
          <div className={clsx(!isMobile && showLabel(index) && 'mt-[1.625rem]')}>
            <IconButton color="gray" Icon={IconTrash} onClick={() => handleRemove(index)}>
              <T id="remove" />
            </IconButton>
          </div>
        </div>
      ))}

      <div>
        <Button
          variant="ghost"
          color="gray"
          onClick={() => append({ mountPath: '', content: '', permissions: '' })}
        >
          <IconPlus className="size-4" />
          <T id="add" />
        </Button>
      </div>

      <EditFileContentDialog index={editContentIndex} onClose={() => setEditContentIndex(undefined)} />
    </>
  );
}
