import { Badge, InputEnd } from '@koyeb/design-system';
import { useFormContext, useFormState } from 'react-hook-form';

import { useInstance } from 'src/api/hooks/catalog';
import { ControlledCheckbox, ControlledInput } from 'src/components/controlled';
import { DocumentationLink } from 'src/components/documentation-link';
import { createTranslate } from 'src/intl/translate';

import { ServiceForm } from '../../service-form.types';

import { ScalingConfigValue } from './components/scaling-config-value';
import { ScalingConfigSection, ScalingConfigSectionFooter } from './components/scaling-section';

const T = createTranslate('modules.serviceForm.scaling.scaleToZero');

type ScaleToZeroConfigurationProps = {
  disabled: boolean;
  isEcoInstance: boolean;
  hasVolumes: boolean;
};

export function ScaleToZeroConfiguration({
  disabled,
  isEcoInstance,
  hasVolumes,
}: ScaleToZeroConfigurationProps) {
  const { errors } = useFormState<ServiceForm>();

  const hasError = [
    errors.scaling?.scaleToZero?.deepSleep?.message,
    errors.scaling?.scaleToZero?.lightSleep?.value?.message,
  ].some(Boolean);

  return (
    <ScalingConfigSection
      title={<T id="title" />}
      footer={<ScaleToZeroFooter isEcoInstance={isEcoInstance} hasVolumes={hasVolumes} />}
      hasError={hasError}
    >
      <DeepSleep disabled={disabled} />
      <LightSleep disabled={disabled} />
    </ScalingConfigSection>
  );
}

function ScaleToZeroFooter({ isEcoInstance, hasVolumes }: { isEcoInstance: boolean; hasVolumes: boolean }) {
  const { setValue } = useFormContext<ServiceForm>();

  if (isEcoInstance) {
    return (
      <ScalingConfigSectionFooter
        text={<T id="disabled.ecoInstance.text" />}
        cta={{
          text: <T id="disabled.ecoInstance.cta" />,
          onClick: () => setValue('meta.expandedSection', 'instance'),
        }}
      />
    );
  }

  if (hasVolumes) {
    return <ScalingConfigSectionFooter text={<T id="disabled.hasVolumes.text" />} />;
  }

  return null;
}

function DeepSleep({ disabled }: { disabled: boolean }) {
  const { errors } = useFormState<ServiceForm>();
  const error = errors.scaling?.scaleToZero?.deepSleep?.message;

  return (
    <ScalingConfigValue
      disabled={disabled}
      label={<T id="deepSleep.label" />}
      description={<T id="deepSleep.description" />}
      error={error}
      padding={false}
      input={
        <ControlledInput<ServiceForm>
          name="scaling.scaleToZero.deepSleep"
          type="number"
          disabled={disabled}
          error={false}
          end={
            <InputEnd>
              <T id="lightSleep.unit" />
            </InputEnd>
          }
          className="max-w-24"
        />
      }
    />
  );
}

function LightSleep({ disabled }: { disabled: boolean }) {
  const { watch } = useFormContext<ServiceForm>();
  const { errors } = useFormState<ServiceForm>();
  const error = errors.scaling?.scaleToZero?.lightSleep?.value?.message;

  const instance = useInstance(watch('instance'));
  const isGpu = instance?.category === 'gpu';

  return (
    <ScalingConfigValue
      disabled={disabled || isGpu}
      label={
        <div className="row items-center gap-2">
          <ControlledCheckbox<ServiceForm>
            name="scaling.scaleToZero.lightSleep.enabled"
            label={<T id="lightSleep.label" />}
            disabled={disabled || isGpu}
          />

          {isGpu && (
            <Badge size={1} color="blue">
              <T id="lightSleep.disabledGpu" />
            </Badge>
          )}
        </div>
      }
      description={
        <T
          id="lightSleep.description"
          values={{
            light: (children) => (
              <DocumentationLink path="/docs/run-and-scale/scale-to-zero#idle-period">
                {children}
              </DocumentationLink>
            ),
            deep: (children) => (
              <DocumentationLink path="/docs/run-and-scale/scale-to-zero">{children}</DocumentationLink>
            ),
            value: watch('scaling.scaleToZero.lightSleep.value'),
          }}
        />
      }
      error={error}
      input={
        <ControlledInput<ServiceForm>
          name="scaling.scaleToZero.lightSleep.value"
          type="number"
          disabled={disabled || isGpu}
          error={false}
          end={
            <InputEnd>
              <T id="lightSleep.unit" />
            </InputEnd>
          }
          className="max-w-24"
        />
      }
    />
  );
}
