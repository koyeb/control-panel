import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';

import { Button, ButtonMenuItem, InfoTooltip, Table, useBreakpoint } from '@koyeb/design-system';
import { useService } from 'src/api/hooks/service';
import { mapSnapshot } from 'src/api/mappers/volume';
import { Volume } from 'src/api/model';
import { useApiQueryFn } from 'src/api/use-api';
import { formatBytes } from 'src/application/memory';
import { routes } from 'src/application/routes';
import { ActionsMenu } from 'src/components/actions-menu';
import { LinkButton } from 'src/components/link';
import { NoResource } from 'src/components/no-resource';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { VolumeStatusBadge } from 'src/components/status-badges';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { createTranslate, Translate } from 'src/intl/translate';

import { CreateSnapshotDialog } from './create-snapshot-dialog';
import { DeleteVolumeDialog } from './delete-volume-dialog';
import { EditVolumeDialog } from './edit-volume-dialog';

const T = createTranslate('pages.volumes.volumesList');

export function VolumesList({ volumes, onCreate }: { volumes: Volume[]; onCreate: () => void }) {
  const isMobile = !useBreakpoint('sm');

  if (volumes.length === 0) {
    return (
      <NoResource
        title={<T id="noVolumes.title" />}
        description={<T id="noVolumes.description" />}
        cta={
          <Button onClick={onCreate}>
            <T id="noVolumes.cta" />
          </Button>
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
              <RegionFlag identifier={volume.region} className="size-4 rounded-full shadow-badge" />
              <RegionName identifier={volume.region} />
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
    <LinkButton href={routes.service.overview(service.id)} variant="outline" color="gray" size={1}>
      <ServiceTypeIcon type={service.type} size="small" />
      {service.name}
    </LinkButton>
  );
}

function Actions({ volume }: { volume: Volume }) {
  const [openDialog, setOpenDialog] = useState<'edit' | 'createSnapshot' | 'delete'>();
  const snapshots = useFeatureFlag('snapshots');

  return (
    <>
      <ActionsMenu>
        {(withClose) => (
          <>
            <ButtonMenuItem onClick={withClose(() => setOpenDialog('edit'))}>
              <T id="actions.edit" />
            </ButtonMenuItem>

            {snapshots && (
              <ButtonMenuItem onClick={withClose(() => setOpenDialog('createSnapshot'))}>
                <T id="actions.createSnapshot" />
              </ButtonMenuItem>
            )}

            <ButtonMenuItem onClick={withClose(() => setOpenDialog('delete'))}>
              <T id="actions.delete" />
            </ButtonMenuItem>
          </>
        )}
      </ActionsMenu>

      <EditVolumeDialog
        open={openDialog === 'edit'}
        onClose={() => setOpenDialog(undefined)}
        volume={volume}
      />

      <CreateSnapshotDialog
        open={openDialog === 'createSnapshot'}
        onClose={() => setOpenDialog(undefined)}
        volume={volume}
      />

      <DeleteVolumeDialog
        open={openDialog === 'delete'}
        onClose={() => setOpenDialog(undefined)}
        volume={volume}
      />
    </>
  );
}
