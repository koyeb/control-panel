import clsx from 'clsx';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Button, Collapse, IconButton } from '@koyeb/design-system';
import { preventDefault } from 'src/application/dom-events';
import { onKeyDownPositiveInteger } from 'src/application/restrict-keys';
import { ControlledInput, ControlledSelect, ControlledSwitch } from 'src/components/controlled';
import { IconCircleCheck, IconCircleOff, IconGlobe, IconNetwork, IconTrash } from 'src/components/icons';
import { createTranslate } from 'src/intl/translate';
import { identity } from 'src/utils/generic';
import { capitalize } from 'src/utils/strings';

import { ServiceForm } from '../../service-form.types';

const T = createTranslate('modules.serviceForm.ports');

type PortFieldsProps = {
  index: number;
  canRemove: boolean;
  onRemove: () => void;
};

export function PortFields({ index, canRemove, onRemove }: PortFieldsProps) {
  const [configure, setConfigure] = useState(false);
  const { watch, setValue } = useFormContext<ServiceForm>();

  const prefix = `ports.${index}` as const;

  return (
    <div className="rounded border">
      <div className="row items-start gap-4 p-3">
        <ControlledInput<ServiceForm, `ports.${number}.portNumber`>
          ref={(ref) => ref?.addEventListener('wheel', preventDefault, { passive: false })}
          name={`${prefix}.portNumber`}
          label={<T id="port.label" />}
          labelPosition="left"
          type="number"
          onKeyDown={onKeyDownPositiveInteger}
          min={1}
          max={64999}
          step={1}
          className="flex-1"
        />

        <ControlledSelect<ServiceForm, `ports.${number}.protocol`>
          name={`${prefix}.protocol`}
          label={<T id="protocol.label" />}
          labelPosition="left"
          items={['http', 'http2', 'tcp']}
          getKey={identity}
          itemToString={identity}
          itemToValue={identity}
          renderItem={(type) =>
            ({
              http: <T id="protocol.values.http" />,
              http2: <T id="protocol.values.http2" />,
              tcp: <T id="protocol.values.tcp" />,
            })[type]
          }
          onChangeEffect={(protocol) => {
            if (protocol === 'tcp') {
              setValue(`${prefix}.public`, false);
            }
          }}
          className="flex-1"
        />

        <IconButton color="gray" Icon={IconTrash} disabled={!canRemove} onClick={onRemove}>
          <T id="deletePort" />
        </IconButton>
      </div>

      <footer className={clsx('row items-center gap-4 bg-muted px-3 py-2', !configure && 'rounded-b')}>
        <ProtocolEnabled protocol="http" enabled={watch(`ports.${index}.public`)} />
        <ProtocolEnabled protocol="tcp" enabled={watch(`ports.${index}.proxy`)} />

        <Button
          color="gray"
          variant="outline"
          onClick={() => setConfigure(!configure)}
          className="ml-auto bg-neutral hover:bg-neutral"
        >
          <T id={configure ? 'close' : 'configure'} />
        </Button>
      </footer>

      <Collapse open={configure}>
        <div className="col gap-4 p-3">
          <PublicConfiguration index={index} />
          <TcpProxyConfiguration index={index} />
        </div>
      </Collapse>
    </div>
  );
}

function ProtocolEnabled({ protocol, enabled }: { protocol: 'http' | 'tcp'; enabled: boolean }) {
  const Icon = enabled ? IconCircleCheck : IconCircleOff;

  return (
    <div className={clsx('row items-center gap-1', enabled ? 'text-green' : 'text-dim')}>
      <Icon className="size-4" />
      <T id={`public${capitalize(protocol)}.${enabled ? 'enabled' : 'disabled'}`} />
    </div>
  );
}

function PublicConfiguration({ index }: { index: number }) {
  const { watch } = useFormContext<ServiceForm>();
  const prefix = `ports.${index}` as const;

  const url = <span className="text-default">https://[subdomain].koyeb.app{watch(`${prefix}.path`)}</span>;

  return (
    <div className="col gap-2">
      <div className="row items-center gap-2">
        <div>
          <IconGlobe className="size-4" />
        </div>

        <div className="col md:row gap-1 md:items-center md:gap-2">
          <div className="whitespace-nowrap">
            <T id="public.title" />
          </div>

          <div className="text-xs text-dim">
            <T id="public.description" />
          </div>
        </div>

        <div className="ml-auto">
          <ControlledSwitch
            name={`${prefix}.public`}
            labelPosition="left"
            label={<T id="public.label" />}
            disabled={watch(`${prefix}.protocol`) === 'tcp'}
          />
        </div>
      </div>

      <div>
        {watch(`${prefix}.protocol`) !== 'tcp' && (
          <ControlledInput
            name={`${prefix}.path`}
            label="Path"
            labelPosition="left"
            disabled={!watch(`${prefix}.public`)}
            helperText={watch(`${prefix}.public`) ? <T id="public.helperText" values={{ url }} /> : undefined}
          />
        )}

        {watch(`${prefix}.protocol`) === 'tcp' && (
          <div className="rounded bg-orange/10 px-2 py-1 text-orange">
            <T id="public.disabledTcp" />
          </div>
        )}
      </div>
    </div>
  );
}

function TcpProxyConfiguration({ index }: { index: number }) {
  const prefix = `ports.${index}` as const;

  return (
    <div className="col gap-2">
      <div className="row items-center gap-2">
        <div>
          <IconNetwork className="size-4" />
        </div>

        <div className="col md:row gap-1 md:items-center md:gap-2">
          <div className="whitespace-nowrap">
            <T id="tcpProxy.title" />
          </div>

          <div className="text-xs text-dim">
            <T id="tcpProxy.description" />
          </div>
        </div>

        <div className="ml-auto">
          <ControlledSwitch name={`${prefix}.proxy`} labelPosition="left" label={<T id="tcpProxy.label" />} />
        </div>
      </div>

      <div className="text-xs text-dim">
        <T id="tcpProxy.helperText" />
      </div>
    </div>
  );
}
