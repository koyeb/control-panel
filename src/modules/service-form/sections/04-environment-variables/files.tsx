import clsx from 'clsx';
import { useState } from 'react';
import { useFieldArray } from 'react-hook-form';

import { Button, IconButton } from '@koyeb/design-system';
import { ControlledInput } from 'src/components/controlled';
import { IconPlus, IconTrash } from 'src/components/icons';
import { Translate } from 'src/intl/translate';

import { ServiceForm } from '../../service-form.types';

import { FileContentEditor } from './file-content-editor';

const T = Translate.prefix('serviceForm.files');

export function Files() {
  const t = T.useTranslate();
  const { fields, append, remove } = useFieldArray<ServiceForm, 'fileMounts'>({ name: 'fileMounts' });

  const [expandedIndex, setExpandedIndex] = useState<number>();
  const isExpanded = (index: number) => index === expandedIndex;

  return (
    <div className="col gap-2">
      {fields.length === 0 && (
        <div className="row items-center justify-between gap-4 rounded-md border p-3">
          <p>
            <T id="description" />
          </p>

          <Button
            variant="outline"
            color="gray"
            onClick={() => append({ mountPath: '', content: '' })}
            className="self-center"
          >
            <IconPlus className="size-4" />
            <T id="add" />
          </Button>
        </div>
      )}

      {fields.map((file, index) =>
        isExpanded(index) ? (
          <div key={file.id} className="col gap-4 rounded-md border p-4">
            <FileContentEditor index={index} />

            <div className="row items-end gap-4">
              <ControlledInput<ServiceForm, `fileMounts.${number}.mountPath`>
                name={`fileMounts.${index}.mountPath`}
                label={<T id="mountPath.label" />}
                placeholder={t('mountPath.placeholder')}
                className="w-full"
              />
            </div>

            <Button variant="outline" color="gray" onClick={() => remove(index)} className="self-start">
              <T id="remove" />
            </Button>
          </div>
        ) : (
          <div key={file.id} className="row items-end gap-4 rounded-md border p-4">
            <ControlledInput<ServiceForm, `fileMounts.${number}.content`>
              name={`fileMounts.${index}.content`}
              label={<T id="content.label" />}
              placeholder={t('content.placeholder')}
              onFocus={() => setExpandedIndex(index)}
              className="flex-1"
              inputClassName="truncate"
            />

            <ControlledInput<ServiceForm, `fileMounts.${number}.mountPath`>
              name={`fileMounts.${index}.mountPath`}
              label={<T id="mountPath.label" />}
              placeholder={t('mountPath.placeholder')}
              className="flex-1"
            />

            <IconButton color="gray" Icon={IconTrash} onClick={() => remove(index)}>
              <T id="remove" />
            </IconButton>
          </div>
        ),
      )}

      <div className="row items-center justify-between">
        <Button
          variant="ghost"
          color="gray"
          onClick={() => append({ mountPath: '', content: '' })}
          className={clsx({ hidden: fields.length === 0 })}
        >
          <IconPlus className="size-4" />
          <T id="add" />
        </Button>
      </div>
    </div>
  );
}
