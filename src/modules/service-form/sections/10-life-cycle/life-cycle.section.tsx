import { InputEnd } from '@koyeb/design-system';
import { useIntl } from 'react-intl';

import { OverridableInput } from 'src/components/overridable-input';
import { createTranslate } from 'src/intl/translate';
import { formatSecondsDuration } from 'src/utils/date';

import { ServiceFormSection } from '../../components/service-form-section';
import { getDeepSleepValue, getLightSleepValue } from '../../helpers/scaling-rules';
import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { LifeCycleAlerts } from './life-cycle-alerts';

const T = createTranslate('modules.serviceForm.lifeCycle');

export function LifeCycleSection() {
  const t = T.useTranslate();

  const deleteAfterCreateHelperText = useDeleteAfterCreateHelperText();
  const deleteAfterSleepHelperText = useDeleteAfterSleepHelperText();

  return (
    <ServiceFormSection
      section="lifeCycle"
      title={<T id="title" />}
      action={<T id="action" />}
      summary={<Summary />}
      className="col gaps"
    >
      <p>
        <T id="info" />
      </p>

      <LifeCycleAlerts />

      <OverridableInput<ServiceForm, 'lifeCycle.deleteAfterCreate'>
        name="lifeCycle.deleteAfterCreate"
        type="number"
        label={<T id="deleteAfterCreate.label" />}
        tooltip={<T id="deleteAfterCreate.tooltip" />}
        placeholder={t('deleteAfterCreate.placeholder')}
        helperText={deleteAfterCreateHelperText}
        end={
          <InputEnd>
            <T id="deleteAfterCreate.unit" />
          </InputEnd>
        }
        className="max-w-xs"
      />

      <OverridableInput<ServiceForm, 'lifeCycle.deleteAfterSleep'>
        name="lifeCycle.deleteAfterSleep"
        type="number"
        label={<T id="deleteAfterSleep.label" />}
        tooltip={<T id="deleteAfterSleep.tooltip" />}
        placeholder={t('deleteAfterSleep.placeholder')}
        helperText={deleteAfterSleepHelperText}
        end={
          <InputEnd>
            <T id="deleteAfterSleep.unit" />
          </InputEnd>
        }
        className="max-w-xs"
      />
    </ServiceFormSection>
  );
}

function Summary() {
  const intl = useIntl();
  const lifeCycle = useWatchServiceForm('lifeCycle');

  if (lifeCycle.deleteAfterCreate === null && lifeCycle.deleteAfterSleep === null) {
    return <T id="summary.default" />;
  }

  const deleteAfter = lifeCycle.deleteAfterCreate !== null && (
    <T
      key="deleteAfter"
      id="summary.deleteAfter"
      values={{ deleteAfter: formatSecondsDuration(lifeCycle.deleteAfterCreate) }}
    />
  );

  const deleteAfterSleep = lifeCycle.deleteAfterSleep !== null && (
    <T
      key="deleteAfterSleep"
      id="summary.deleteAfterSleep"
      values={{ deleteAfterSleep: formatSecondsDuration(lifeCycle.deleteAfterSleep) }}
    />
  );

  return (
    <T
      id="summary.custom"
      values={{ details: intl.formatList([deleteAfter, deleteAfterSleep].filter(Boolean), { type: 'unit' }) }}
    />
  );
}

function useDeleteAfterCreateHelperText() {
  const value = useWatchServiceForm('lifeCycle.deleteAfterCreate');
  const min = useWatchServiceForm('scaling.min');
  const scaleToZero = useWatchServiceForm('scaling.scaleToZero');
  const deepSleepValue = getDeepSleepValue(scaleToZero);
  const lightSleepValue = getLightSleepValue(scaleToZero);

  if (value === null || Number.isNaN(value) || min > 0) {
    return null;
  }

  if (value < Math.min(lightSleepValue ?? Infinity, deepSleepValue)) {
    return (
      <span className="text-orange">
        <T id="deleteAfterCreate.helperText" />
      </span>
    );
  }
}

function useDeleteAfterSleepHelperText() {
  const value = useWatchServiceForm('lifeCycle.deleteAfterSleep');
  const min = useWatchServiceForm('scaling.min');
  const scaleToZero = useWatchServiceForm('scaling.scaleToZero');
  const deepSleepValue = getDeepSleepValue(scaleToZero);

  if (value === null || Number.isNaN(value) || min > 0) {
    return null;
  }

  if (value < deepSleepValue) {
    return (
      <span className="text-orange">
        <T id="deleteAfterSleep.helperText" />
      </span>
    );
  }
}
