import { ButtonMenuItem, InfoTooltip, Table, useBreakpoint } from '@koyeb/design-system';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';

import { useService } from 'src/api/hooks/service';
import { mapSnapshot } from 'src/api/mappers/volume';
import { Volume } from 'src/api/model';
import { useApiQueryFn } from 'src/api/use-api';
import { formatBytes } from 'src/application/memory';
import { ActionsMenu } from 'src/components/actions-menu';
import { Dialog } from 'src/components/dialog';
import { LinkButton } from 'src/components/link';
import { NoResource } from 'src/components/no-resource';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { VolumeStatusBadge } from 'src/components/status-badges';
import { Title } from 'src/components/title';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { Translate, createTranslate } from 'src/intl/translate';

import { CreateSnapshotDialog } from './create-snapshot-dialog';
import { DeleteVolumeDialog } from './delete-volume-dialog';
import { EditVolumeDialog } from './edit-volume-dialog';

const T = createTranslate('pages.volumes.volumesList');

export function VolumesListSection({ volumes }: { volumes: Volume[] }) {
  return (
    <section className="col gap-4">
      <Title
        as="h2"
        title={<T id="header.title" />}
        end={
          volumes.length > 0 && (
            <LinkButton to="/volumes/new">
              <T id="header.createVolume" />
            </LinkButton>
          )
        }
      />

      <VolumesList volumes={volumes} />
    </section>
  );
}

export function VolumesList({ volumes }: { volumes: Volume[] }) {
  const isMobile = !useBreakpoint('sm');

  if (volumes.length === 0) {
    return (
      <NoResource
        title={<T id="noVolumes.title" />}
        description={<T id="noVolumes.description" />}
        cta={
          <LinkButton to="/volumes/new">
            <T id="noVolumes.cta" />
          </LinkButton>
        }
      />
    );
  }

  return (
    <Table
      items={volumes}
      columns={{
        name: {
          header: <T id="name" />,
          render: (volume) => <VolumeName volume={volume} />,
        },
        status: {
          header: <T id="status" />,
          render: (volume) => <VolumeStatusBadge status={volume.status} />,
        },
        region: {
          hidden: isMobile,
          header: <T id="region" />,
          render: (volume) => (
            <div className="row items-center gap-2">
              <RegionFlag regionId={volume.region} className="size-4" />
              <RegionName regionId={volume.region} />
            </div>
          ),
        },
        size: {
          header: <T id="size" />,
          render: (volume) => formatBytes(volume.size, { decimal: true }),
        },
        attachedTo: {
          hidden: isMobile,
          header: <T id="attachedTo" />,
          render: (volume) => <AttachedService serviceId={volume.serviceId} />,
        },
        created: {
          className: 'w-48',
          hidden: isMobile,
          header: <T id="created" />,
          render: (volume) => <FormattedDistanceToNow value={volume.createdAt} />,
        },
        actions: {
          className: clsx('w-12'),
          render: (volume) => <Actions volume={volume} />,
        },
      }}
    />
  );
}

function VolumeName({ volume }: { volume: Volume }) {
  const snapshot = useQuery({
    ...useApiQueryFn('getSnapshot', { path: { id: volume.snapshotId! } }),
    enabled: volume.snapshotId !== undefined,
    select: ({ snapshot }) => mapSnapshot(snapshot!),
  });

  return (
    <div className="row items-center gap-2">
      {volume.name}
      {snapshot.isSuccess && (
        <InfoTooltip content={<T id="parentSnapshot" values={{ name: snapshot.data.name }} />} />
      )}
    </div>
  );
}

function AttachedService({ serviceId }: { serviceId?: string }) {
  // todo: fetch all services with a single query (to avoid the n+1 select problem)
  const service = useService(serviceId);

  if (serviceId === undefined) {
    return <Translate id="common.noValue" />;
  }

  if (!service) {
    return null;
  }

  return (
    <LinkButton to="/services/$serviceId" params={{ serviceId }} variant="outline" color="gray" size={1}>
      <ServiceTypeIcon type={service.type} size="small" />
      {service.name}
    </LinkButton>
  );
}

function Actions({ volume }: { volume: Volume }) {
  const openDialog = Dialog.useOpen();

  return (
    <>
      <ActionsMenu>
        {(withClose) => (
          <>
            <ButtonMenuItem onClick={withClose(() => openDialog('EditVolume', { volumeId: volume.id }))}>
              <T id="actions.edit" />
            </ButtonMenuItem>

            <ButtonMenuItem
              onClick={withClose(() => openDialog('CreateSnapshotFromVolume', { volumeId: volume.id }))}
            >
              <T id="actions.createSnapshot" />
            </ButtonMenuItem>

            <ButtonMenuItem
              onClick={withClose(() => openDialog('ConfirmDeleteVolume', { resourceId: volume.id }))}
            >
              <T id="actions.delete" />
            </ButtonMenuItem>
          </>
        )}
      </ActionsMenu>

      <EditVolumeDialog volume={volume} />
      <CreateSnapshotDialog volume={volume} />
      <DeleteVolumeDialog volume={volume} />
    </>
  );
}
