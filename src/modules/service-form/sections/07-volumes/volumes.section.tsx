import { Alert, Button } from '@koyeb/design-system';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { useCatalogInstance, useRegionsCatalog } from 'src/api';
import { openDialog } from 'src/components/dialog';
import { DocumentationLink } from 'src/components/documentation-link';
import { IconPlus } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { ServiceForm, ServiceFormSection as ServiceFormSectionType } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { VolumeFields } from './volume-fields';

const T = createTranslate('modules.serviceForm.volumes');

export function VolumesSection() {
  const volumes = useWatchServiceForm('volumes').filter((volume) => volume.name !== '');

  return (
    <ServiceFormSection
      section="volumes"
      title={<T id="title" />}
      action={<T id="action" />}
      summary={<T id="summary" values={{ count: volumes.length }} />}
      className="col gaps"
    >
      <SectionContent />
    </ServiceFormSection>
  );
}

function SectionContent() {
  const { fields, append, remove } = useFieldArray<ServiceForm, 'volumes'>({ name: 'volumes' });

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
            <VolumeFields
              key={variable.id}
              index={index}
              onCreate={() => openDialog('CreateVolume', { index })}
              onRemove={() => remove(index)}
            />
          ))}
        </div>
      )}

      <div className="col items-start gap-4 sm:row">
        <Button
          variant="ghost"
          color="gray"
          onClick={() => append({ name: '', size: 0, mountPath: '', mounted: false })}
        >
          <IconPlus className="size-4" />
          <T id="addVolume" />
        </Button>
      </div>
    </>
  );
}

function useVolumesUnavailableAlert(): { title: React.ReactNode; description: React.ReactNode } | undefined {
  const { setValue } = useFormContext<ServiceForm>();

  const instance = useCatalogInstance(useWatchServiceForm('instance'));
  const hasScaleToZero = useWatchServiceForm('scaling.min') === 0;
  const hasMultipleInstances = useWatchServiceForm('scaling.max') > 1;

  const regions = useRegionsCatalog(useWatchServiceForm('regions'));
  const hasMultipleRegions = useWatchServiceForm('regions').length > 1;

  const sectionLink = (section: ServiceFormSectionType) => {
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

  if (hasScaleToZero || hasMultipleInstances) {
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
