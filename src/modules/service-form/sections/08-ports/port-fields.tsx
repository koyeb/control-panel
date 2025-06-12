import clsx from 'clsx';
import { useFormContext } from 'react-hook-form';

import { IconButton, useBreakpoint } from '@koyeb/design-system';
import { preventDefault } from 'src/application/dom-events';
import { onKeyDownPositiveInteger } from 'src/application/restrict-keys';
import { ControlledInput, ControlledSelect, ControlledSwitch } from 'src/components/controlled';
import { IconTrash } from 'src/components/icons';
import { FeatureFlag, useFeatureFlag } from 'src/hooks/feature-flag';
import { createTranslate } from 'src/intl/translate';
import { identity } from 'src/utils/generic';

import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

const T = createTranslate('modules.serviceForm.ports');

type PortFieldsProps = {
  index: number;
  canRemove: boolean;
  onRemove: () => void;
};

export function PortFields({ index, canRemove, onRemove }: PortFieldsProps) {
  const { setValue } = useFormContext<ServiceForm>();
  const port = useWatchServiceForm(`ports.${index}`);

  const isMobile = !useBreakpoint('md');
  const showLabel = isMobile || index === 0;

  const hasProxyPorts = useFeatureFlag('proxy-ports');

  return (
    <div
      // eslint-disable-next-line tailwindcss/no-arbitrary-value
      className={clsx(
        'grid grid-cols-1 gap-4 rounded border px-6 py-5 md:border-none md:p-0',
        hasProxyPorts ? 'md:grid-cols-[1fr_1fr_1fr_4rem_4rem_auto]' : 'md:grid-cols-[1fr_1fr_1fr_4rem_auto]',
      )}
    >
      <ControlledInput<ServiceForm, `ports.${number}.portNumber`>
        ref={(ref) => ref?.addEventListener('wheel', preventDefault, { passive: false })}
        name={`ports.${index}.portNumber`}
        type="number"
        label={showLabel && <T id="portLabel" />}
        onKeyDown={onKeyDownPositiveInteger}
        min={1}
        max={64999}
        step={1}
      />

      <ControlledSelect<ServiceForm, `ports.${number}.protocol`>
        name={`ports.${index}.protocol`}
        label={showLabel && <T id="protocolLabel" />}
        items={port.public ? ['http', 'http2'] : ['tcp']}
        getKey={identity}
        itemToString={identity}
        itemToValue={identity}
        renderItem={(type) =>
          ({
            tcp: <T id="tcp" />,
            http: <T id="http" />,
            http2: <T id="http2" />,
          })[type]
        }
      />

      {!port.public && <div />}

      {port.public && (
        <ControlledInput<ServiceForm>
          name={`ports.${index}.path`}
          label={showLabel && <T id="pathLabel" />}
          helpTooltip={<T id="pathTooltip" values={{ path: port.path }} />}
        />
      )}

      <ControlledSwitch
        name={`ports.${index}.public`}
        label={showLabel && <T id="publicLabel" />}
        helpTooltip={<T id="publicTooltip" />}
        onChangeEffect={(event) => {
          if (event.target.checked) {
            setValue(`ports.${index}.protocol`, 'http', { shouldValidate: true });
            setValue(`ports.${index}.path`, '/', { shouldValidate: true });
            setValue(`ports.${index}.proxy`, false, { shouldValidate: true });
          } else {
            setValue(`ports.${index}.protocol`, 'tcp', { shouldValidate: true });
            setValue(`ports.${index}.path`, '', { shouldValidate: true });
          }
        }}
      />

      <FeatureFlag feature="proxy-ports">
        <ControlledSwitch
          name={`ports.${index}.proxy`}
          label={showLabel && <T id="proxyLabel" />}
          helpTooltip={<T id="proxyTooltip" />}
          disabled={port.public}
        />
      </FeatureFlag>

      {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
      <div className={clsx(!isMobile && showLabel && 'mt-[1.625rem]')}>
        <IconButton color="gray" Icon={IconTrash} disabled={!canRemove} onClick={onRemove}>
          <T id="deletePort" />
        </IconButton>
      </div>
    </div>
  );
}
