import clsx from 'clsx';
import { useState } from 'react';
import { useFieldArray, UseFieldArrayReturn, useFormContext } from 'react-hook-form';

import { Alert, Button } from '@koyeb/design-system';
import { useInstance, useRegions } from 'src/api/hooks/catalog';
import { DocumentationLink } from 'src/components/documentation-link';
import { IconPlus } from 'src/components/icons';
import { Translate } from 'src/intl/translate';

import { ServiceForm, ServiceFormSection } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { CreateVolumeDialog } from './create-volume-dialog';
import { VolumeFields } from './volume-fields.new';

const T = Translate.prefix('serviceForm.mounts.volumes');

export function Volumes() {
  const { fields, append, remove } = useFieldArray<ServiceForm, 'volumes'>({ name: 'volumes' });
  const alert = useVolumesUnavailableAlert();

  return (
    <div className="col gap-2">
      <div className="row items-center justify-between">
        <div>
          <T id="title" />
        </div>

        <Button
          variant="ghost"
          color="gray"
          onClick={() => append({ name: '', size: 0, mountPath: '', mounted: false })}
          className={clsx({ hidden: fields.length === 0 })}
        >
          <IconPlus className="size-4" />
          <T id="addVolume" />
        </Button>
      </div>

      {alert && <Alert variant="info" style="outline" title={alert.title} description={alert.description} />}

      {!alert && (
        <div className="col gap-4 rounded border p-4">
          <VolumesList fields={fields} append={append} remove={remove} />
        </div>
      )}
    </div>
  );
}

type VolumesListProps = Pick<UseFieldArrayReturn<ServiceForm, 'volumes'>, 'fields' | 'append' | 'remove'>;

function VolumesList({ fields, append, remove }: VolumesListProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const documentationLink = (children: React.ReactNode) => (
    <DocumentationLink path="/docs/reference/volumes" className="!text-default underline">
      {children}
    </DocumentationLink>
  );

  return (
    <>
      <Alert
        variant="info"
        style="outline"
        description={<T id="noDowntimeAlert" values={{ documentationLink }} />}
      />

      {fields.length === 0 && (
        <div className="py-4">
          <T id="noVolumesAttached" />
        </div>
      )}

      {fields.map((variable, index) => (
        <VolumeFields
          key={variable.id}
          index={index}
          onCreate={() => setCreateDialogOpen(true)}
          onRemove={() => remove(index)}
        />
      ))}

      <CreateVolumeDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={(volume, mountPath) => {
          append({ volumeId: volume.id, name: volume.name, size: volume.size, mountPath, mounted: false });
          setCreateDialogOpen(false);
        }}
      />
    </>
  );
}

function useVolumesUnavailableAlert(): { title: React.ReactNode; description: React.ReactNode } | undefined {
  const { setValue } = useFormContext<ServiceForm>();

  const instance = useInstance(useWatchServiceForm('instance'));
  const hasMultipleInstances = useWatchServiceForm('scaling.max') > 1;

  const regions = useRegions(useWatchServiceForm('regions'));
  const hasMultipleRegions = useWatchServiceForm('regions').length > 1;

  const sectionLink = (section: ServiceFormSection) => {
    // eslint-disable-next-line react/display-name
    return (children: React.ReactNode) => (
      <button type="button" className="underline" onClick={() => setValue('meta.expandedSection', section)}>
        {children}
      </button>
    );
  };

  const firstUnavailableRegion = regions.find((region) => !region.hasVolumes);

  const values = {
    instanceName: instance?.displayName,
    regionName: firstUnavailableRegion?.displayName,
    instancesLink: sectionLink('instance'),
    regionsLink: sectionLink('regions'),
    scalingLink: sectionLink('scaling'),
    documentationLink: (children: React.ReactNode) => (
      <DocumentationLink path="/docs/reference/volumes" className="!text-default underline">
        {children}
      </DocumentationLink>
    ),
  };

  if (instance && !instance.hasVolumes) {
    return {
      title: <T id="volumesUnavailable.unavailableForInstanceTitle" values={values} />,
      description: <T id="volumesUnavailable.unavailableForInstanceDescription" values={values} />,
    };
  }

  if (hasMultipleInstances) {
    return {
      title: <T id="volumesUnavailable.multipleInstancesTitle" />,
      description: <T id="volumesUnavailable.multipleInstancesDescription" values={values} />,
    };
  }

  if (hasMultipleRegions) {
    return {
      title: <T id="volumesUnavailable.multipleRegionsTitle" />,
      description: <T id="volumesUnavailable.multipleRegionsDescription" values={values} />,
    };
  }

  if (firstUnavailableRegion !== undefined) {
    return {
      title: <T id="volumesUnavailable.unavailableForRegionTitle" values={values} />,
      description: <T id="volumesUnavailable.unavailableForRegionDescription" values={values} />,
    };
  }
}
