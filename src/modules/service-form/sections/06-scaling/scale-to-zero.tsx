import { Badge, Button, InputEnd } from '@koyeb/design-system';
import { useFormContext, useFormState } from 'react-hook-form';

import { useInstance } from 'src/api/hooks/catalog';
import { useOrganization } from 'src/api/hooks/session';
import { ControlledCheckbox, ControlledInput } from 'src/components/controlled';
import { DocumentationLink } from 'src/components/documentation-link';
import { LinkButton } from 'src/components/link';
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
  const { watch } = useFormContext<ServiceForm>();
  const instance = useInstance(watch('instance'));
  const isGpu = instance?.category === 'gpu';

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
      <IdlePeriod disabled={disabled} />
      <LightSleep disabled={disabled || isGpu} isGpu={isGpu} />
    </ScalingConfigSection>
  );
}

function ScaleToZeroFooter({ isEcoInstance, hasVolumes }: { isEcoInstance: boolean; hasVolumes: boolean }) {
  const organization = useOrganization();
  const { watch, setValue } = useFormContext<ServiceForm>();

  if (isEcoInstance) {
    const onClick = () => setValue('meta.expandedSection', 'instance');

    const cta = (
      <Button variant="outline" color="gray" size={1} onClick={onClick} className="bg-neutral">
        <T id="disabled.ecoInstance.cta" />
      </Button>
    );

    return <ScalingConfigSectionFooter text={<T id="disabled.ecoInstance.text" />} cta={cta} />;
  }

  if (hasVolumes) {
    return <ScalingConfigSectionFooter text={<T id="disabled.hasVolumes.text" />} />;
  }

  if (watch('scaling.min') === 0 && organization.plan === 'starter') {
    const cta = (
      <LinkButton to="/settings/plans" variant="outline" color="gray" size={1} className="bg-neutral">
        <T id="disabled.starterPlan.cta" />
      </LinkButton>
    );

    return <ScalingConfigSectionFooter text={<T id="disabled.starterPlan.text" />} cta={cta} />;
  }

  return null;
}

function IdlePeriod({ disabled }: { disabled: boolean }) {
  const organization = useOrganization();

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
          disabled={disabled || organization.plan === 'starter'}
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

function LightSleep({ disabled, isGpu }: { disabled: boolean; isGpu: boolean }) {
  const organization = useOrganization();

  const { watch, trigger } = useFormContext<ServiceForm>();
  const { errors } = useFormState<ServiceForm>();
  const error = errors.scaling?.scaleToZero?.lightSleep?.value?.message;

  return (
    <ScalingConfigValue
      disabled={disabled}
      label={
        <div className="row items-center gap-2">
          <ControlledCheckbox<ServiceForm>
            name="scaling.scaleToZero.lightSleep.enabled"
            label={<T id="lightSleep.label" />}
            disabled={disabled}
            onChangeEffect={() => trigger('scaling.scaleToZero')}
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
          disabled={!watch('scaling.scaleToZero.lightSleep.enabled') || organization.plan === 'starter'}
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
