import { useFormContext } from 'react-hook-form';

import { IconButton } from '@koyeb/design-system';
import { preventDefault } from 'src/application/dom-events';
import { onKeyDownPositiveInteger } from 'src/application/restrict-keys';
import { ControlledInput, ControlledSelect, ControlledSwitch } from 'src/components/controlled';
import { IconGlobe, IconNetwork, IconTrash } from 'src/components/icons';
import { createTranslate } from 'src/intl/translate';
import { identity } from 'src/utils/generic';

import { ServiceForm } from '../../service-form.types';

const T = createTranslate('modules.serviceForm.ports');

type PortFieldsProps = {
  index: number;
  canRemove: boolean;
  onRemove: () => void;
};

export function PortFields({ index, canRemove, onRemove }: PortFieldsProps) {
  const { setValue } = useFormContext<ServiceForm>();
  const prefix = `ports.${index}` as const;

  return (
    <div className="col gap-4 rounded border px-2 py-3">
      <div className="row items-start gap-2 sm:gap-4">
        <ControlledInput<ServiceForm, `ports.${number}.portNumber`>
          ref={(ref) => ref?.addEventListener('wheel', preventDefault, { passive: false })}
          name={`${prefix}.portNumber`}
          label={<T id="port.label" />}
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

        <IconButton color="gray" Icon={IconTrash} disabled={!canRemove} onClick={onRemove} className="mt-6">
          <T id="deletePort" />
        </IconButton>
      </div>

      <div className="col gap-4 sm:gap-2">
        <PublicConfiguration index={index} />
        <TcpProxyConfiguration index={index} />
      </div>
    </div>
  );
}

function PublicConfiguration({ index }: { index: number }) {
  const { watch } = useFormContext<ServiceForm>();
  const prefix = `ports.${index}` as const;

  return (
    <div className="col gap-2 border-l-2 pl-3">
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
            disabled={!watch(`${prefix}.public`)}
            helperText={
              watch(`${prefix}.public`) ? (
                <T
                  id="public.helperText"
                  values={{
                    url: (
                      <span className="text-default">
                        https://[subdomain].koyeb.app{watch(`${prefix}.path`)}
                      </span>
                    ),
                  }}
                />
              ) : undefined
            }
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
    <div className="col gap-2 border-l-2 pl-4">
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
