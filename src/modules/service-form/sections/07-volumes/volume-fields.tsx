import { Dropdown, IconButton, Menu, MenuItem, useBreakpoint } from '@koyeb/design-system';
import clsx from 'clsx';
import { useMemo } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { useCatalogRegion, useVolumes } from 'src/api';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/forms';
import { Select } from 'src/components/forms/select';
import { IconUnlink } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { hasProperty } from 'src/utils/object';

import { ServiceForm } from '../../service-form.types';
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
    <div className="grid grid-cols-1 gap-4 rounded border px-6 py-5 md:grid-cols-[1fr_1fr_1fr_auto] md:border-none md:p-0">
      <VolumeField index={index} label={showLabel && <T id="volumeSelector.label" />} onCreate={onCreate} />

      <ControlledInput<ServiceForm, `volumes.${number}.mountPath`>
        name={`volumes.${index}.mountPath`}
        label={showLabel && <T id="mountPathLabel" />}
      />

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
  const region = useCatalogRegion(regionId);

  const items = useVolumeItems();

  const { field, fieldState } = useController<ServiceForm, `volumes.${number}.name`>({
    name: `volumes.${index}.name`,
  });

  return (
    <Select
      {...field}
      placeholder={t('volumeSelector.placeholder')}
      label={label}
      invalid={fieldState.invalid}
      helperText={fieldState.error?.message}
      items={[...items, 'create' as const]}
      value={items.find(hasProperty('name', field.value)) ?? null}
      onChange={(item) => {
        if (item === 'create') {
          return onCreate();
        }

        field.onChange(item.name);

        if ('id' in item) {
          form.setValue(`volumes.${index}.volumeId`, item.id);
        }
      }}
      renderItem={(item) => item !== 'create' && item.name}
      menu={({ select, dropdown }) => (
        <Dropdown dropdown={dropdown}>
          <Menu {...select.getMenuProps()}>
            <li className="py-1 text-dim">
              <T id="volumeSelector.volumesSection" />
            </li>

            {items.map((item, index) => (
              <MenuItem
                {...select.getItemProps({ item, index })}
                key={index}
                highlighted={index === select.highlightedIndex}
              >
                {item.name}
              </MenuItem>
            ))}

            {items.length === 0 && (
              <li className="p-1">
                <T id="volumeSelector.noVolumes" values={{ region: region?.name }} />
              </li>
            )}

            <li className="py-1 text-dim">
              <T id="volumeSelector.createSection" />
            </li>

            <MenuItem
              {...select.getItemProps({ item: 'create', index: items.length })}
              key={index}
              highlighted={select.highlightedIndex === items.length}
            >
              <T id="volumeSelector.createVolume" />
            </MenuItem>
          </Menu>
        </Dropdown>
      )}
      className="min-w-64"
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
