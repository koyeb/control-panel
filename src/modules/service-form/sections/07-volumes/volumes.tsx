import { Alert, Button, InfoTooltip } from '@koyeb/design-system';
import clsx from 'clsx';
import { useFieldArray, UseFieldArrayReturn, useFormContext } from 'react-hook-form';

import { useInstance, useRegions } from 'src/api/hooks/catalog';
import { Dialog } from 'src/components/dialog';
import { DocumentationLink } from 'src/components/documentation-link';
import { IconPlus } from 'src/components/icons';
import { createTranslate } from 'src/intl/translate';

import { ServiceForm, ServiceFormSection } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { CreateVolumeDialog } from './create-volume-dialog';
import { VolumeFields } from './volume-fields.new';

const T = createTranslate('modules.serviceForm.volumes');

// this was implemented when working on file mounts
// todo: integrate it into the form
export function Volumes() {
  const { fields, append, remove } = useFieldArray<ServiceForm, 'volumes'>({ name: 'volumes' });
  const alert = useVolumesUnavailableAlert();

  return (
    <div className="col gap-2">
      <div className="row items-center justify-between">
        <div className="row items-center gap-1">
          <T id="title" />
          <InfoTooltip content="?" />
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
      {!alert && <VolumesList fields={fields} append={append} remove={remove} />}
    </div>
  );
}

type VolumesListProps = Pick<UseFieldArrayReturn<ServiceForm, 'volumes'>, 'fields' | 'append' | 'remove'>;

function VolumesList({ fields, append, remove }: VolumesListProps) {
  const openDialog = Dialog.useOpen();

  const documentationLink = (children: React.ReactNode) => (
    <DocumentationLink path="/docs/reference/volumes" className="whitespace-nowrap !text-default underline">
      {children}
    </DocumentationLink>
  );

  return (
    <>
      {fields.length === 0 && (
        <div className="row items-center justify-between gap-4 rounded-md border p-3">
          <p>
            <T id="noDowntimeAlert" values={{ documentationLink }} />
          </p>

          <Button
            variant="outline"
            color="gray"
            onClick={() => append({ name: '', size: 0, mountPath: '', mounted: false })}
            className="self-center"
          >
            <IconPlus className="size-4" />
            <T id="addVolume" />
          </Button>
        </div>
      )}

      {fields.map((variable, index) => (
        <VolumeFields
          key={variable.id}
          index={index}
          onCreate={() => openDialog('CreateVolume', { index })}
          onRemove={() => remove(index)}
        />
      ))}

      <CreateVolumeDialog />
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

  const firstUnavailableRegion = regions.find((region) => !region.volumesEnabled);

  const values = {
    instanceName: instance?.displayName,
    regionName: firstUnavailableRegion?.name,
    instancesLink: sectionLink('instance'),
    scalingLink: sectionLink('scaling'),
    documentationLink: (children: React.ReactNode) => (
      <DocumentationLink path="/docs/reference/volumes" className="!text-default underline">
        {children}
      </DocumentationLink>
    ),
  };

  if (instance && !instance.volumesEnabled) {
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
