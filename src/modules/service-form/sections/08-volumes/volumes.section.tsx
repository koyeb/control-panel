import { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Alert, Button } from '@koyeb/design-system';
import { useInstance, useRegions } from 'src/api/hooks/catalog';
import { DocumentationLink } from 'src/components/documentation-link';
import { IconPlus } from 'src/components/icons';
import { Translate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { Scaling, ServiceForm, ServiceFormSection as ServiceFormSectionType } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { CreateVolumeDialog } from './create-volume-dialog';
import { VolumeFields } from './volume-fields';

const T = Translate.prefix('serviceForm.volumes');

export function VolumesSection() {
  const volumes = useWatchServiceForm('volumes').filter((volume) => volume.name !== '');

  return (
    <ServiceFormSection
      section="volumes"
      title={<T id="title" values={{ count: volumes.length }} />}
      description={<T id="description" />}
      expandedTitle={<T id="titleExpanded" />}
      className="col gaps"
    >
      <SectionContent />
    </ServiceFormSection>
  );
}

function SectionContent() {
  const { fields, append, remove } = useFieldArray<ServiceForm, 'volumes'>({ name: 'volumes' });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const documentationLink = (children: React.ReactNode) => (
    <DocumentationLink path="/docs/reference/volumes" className="!text-default underline">
      {children}
    </DocumentationLink>
  );

  const alert = useVolumesUnavailableAlert();

  if (alert) {
    return <Alert variant="info" style="outline" title={alert.title} description={alert.description} />;
  }

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

      {fields.length > 0 && (
        <div className="col gap-4">
          {fields.map((variable, index) => (
            <VolumeFields key={variable.id} index={index} onRemove={() => remove(index)} />
          ))}
        </div>
      )}

      <div className="col sm:row items-start gap-4">
        <Button variant="ghost" color="gray" onClick={() => append({ name: '', size: 0, mountPath: '' })}>
          <IconPlus className="size-4" />
          <T id="addVolume" />
        </Button>

        <Button variant="outline" color="gray" onClick={() => setCreateDialogOpen(true)}>
          <T id="createVolume" />
        </Button>
      </div>

      <CreateVolumeDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={(volume, mountPath) => {
          append({ volumeId: volume.id, name: volume.name, size: volume.size, mountPath });
          setCreateDialogOpen(false);
        }}
      />
    </>
  );
}

function useVolumesUnavailableAlert(): { title: React.ReactNode; description: React.ReactNode } | undefined {
  const { setValue } = useFormContext<ServiceForm>();

  const instance = useInstance(useWatchServiceForm('instance.identifier'));
  const hasMultipleInstances = getHasMultipleInstances(useWatchServiceForm('scaling'));

  const regions = useRegions(useWatchServiceForm('regions'));
  const hasMultipleRegions = useWatchServiceForm('regions').length > 1;

  const sectionLink = (section: ServiceFormSectionType) => {
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

function getHasMultipleInstances(scaling: Scaling) {
  if (scaling.type === 'fixed') {
    return scaling.fixed > 1;
  }

  return scaling.autoscaling.max > 1;
}
