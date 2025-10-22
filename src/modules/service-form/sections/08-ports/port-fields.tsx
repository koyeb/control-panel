import { Badge, IconButton } from '@koyeb/design-system';
import { useFormContext } from 'react-hook-form';

import { preventDefault } from 'src/application/dom-events';
import { onKeyDownPositiveInteger } from 'src/application/restrict-keys';
import { ControlledCheckbox, ControlledInput, ControlledSelect } from 'src/components/forms';
import { IconTrash } from 'src/icons';
import { TranslateEnum, createTranslate } from 'src/intl/translate';
import { identity } from 'src/utils/generic';

import { ServiceForm } from '../../service-form.types';

const T = createTranslate('modules.serviceForm.ports');

export function PortFields({ index, onRemove }: { index: number; onRemove?: () => void }) {
  const { setValue, watch } = useFormContext<ServiceForm>();

  return (
    <div className="col gap-6 rounded-md bg-muted/50 p-3">
      <div className="row items-center justify-between gap-4">
        <div className="row min-w-0 items-center gap-2">
          <div className="text-base font-medium">{watch(`ports.${index}.portNumber`) || ''}</div>

          <div className="text-dim">
            <TranslateEnum enum="portProtocol" value={watch(`ports.${index}.protocol`)} />
          </div>

          {watch(`ports.${index}.public`) && (
            <Badge size={1} color="blue" className="truncate">
              <T id="badges.public" />
            </Badge>
          )}

          {watch(`ports.${index}.tcpProxy`) && (
            <Badge size={1} color="blue" className="truncate">
              <T id="badges.tcpProxy" />
            </Badge>
          )}
        </div>

        {onRemove && <IconButton Icon={IconTrash} variant="ghost" size={1} color="gray" onClick={onRemove} />}
      </div>

      <div className="row gap-4">
        <ControlledInput<ServiceForm, `ports.${number}.portNumber`>
          ref={(ref) => ref?.addEventListener('wheel', preventDefault, { passive: false })}
          name={`ports.${index}.portNumber`}
          label={<T id="portNumber.label" />}
          type="number"
          onKeyDown={onKeyDownPositiveInteger}
          min={1}
          max={64999}
          step={1}
          className="flex-1"
        />

        <ControlledSelect<ServiceForm, `ports.${number}.protocol`>
          name={`ports.${index}.protocol`}
          label={<T id="protocol.label" />}
          items={['http', 'http2', 'tcp']}
          getKey={identity}
          itemToString={identity}
          itemToValue={identity}
          renderItem={(value) => <TranslateEnum enum="portProtocol" value={value} />}
          onChangeEffect={(protocol) => {
            if (protocol === 'tcp') {
              setValue(`ports.${index}.public`, false);
            }
          }}
          className="flex-1"
        />
      </div>

      <div className="col gap-2">
        <div className="col gap-2 sm:row sm:items-center">
          <ControlledCheckbox<ServiceForm, `ports.${number}.public`>
            name={`ports.${index}.public`}
            label={<T id="http.label" />}
            disabled={watch(`ports.${index}.protocol`) === 'tcp'}
            className="whitespace-nowrap"
          />

          <div className="text-xs text-dim">
            <T id="http.description" />
          </div>
        </div>

        {watch(`ports.${index}.public`) && (
          <div className="col gap-4 rounded-lg bg-muted px-3 py-4">
            <ControlledInput<ServiceForm, `ports.${number}.path`>
              label={<T id="path.label" />}
              name={`ports.${index}.path`}
              className="grid grid-cols-[auto_1fr] items-center! gap-x-2"
            />

            <div className="text-xs text-dim">
              <T id="path.helperText" values={{ url: url(watch(`ports.${index}.path`)) }} />
            </div>
          </div>
        )}

        {watch(`ports.${index}.protocol`) === 'tcp' && (
          <Badge size={1} color="orange" className="self-start text-start">
            <T id="http.disabled" />
          </Badge>
        )}
      </div>

      <div className="col gap-2">
        <div className="col gap-2 sm:row sm:items-center">
          <ControlledCheckbox<ServiceForm, `ports.${number}.tcpProxy`>
            name={`ports.${index}.tcpProxy`}
            label={<T id="tcpProxy.label" />}
            className="whitespace-nowrap"
          />
          <div className="text-xs text-dim">
            <T id="tcpProxy.description" />
          </div>
        </div>

        <div className="text-xs text-dim">
          <T id="tcpProxy.info" />
        </div>
      </div>
    </div>
  );
}

function url(path: string) {
  return <span className="text-default">https://[subdomain].koyeb.app{path}</span>;
}
