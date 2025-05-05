import isEqual from 'lodash-es/isEqual';
import { useFormContext } from 'react-hook-form';

import { Button, Input, InputEnd } from '@koyeb/design-system';
import { onKeyDownPositiveInteger } from 'src/application/restrict-keys';
import { ControlledInput, ControlledSelect } from 'src/components/controlled';
import { IconRefresh } from 'src/components/icons';
import { createTranslate } from 'src/intl/translate';
import { identity } from 'src/utils/generic';

import { defaultHealthCheck } from '../../helpers/initialize-service-form';
import { HealthCheck, Port, ServiceForm } from '../../service-form.types';

import { HealthCheckProtocol } from './health-check-protocol';
import { HttpHealthCheckFields } from './http-health-check-fields';

const T = createTranslate('modules.serviceForm.healthChecks.healthCheck');

type HealthCheckFieldsProps = {
  port: Port;
  index: number;
};

export function HealthCheckFields({ port, index }: HealthCheckFieldsProps) {
  const { trigger, setValue } = useFormContext<ServiceForm>();
  const healthCheck = port.healthCheck;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
      <Input readOnly label={<T id="portNumberLabel" />} value={port.portNumber} />

      <ControlledSelect<ServiceForm, `ports.${number}.healthCheck.protocol`>
        name={`ports.${index}.healthCheck.protocol`}
        label={<T id="protocolLabel" />}
        items={['tcp', 'http']}
        getKey={identity}
        itemToString={identity}
        itemToValue={identity}
        renderItem={(protocol) => <HealthCheckProtocol protocol={protocol} />}
        onChangeEffect={() => void trigger(`ports.${index}.healthCheck.path`)}
      />

      <ControlledInput
        name={`ports.${index}.healthCheck.gracePeriod`}
        type="number"
        label={<T id="gracePeriodLabel" />}
        helpTooltip={<T id="gracePeriodTooltip" />}
        onKeyDown={onKeyDownPositiveInteger}
        min={5}
        max={15 * 60}
        end={
          <InputEnd>
            <T id="gracePeriodUnit" />
          </InputEnd>
        }
      />

      <ControlledInput
        name={`ports.${index}.healthCheck.interval`}
        type="number"
        label={<T id="intervalLabel" />}
        helpTooltip={<T id="intervalTooltip" />}
        onKeyDown={onKeyDownPositiveInteger}
        min={3}
        max={5 * 60}
        end={
          <InputEnd>
            <T id="intervalUnit" />
          </InputEnd>
        }
      />

      <ControlledInput
        name={`ports.${index}.healthCheck.restartLimit`}
        type="number"
        label={<T id="restartLimitLabel" />}
        helpTooltip={<T id="restartLimitTooltip" />}
        min={1}
        max={10}
        onKeyDown={onKeyDownPositiveInteger}
      />

      <ControlledInput
        name={`ports.${index}.healthCheck.timeout`}
        type="number"
        label={<T id="timeoutLabel" />}
        helpTooltip={<T id="timeoutTooltip" />}
        onKeyDown={onKeyDownPositiveInteger}
        min={1}
        max={10 * 60}
        end={
          <InputEnd>
            <T id="timeoutUnit" />
          </InputEnd>
        }
      />

      {healthCheck.protocol === 'http' && <HttpHealthCheckFields index={index} />}

      <div className="md:col-span-6">
        <Button
          variant="ghost"
          color="gray"
          disabled={isDefaultHealthCheck(port.healthCheck)}
          onClick={() =>
            setValue(`ports.${index}.healthCheck`, defaultHealthCheck(), { shouldValidate: true })
          }
        >
          <IconRefresh className="size-4" />
          <T id="defaultValues" />
        </Button>
      </div>
    </div>
  );
}

function isDefaultHealthCheck(healthCheck: HealthCheck) {
  return isEqual(healthCheck, defaultHealthCheck());
}
