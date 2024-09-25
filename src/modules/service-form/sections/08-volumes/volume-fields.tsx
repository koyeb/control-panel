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

  const [regionIdentifier] = useWatchServiceForm('regions');
  const region = useRegion(regionIdentifier);

  const serviceId = useWatchServiceForm('meta.serviceId');
  const volumes = useVolumes(regionIdentifier)?.filter(
    (volume) => volume.serviceId === undefined || volume.serviceId === serviceId,
  );

  const formVolumes = useWatchServiceForm('volumes');

  const volumesAndVolumesToCreate = useMemo(() => {
    const volumesToCreate = formVolumes.filter(
      ({ name }) => name !== '' && !volumes?.some(hasProperty('name', name)),
    );

    return [...(volumes ?? []), ...volumesToCreate];
  }, [volumes, formVolumes]);

  const isMobile = !useBreakpoint('md');
  const showLabel = isMobile || index === 0;

  const { setValue } = useFormContext<ServiceForm>();

  return (
    // eslint-disable-next-line tailwindcss/no-arbitrary-value
    <div className="grid grid-cols-1 gap-4 rounded border px-6 py-5 md:grid-cols-[1fr_1fr_1fr_auto] md:border-none md:p-0">
      <ControlledSelect<ServiceForm, `volumes.${number}.name`, ServiceVolume | Volume>
        name={`volumes.${index}.name`}
        label={showLabel && <T id="volumeNameLabel" />}
        placeholder={t('volumeNamePlaceholder')}
        items={volumesAndVolumesToCreate}
        getKey={getName}
        itemToString={getName}
        itemToValue={getName}
        renderItem={getName}
        renderNoItems={() => <T id="noVolumes" values={{ region: region?.displayName }} />}
        onChangeEffect={(volume) => 'id' in volume && setValue(`volumes.${index}.volumeId`, volume.id)}
      />

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
            form.watch('meta.serviceId') && form.watch(`volumes.${index}.name`)
              ? () => notify.warning(t('detachVolumeNotSupported'))
              : onRemove
          }
        >
          <T id="detachVolume" />
        </IconButton>
      </div>
    </div>
  );
}
