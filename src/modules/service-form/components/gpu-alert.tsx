import { Alert } from '@koyeb/design-system';
import { useFormContext } from 'react-hook-form';

import { useInstancesCatalog, useOrganization } from 'src/api';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { createTranslate } from 'src/intl/translate';
import { hasProperty } from 'src/utils/object';

import { ServiceForm } from '../service-form.types';

const T = createTranslate('modules.serviceForm');

export function GpuAlert() {
  const organization = useOrganization();
  const instances = useInstancesCatalog();
  const { setValue } = useFormContext<ServiceForm>();

  const expandGpu = () => {
    const instance = instances.find(hasProperty('category', 'gpu'));

    setValue('meta.expandedSection', 'instance');
    setValue('instance', instance?.id ?? null);
  };

  if (!useFeatureFlag('gpu')) {
    return null;
  }

  if (organization?.plan === 'hobby') {
    return (
      <div className="rounded-md border p-4">
        <T
          id="gpuAlertHobby"
          values={{
            upgrade: (children) => (
              <a href="/settings/plans" className="font-semibold">
                {children}
              </a>
            ),
          }}
        />
      </div>
    );
  }

  return (
    <Alert
      icon={false}
      description={
        <T
          id="gpuAlert"
          values={{
            cta: (children) => (
              <button type="button" onClick={expandGpu} className="underline">
                {children}
              </button>
            ),
          }}
        />
      }
    />
  );
}
