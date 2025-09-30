import { ButtonMenuItem, InfoTooltip, Table, useBreakpoint } from '@koyeb/design-system';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';

import { apiQuery, mapSnapshot, mapVolume, useService } from 'src/api';
import { formatBytes } from 'src/application/memory';
import { ActionsMenu } from 'src/components/actions-menu';
import { Dialog } from 'src/components/dialog';
import { LinkButton } from 'src/components/link';
import { NoResource } from 'src/components/no-resource';
import { Pagination, usePagination } from 'src/components/pagination';
import { QueryGuard } from 'src/components/query-error';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { VolumeStatusBadge } from 'src/components/status-badges';
import { Title } from 'src/components/title';
import { IconPen, IconPlus, IconTrash } from 'src/icons';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { Translate, createTranslate } from 'src/intl/translate';
import { Volume } from 'src/model';

import { AttachVolumeButton } from './attach-volume-button';
import { CreateSnapshotDialog } from './create-snapshot-dialog';
import { DeleteVolumeDialog } from './delete-volume-dialog';
import { EditVolumeDialog } from './edit-volume-dialog';

const T = createTranslate('pages.volumes.volumesList');

export function VolumesListSection() {
  const pagination = usePagination();

  const query = useQuery({
    ...apiQuery('get /v1/volumes', { query: pagination.query }),
    placeholderData: keepPreviousData,
    select: ({ volumes, has_next }) => ({
      volumes: volumes!.map(mapVolume),
      hasNext: Boolean(has_next),
    }),
  });

  pagination.useSync(query.data);

  return (
    <QueryGuard query={query}>
      {({ volumes }) => (
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

          {volumes.length === 0 && (
            <NoResource
              title={<T id="noVolumes.title" />}
              description={<T id="noVolumes.description" />}
              cta={
                <LinkButton to="/volumes/new">
                  <T id="noVolumes.cta" />
                </LinkButton>
              }
            />
          )}

          {volumes.length > 0 && <VolumesList volumes={volumes} />}

          {pagination.hasPages && <Pagination pagination={pagination} />}
        </section>
      )}
    </QueryGuard>
  );
}

export function VolumesList({ volumes }: { volumes: Volume[] }) {
  const lg = !useBreakpoint('lg');

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
          hidden: lg,
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
          className: clsx('w-26'),
          render: (volume) => formatBytes(volume.size, { decimal: true }),
        },
        attachedTo: {
          hidden: lg,
          header: <T id="attachedTo" />,
          render: (volume) => <AttachedService serviceId={volume.serviceId} />,
        },
        created: {
          hidden: lg,
          header: <T id="created" />,
          className: clsx('w-34'),
          render: (volume) => <FormattedDistanceToNow value={volume.createdAt} />,
        },
        attach: {
          hidden: lg,
          header: null,
          className: clsx('w-26'),
          render: (volume) => <AttachVolumeButton volume={volume} />,
        },
        actions: {
          className: clsx('w-[1%]'),
          render: (volume) => <Actions volume={volume} />,
        },
      }}
    />
  );
}

function VolumeName({ volume }: { volume: Volume }) {
  const snapshot = useQuery({
    ...apiQuery('get /v1/snapshots/{id}', { path: { id: volume.snapshotId! } }),
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
              <IconPen className="size-4" />
              <T id="actions.edit" />
            </ButtonMenuItem>

            <ButtonMenuItem
              onClick={withClose(() => openDialog('CreateSnapshotFromVolume', { volumeId: volume.id }))}
            >
              <IconPlus className="size-4" />
              <T id="actions.createSnapshot" />
            </ButtonMenuItem>

            <ButtonMenuItem
              onClick={withClose(() => openDialog('ConfirmDeleteVolume', { resourceId: volume.id }))}
            >
              <IconTrash className="size-4" />
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
