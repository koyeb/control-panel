import clsx from 'clsx';

import { ButtonMenuItem, Table, Tooltip, useBreakpoint } from '@koyeb/design-system';
import { useVolumes } from 'src/api/hooks/volume';
import { VolumeSnapshot } from 'src/api/model';
import { ActionsMenu } from 'src/components/actions-menu';
import { Dialog } from 'src/components/dialog';
import { NoResource } from 'src/components/no-resource';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { VolumeSnapshotStatusBadge } from 'src/components/status-badges';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { createTranslate } from 'src/intl/translate';
import { hasProperty } from 'src/utils/object';

import { CreateVolumeDialog } from '../create-volume-dialog';

import { DeleteSnapshotDialog } from './delete-snapshot-dialog';
import { UpdateSnapshotDialog } from './update-snapshot-dialog';

const T = createTranslate('pages.volumeSnapshots.list');

export function VolumeSnapshotsList({ snapshots }: { snapshots: VolumeSnapshot[] }) {
  const isMobile = !useBreakpoint('sm');
  const volumes = useVolumes();

  if (snapshots.length === 0) {
    return (
      <NoResource
        title={<T id="noSnapshots.title" />}
        description={<T id="noSnapshots.description" />}
        cta={null}
      />
    );
  }

  return (
    <Table
      items={snapshots}
      columns={{
        name: {
          header: <T id="name" />,
          render: (snapshots) => snapshots.name,
        },
        status: {
          header: <T id="status" />,
          render: (snapshot) => <VolumeSnapshotStatusBadge status={snapshot.status} />,
        },
        region: {
          hidden: isMobile,
          header: <T id="region" />,
          render: (volume) => (
            <div className="row items-center gap-2">
              <RegionFlag identifier={volume.region} className="size-4" />
              <RegionName identifier={volume.region} />
            </div>
          ),
        },
        type: {
          header: <T id="type" />,
          render: (snapshot) => <T id={`snapshotType.${snapshot.type}`} />,
        },
        volumeName: {
          header: <T id="volumeName" />,
          render: (snapshot) => volumes?.find(hasProperty('id', snapshot.volumeId))?.name,
        },
        created: {
          className: 'w-48',
          hidden: isMobile,
          header: <T id="created" />,
          render: (snapshot) => <FormattedDistanceToNow value={snapshot.createdAt} />,
        },
        actions: {
          className: clsx('w-12'),
          render: (snapshot) => <Actions snapshot={snapshot} />,
        },
      }}
    />
  );
}

function Actions({ snapshot }: { snapshot: VolumeSnapshot }) {
  const canCreate = snapshot.status === 'available' && snapshot.type === 'remote';
  const openDialog = Dialog.useOpen();

  return (
    <>
      <ActionsMenu>
        {(withClose) => (
          <>
            <Tooltip content={canCreate ? undefined : <T id="actions.cannotCreateVolume" />}>
              {(props) => (
                <ButtonMenuItem
                  {...props}
                  disabled={!canCreate}
                  onClick={withClose(() => openDialog('CreateVolume'))}
                >
                  <T id="actions.createVolume" />
                </ButtonMenuItem>
              )}
            </Tooltip>

            <ButtonMenuItem onClick={withClose(() => openDialog(`UpdateSnapshot-${snapshot.id}`))}>
              <T id="actions.update" />
            </ButtonMenuItem>

            <ButtonMenuItem onClick={withClose(() => openDialog(`ConfirmDeleteSnapshot-${snapshot.id}`))}>
              <T id="actions.delete" />
            </ButtonMenuItem>
          </>
        )}
      </ActionsMenu>

      <CreateVolumeDialog snapshot={snapshot} />
      <UpdateSnapshotDialog snapshot={snapshot} />
      <DeleteSnapshotDialog snapshot={snapshot} />
    </>
  );
}
