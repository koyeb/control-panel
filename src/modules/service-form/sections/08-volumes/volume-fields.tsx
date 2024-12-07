import clsx from 'clsx';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { IconButton, useBreakpoint } from '@koyeb/design-system';
import { useRegion } from 'src/api/hooks/catalog';
import { useVolumes } from 'src/api/hooks/volume';
import { Volume } from 'src/api/model';
import { notify } from 'src/application/notify';
import { ControlledInput, ControlledSelect } from 'src/components/controlled';
import { IconUnlink } from 'src/components/icons';
import { Translate } from 'src/intl/translate';
import { getName, hasProperty } from 'src/utils/object';

import { ServiceForm, ServiceVolume } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

const T = Translate.prefix('serviceForm.volumes');

export function VolumeFields({ index, onRemove }: { index: number; onRemove: () => void }) {
  const t = T.useTranslate();

  const form = useFormContext<ServiceForm>();

  const isMobile = !useBreakpoint('md');
  const showLabel = isMobile || index === 0;

  return (
    // eslint-disable-next-line tailwindcss/no-arbitrary-value
    <div className="grid grid-cols-1 gap-4 rounded border px-6 py-5 md:grid-cols-[1fr_1fr_1fr_auto] md:border-none md:p-0">
      <VolumeField index={index} label={showLabel && <T id="volumeNameLabel" />} />

      <ControlledInput<ServiceForm, `volumes.${number}.mountPath`>
        name={`volumes.${index}.mountPath`}
        label={showLabel && <T id="mountPathLabel" />}
      />

      {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
      <div className={clsx(!isMobile && showLabel && 'mt-[1.625rem]')}>
        <IconButton
          color="gray"
          Icon={IconUnlink}
          onClick={
            !form.watch(`volumes.${index}`).mounted
              ? onRemove
              : () => notify.warning(t('detachVolumeNotSupported'))
          }
        >
          <T id="detachVolume" />
        </IconButton>
      </div>
    </div>
  );
}

function VolumeField({ index, label }: { index: number; label?: React.ReactNode }) {
  const t = T.useTranslate();
  const form = useFormContext<ServiceForm>();

  const [regionIdentifier] = useWatchServiceForm('regions');
  const region = useRegion(regionIdentifier);

  const items = useVolumeItems();

  return (
    <ControlledSelect<ServiceForm, `volumes.${number}.name`, ServiceVolume | Volume>
      name={`volumes.${index}.name`}
      label={label}
      placeholder={t('volumeNamePlaceholder')}
      items={items}
      readOnly={form.watch(`volumes.${index}`).mounted}
      helperText={form.watch(`volumes.${index}`).mounted && <T id="mountedReadOnly" />}
      getKey={getName}
      itemToString={getName}
      itemToValue={getName}
      renderItem={getName}
      renderNoItems={() => <T id="noVolumes" values={{ region: region?.displayName }} />}
      onChangeEffect={(volume) => 'id' in volume && form.setValue(`volumes.${index}.volumeId`, volume.id)}
    />
  );
}

function useVolumeItems() {
  const serviceId = useWatchServiceForm('meta.serviceId');
  const [region] = useWatchServiceForm('regions');
  const formVolumes = useWatchServiceForm('volumes');

  const volumes = useVolumes(region)?.filter(
    (volume) => volume.serviceId === undefined || volume.serviceId === serviceId,
  );

  return useMemo(() => {
    const volumesToCreate = formVolumes.filter(
      ({ name }) => name !== '' && !volumes?.some(hasProperty('name', name)),
    );

    return [...(volumes ?? []), ...volumesToCreate];
  }, [volumes, formVolumes]);
}
