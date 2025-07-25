import { IconButton, useBreakpoint } from '@koyeb/design-system';
import clsx from 'clsx';
import { useFormContext } from 'react-hook-form';

import { ControlledInput } from 'src/components/controlled';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { IconTrash } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

import { ServiceForm } from '../../service-form.types';

import { EnvironmentVariableValueField } from './environment-variable-value-field';
import { RegionsScope } from './regions-scope';

const T = createTranslate('modules.serviceForm.environmentVariables');

type EnvironmentVariableFieldsProps = {
  index: number;
  onRemove: () => void;
  onCreateSecret: () => void;
};

export function EnvironmentVariableFields({
  index,
  onRemove,
  onCreateSecret,
}: EnvironmentVariableFieldsProps) {
  const { trigger } = useFormContext<ServiceForm>();

  const isMobile = !useBreakpoint('md');
  const showLabel = isMobile || index === 0;

  const showScopes = useFeatureFlag('environment-variable-scopes');

  return (
    <div
      className={clsx(
        'grid grid-cols-1 gap-4 rounded border px-6 py-5 md:border-none md:p-0',
        showScopes ? 'md:grid-cols-[1fr_1fr_1fr_auto]' : 'md:grid-cols-[1fr_1fr_auto]',
      )}
    >
      {showScopes && <RegionsScope index={index} label={showLabel && 'Regions'} className="w-full" />}

      <ControlledInput<ServiceForm>
        name={`environmentVariables.${index}.name`}
        type="text"
        label={showLabel && <T id="nameLabel" />}
        onChangeEffect={() => void trigger(`environmentVariables.${index}.value`)}
        className="w-full"
      />

      <EnvironmentVariableValueField
        index={index}
        onCreateSecret={onCreateSecret}
        label={showLabel && <T id="valueLabel" />}
      />

      <div className={clsx(!isMobile && showLabel && 'mt-[1.625rem]')}>
        <IconButton color="gray" Icon={IconTrash} onClick={onRemove}>
          <T id="deleteVariable" />
        </IconButton>
      </div>
    </div>
  );
}
