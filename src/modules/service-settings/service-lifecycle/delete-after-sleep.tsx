import { UseFormReturn } from 'react-hook-form';

import { onKeyDownPositiveInteger } from 'src/application/restrict-keys';
import { ControlledInput, ControlledSelect, ControlledSwitch } from 'src/components/forms';
import { TranslateEnum, createTranslate } from 'src/intl/translate';
import { TimeUnit } from 'src/utils/date';
import { identity } from 'src/utils/generic';

import { ServiceLifecycleFormType } from './service-lifecycle-form';

const T = createTranslate('pages.service.settings.lifecycle.deleteAfterSleep');

export function DeleteAfterSleep({ form }: { form: UseFormReturn<ServiceLifecycleFormType> }) {
  const t = T.useTranslate();
  const enabled = form.watch('deleteAfterSleep.enabled');

  return (
    <div className="row items-start gap-4 rounded-md border px-3 py-2">
      <div className="col flex-1 gap-3">
        <div className="col gap-1.5">
          <div className="text-xs/5 font-medium">
            <T id="label" />
          </div>

          {enabled && (
            <div className="text-xs text-dim">
              <T id="description" />
            </div>
          )}
        </div>

        {enabled && (
          <div className="row gap-2">
            <ControlledInput
              control={form.control}
              name="deleteAfterSleep.value"
              type="number"
              size={1}
              placeholder={t('placeholder')}
              onKeyDown={onKeyDownPositiveInteger}
              className="max-w-48"
            />

            <ControlledSelect
              control={form.control}
              name="deleteAfterSleep.unit"
              size={1}
              items={['seconds', 'minutes', 'hours', 'days'] satisfies TimeUnit[]}
              getValue={identity}
              renderItem={(item) => <TranslateEnum enum="timeUnit" value={item} />}
              onChangeEffect={() => void form.trigger('deleteAfterSleep.value')}
              className="w-32"
            />
          </div>
        )}
      </div>

      <ControlledSwitch
        control={form.control}
        name="deleteAfterSleep.enabled"
        onChangeEffect={(event) => !event.target.checked && form.setValue('deleteAfterSleep.value', NaN)}
      />
    </div>
  );
}
