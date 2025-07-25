import { IconButton, useBreakpoint } from '@koyeb/design-system';
import clsx from 'clsx';
import { useFormContext } from 'react-hook-form';

import { preventDefault } from 'src/application/dom-events';
import { onKeyDownPositiveInteger } from 'src/application/restrict-keys';
import { ControlledInput, ControlledSelect, ControlledSwitch } from 'src/components/controlled';
import { IconTrash } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { identity } from 'src/utils/generic';

import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

const T = createTranslate('modules.serviceForm.ports.old');

type PortFieldsProps = {
  index: number;
  onRemove?: () => void;
};

export function PortFields({ index, onRemove }: PortFieldsProps) {
  const { setValue } = useFormContext<ServiceForm>();
  const port = useWatchServiceForm(`ports.${index}`);

  const isMobile = !useBreakpoint('md');
  const showLabel = isMobile || index === 0;

  return (
    <div
      className={clsx(
        'grid grid-cols-1 gap-4 rounded border px-6 py-5 md:border-none md:p-0',
        'md:grid-cols-[1fr_1fr_1fr_4rem_auto]',
      )}
    >
      <ControlledInput<ServiceForm, `ports.${number}.portNumber`>
        ref={(ref) => ref?.addEventListener('wheel', preventDefault, { passive: false })}
        name={`ports.${index}.portNumber`}
        type="number"
        label={showLabel && <T id="port.label" />}
        onKeyDown={onKeyDownPositiveInteger}
        min={1}
        max={64999}
        step={1}
      />

      <ControlledSelect<ServiceForm, `ports.${number}.protocol`>
        name={`ports.${index}.protocol`}
        label={showLabel && <T id="protocol.label" />}
        items={port.public ? ['http', 'http2'] : ['tcp']}
        getKey={identity}
        itemToString={identity}
        itemToValue={identity}
        renderItem={(type) =>
          ({
            tcp: <T id="protocol.values.tcp" />,
            http: <T id="protocol.values.http" />,
            http2: <T id="protocol.values.http2" />,
          })[type]
        }
      />

      {!port.public && <div />}

      {port.public && (
        <ControlledInput<ServiceForm>
          name={`ports.${index}.path`}
          label={showLabel && <T id="path.label" />}
          helpTooltip={<T id="path.tooltip" values={{ path: port.path }} />}
        />
      )}

      <ControlledSwitch
        name={`ports.${index}.public`}
        label={showLabel && 'Public'}
        onChangeEffect={(event) => {
          if (event.target.checked) {
            setValue(`ports.${index}.protocol`, 'http', { shouldValidate: true });
            setValue(`ports.${index}.path`, '/', { shouldValidate: true });
          } else {
            setValue(`ports.${index}.protocol`, 'tcp', { shouldValidate: true });
            setValue(`ports.${index}.path`, '', { shouldValidate: true });
          }
        }}
      />

      <div className={clsx(!isMobile && showLabel && 'mt-[1.625rem]')}>
        <IconButton color="gray" Icon={IconTrash} disabled={onRemove === undefined} onClick={onRemove}>
          <T id="deletePort" />
        </IconButton>
      </div>
    </div>
  );
}
