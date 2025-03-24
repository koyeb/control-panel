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
import { createTranslate } from 'src/intl/translate';
import { getName, hasProperty } from 'src/utils/object';

import { ServiceForm, ServiceVolume } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

const T = createTranslate('modules.serviceForm.volumes');

type VolumeFieldsProps = {
  index: number;
  onRemove: () => void;
  onCreate: () => void;
};

export function VolumeFields({ index, onRemove, onCreate }: VolumeFieldsProps) {
  const t = T.useTranslate();

  const form = useFormContext<ServiceForm>();

  const isMobile = !useBreakpoint('md');
  const showLabel = isMobile || index === 0;

  return (
    // eslint-disable-next-line tailwindcss/no-arbitrary-value
    <div className="grid grid-cols-1 gap-4 rounded border px-6 py-5 md:grid-cols-[1fr_1fr_1fr_auto] md:border-none md:p-0">
      <VolumeField index={index} label={showLabel && <T id="volumeSelector.label" />} onCreate={onCreate} />

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

type VolumeFieldProps = {
  index: number;
  label?: React.ReactNode;
  onCreate: () => void;
};

function VolumeField({ index, label, onCreate }: VolumeFieldProps) {
  const t = T.useTranslate();
  const form = useFormContext<ServiceForm>();

  const [regionId] = useWatchServiceForm('regions');
  const region = useRegion(regionId);

  const items = useVolumeItems();

  return (
    <ControlledSelect<ServiceForm, `volumes.${number}.name`, ServiceVolume | Volume | 'create'>
      name={`volumes.${index}.name`}
      label={label}
      placeholder={t('volumeSelector.placeholder')}
      items={items}
      groups={[
        { key: 'volumes', label: <T id="volumeSelector.volumesSection" />, items },
        { key: 'create', label: <T id="volumeSelector.createSection" />, items: ['create'] },
      ]}
      readOnly={form.watch(`volumes.${index}`).mounted}
      helperText={form.watch(`volumes.${index}`).mounted && <T id="volumeSelector.readOnly" />}
      getKey={(item) => (item === 'create' ? 'create' : getName(item))}
      itemToString={(item) => (item === 'create' ? 'create' : getName(item))}
      itemToValue={(item) => (item === 'create' ? 'create' : getName(item))}
      renderItem={(item) => (item === 'create' ? <T id="volumeSelector.createVolume" /> : getName(item))}
      renderNoItems={() => <T id="volumeSelector.noVolumes" values={{ region: region?.displayName }} />}
      onItemClick={(item) => item === 'create' && onCreate()}
      onChangeEffect={(item) => {
        if (item !== 'create' && 'id' in item) {
          form.setValue(`volumes.${index}.volumeId`, item.id);
        }
      }}
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
