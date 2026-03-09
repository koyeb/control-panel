import { Badge, Button, IconButton } from '@koyeb/design-system';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { preventDefault } from 'src/application/dom-events';
import { onKeyDownPositiveInteger } from 'src/application/restrict-keys';
import { ControlledCheckbox, ControlledInput, ControlledSelect } from 'src/components/forms';
import { FeatureFlag } from 'src/hooks/feature-flag';
import { IconPlus, IconTrash } from 'src/icons';
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
          getValue={identity}
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

      <FeatureFlag feature="protected-endpoints">
        <SecurityPolicies index={index} />
      </FeatureFlag>
    </div>
  );
}

function url(path: string) {
  return <span className="text-default">https://[subdomain].koyeb.app{path}</span>;
}

function SecurityPolicies({ index: portIndex }: { index: number }) {
  type Prefix = `ports.${number}.securityPolicies.${number}`;
  const prefix = (index: number): Prefix => `ports.${portIndex}.securityPolicies.${index}`;

  const { watch } = useFormContext<ServiceForm>();

  const { fields, append, remove } = useFieldArray<ServiceForm, `ports.${number}.securityPolicies`>({
    name: `ports.${portIndex}.securityPolicies`,
  });

  return (
    <div className="col gap-4">
      {fields.map((field, index) => (
        <div key={field.id} className="row items-center gap-4">
          <ControlledSelect<ServiceForm, `${Prefix}.type`>
            items={['apiKey', 'basicAuth']}
            name={`${prefix(index)}.type`}
            label={<T id="securityPolicy.type" />}
            getKey={identity}
            getValue={identity}
            itemToString={identity}
            renderItem={(value) => <TranslateEnum enum="portSecurityPolicyType" value={value} />}
            className="min-w-32"
          />

          {watch(`${prefix(index)}.type`) === 'apiKey' && (
            <ControlledInput<ServiceForm, `${Prefix}.key`>
              name={`${prefix(index)}.key`}
              label={<T id="securityPolicy.key" />}
              type="password"
              autoComplete="one-time-code"
              className="flex-1"
            />
          )}

          {watch(`${prefix(index)}.type`) === 'basicAuth' && (
            <>
              <ControlledInput<ServiceForm, `${Prefix}.username`>
                name={`${prefix(index)}.username`}
                label={<T id="securityPolicy.username" />}
                className="flex-1"
              />

              <ControlledInput<ServiceForm, `${Prefix}.password`>
                name={`${prefix(index)}.password`}
                label={<T id="securityPolicy.password" />}
                type="password"
                autoComplete="one-time-code"
                className="flex-1"
              />
            </>
          )}

          <IconButton color="gray" Icon={IconTrash} onClick={() => remove(index)} className="mt-6.5" />
        </div>
      ))}

      <Button color="gray" onClick={() => append({ type: 'apiKey', key: '' })} className="self-start">
        <IconPlus className="size-4" />
        <T id="securityPolicy.add" />
      </Button>
    </div>
  );
}
