import { Button, IconButton, useBreakpoint } from '@koyeb/design-system';
import clsx from 'clsx';
import { useFieldArray } from 'react-hook-form';

import { ControlledInput, ControlledSelect } from 'src/components/controlled';
import { IconTrash, IconPlus } from 'src/components/icons';
import { createTranslate } from 'src/intl/translate';
import { identity } from 'src/utils/generic';
import { upperCase } from 'src/utils/strings';

import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

const T = createTranslate('modules.serviceForm.healthChecks.healthCheck');

type HttpHealthCheckFieldsProps = {
  index: number;
};

export function HttpHealthCheckFields({ index }: HttpHealthCheckFieldsProps) {
  return (
    <>
      <ControlledInput<ServiceForm>
        name={`ports.${index}.healthCheck.path`}
        type="text"
        label={<T id="httpPathLabel" />}
        helpTooltip={<T id="httpPathTooltip" />}
        className="md:col-span-3"
      />

      <ControlledSelect
        name={`ports.${index}.healthCheck.method`}
        label={<T id="httpMethodLabel" />}
        helpTooltip={<T id="httpMethodTooltip" />}
        items={['get', 'head', 'post', 'put', 'delete', 'connect', 'options', 'trace']}
        getKey={identity}
        itemToString={identity}
        itemToValue={identity}
        renderItem={upperCase}
        className="md:col-span-3"
      />

      <HttpHeaders portIndex={index} />
    </>
  );
}

type HttpHeadersProps = {
  portIndex: number;
};

function HttpHeaders({ portIndex }: HttpHeadersProps) {
  const headers = useWatchServiceForm(`ports.${portIndex}.healthCheck.headers`);
  const { fields, append, remove } = useFieldArray<ServiceForm, `ports.${number}.healthCheck.headers`>({
    name: `ports.${portIndex}.healthCheck.headers`,
  });

  if (headers.length === 0) {
    return (
      <div className="md:col-span-6">
        <Button
          variant="ghost"
          color="gray"
          onClick={() => append({ name: '', value: '' })}
          className="self-start"
        >
          <IconPlus className="size-4" />
          <T id="addHeader" />
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 rounded border px-3 py-2 md:col-span-6 md:grid-cols-[1fr_1fr_auto]">
      {fields.map((header, headerIndex) => (
        <HeaderFields key={header.id} portIndex={portIndex} index={headerIndex} onRemove={remove} />
      ))}

      <div className="md:col-span-3">
        <Button
          variant="ghost"
          color="gray"
          onClick={() => append({ name: '', value: '' })}
          className="self-start"
        >
          <IconPlus className="size-4" />
          <T id="addHeader" />
        </Button>
      </div>
    </div>
  );
}

type HeaderFieldsProps = {
  portIndex: number;
  index: number;
  onRemove: () => void;
};

function HeaderFields({ portIndex, index, onRemove }: HeaderFieldsProps) {
  const name = `ports.${portIndex}.healthCheck.headers.${index}`;
  const isMobile = !useBreakpoint('md');
  const showLabel = isMobile || index === 0;

  return (
    <>
      <ControlledInput name={`${name}.name`} label={showLabel && <T id="httpHeaderNameLabel" />} />
      <ControlledInput name={`${name}.value`} label={showLabel && <T id="httpHeaderValueLabel" />} />

      <div className={clsx(!isMobile && showLabel && 'mt-[1.625rem]')}>
        <IconButton color="gray" Icon={IconTrash} onClick={onRemove}>
          <T id="removeHeader" />
        </IconButton>
      </div>
    </>
  );
}
