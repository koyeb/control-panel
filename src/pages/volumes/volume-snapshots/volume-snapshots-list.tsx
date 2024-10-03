import clsx from 'clsx';
import { useState } from 'react';

import { ButtonMenuItem, Table, useBreakpoint } from '@koyeb/design-system';
import { useVolumes } from 'src/api/hooks/volume';
import { VolumeSnapshot } from 'src/api/model';
import { ActionsMenu } from 'src/components/actions-menu';
import { NoResource } from 'src/components/no-resource';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { VolumeSnapshotStatusBadge } from 'src/components/status-badges';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { Translate } from 'src/intl/translate';
import { hasProperty } from 'src/utils/object';

import { CreateVolumeDialog } from '../create-volume-dialog';

import { DeleteSnapshotDialog } from './delete-snapshot-dialog';

const T = Translate.prefix('pages.volumeSnapshots.list');

export function VolumeSnapshotsList({ snapshots }: { snapshots: VolumeSnapshot[] }) {
  const isMobile = !useBreakpoint('sm');
  const volumes = useVolumes();

  if (snapshots.length === 0) {
    return <NoResource title={<T id="noSnapshots.title" />} description={null} cta={null} />;
  }

  return (
    <Table
      items={snapshots}
      columns={{
        name: {
          header: <T id="name" />,
          render: (snapshots) => snapshots.name,
        },
        volumeName: {
          header: <T id="volumeName" />,
          render: (snapshot) => volumes?.find(hasProperty('id', snapshot.volumeId))?.name,
        },
        status: {
          header: <T id="status" />,
          render: (snapshot) => <VolumeSnapshotStatusBadge status={snapshot.status} />,
        },
        created: {
          className: 'w-48',
          hidden: isMobile,
          header: <T id="created" />,
          render: (snapshot) => <FormattedDistanceToNow value={snapshot.createdAt} />,
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
        type: {
          header: <T id="type" />,
          render: (snapshot) => <T id={`snapshotType.${snapshot.type}`} />,
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
  const [openDialog, setOpenDialog] = useState<'create' | 'delete'>();

  return (
    <>
      <ActionsMenu>
        {(withClose) => (
          <>
            <ButtonMenuItem onClick={withClose(() => setOpenDialog('create'))}>
              <T id="actions.createVolume" />
            </ButtonMenuItem>

            <ButtonMenuItem onClick={withClose(() => setOpenDialog('delete'))}>
              <T id="actions.delete" />
            </ButtonMenuItem>
          </>
        )}
      </ActionsMenu>

      <CreateVolumeDialog
        open={openDialog === 'create'}
        onClose={() => setOpenDialog(undefined)}
        snapshot={snapshot}
      />

      <DeleteSnapshotDialog
        open={openDialog === 'delete'}
        onClose={() => setOpenDialog(undefined)}
        snapshot={snapshot}
      />
    </>
  );
}
