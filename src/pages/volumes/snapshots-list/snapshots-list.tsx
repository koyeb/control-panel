import { ButtonMenuItem, Table, Tooltip, useBreakpoint } from '@koyeb/design-system';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';

import { apiQuery, mapSnapshot, useVolume } from 'src/api';
import { ActionsMenu } from 'src/components/actions-menu';
import { openDialog } from 'src/components/dialog';
import { NoResource } from 'src/components/no-resource';
import { Pagination, usePagination } from 'src/components/pagination';
import { QueryGuard } from 'src/components/query-error';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { VolumeSnapshotStatusBadge } from 'src/components/status-badges';
import { Title } from 'src/components/title';
import { useNavigate } from 'src/hooks/router';
import { IconPen, IconPlus, IconTrash } from 'src/icons';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { Translate, createTranslate } from 'src/intl/translate';
import { VolumeSnapshot } from 'src/model';
import { lowerCase } from 'src/utils/strings';

import { DeleteSnapshotDialog } from './delete-snapshot-dialog';
import { EditSnapshotDialog } from './edit-snapshot-dialog';

const T = createTranslate('pages.volumes.snapshotsList');

export function SnapshotsListSection() {
  const pagination = usePagination();

  const query = useQuery({
    ...apiQuery('get /v1/snapshots', { query: pagination.query }),
    placeholderData: keepPreviousData,
    select: ({ snapshots, has_next }) => ({
      snapshots: snapshots!.map(mapSnapshot),
      hasNext: Boolean(has_next),
    }),
  });

  pagination.useSync(query.data);

  return (
    <QueryGuard query={query}>
      {({ snapshots }) => (
        <section className="col gap-4">
          <Title as="h2" title={<T id="title" />} />

          {snapshots.length === 0 && (
            <NoResource
              title={<T id="noSnapshots.title" />}
              description={<T id="noSnapshots.description" />}
              cta={null}
            />
          )}

          {snapshots.length > 0 && <SnapshotsList snapshots={snapshots} />}

          {pagination.hasPages && <Pagination pagination={pagination} />}
        </section>
      )}
    </QueryGuard>
  );
}

function SnapshotsList({ snapshots }: { snapshots: VolumeSnapshot[] }) {
  const lg = !useBreakpoint('lg');

  return (
    <>
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
            hidden: lg,
            header: <T id="region" />,
            render: (volume) => (
              <div className="row items-center gap-2">
                <RegionFlag regionId={volume.region} className="size-4" />
                <RegionName regionId={volume.region} />
              </div>
            ),
          },
          type: {
            header: <T id="type" />,
            className: clsx('w-26'),
            render: (snapshot) => <T id={`snapshotType.${lowerCase(snapshot.type)}`} />,
          },
          volumeName: {
            header: <T id="volumeName" />,
            render: (snapshot) => <VolumeName volumeId={snapshot.volumeId} />,
          },
          created: {
            hidden: lg,
            header: <T id="created" />,
            className: clsx('w-34'),
            render: (snapshot) => <FormattedDistanceToNow value={snapshot.createdAt} />,
          },
          empty: {
            hidden: lg,
            header: null,
            className: clsx('w-26'),
            render: () => null,
          },
          actions: {
            className: clsx('w-[1%]'),
            render: (snapshot) => <Actions snapshot={snapshot} />,
          },
        }}
      />

      <EditSnapshotDialog />
      <DeleteSnapshotDialog />
    </>
  );
}

function VolumeName({ volumeId }: { volumeId: string }) {
  const volume = useVolume(volumeId);

  return <>{volume?.name ?? <Translate id="common.noValue" />}</>;
}

function Actions({ snapshot }: { snapshot: VolumeSnapshot }) {
  const canCreate = snapshot.status === 'AVAILABLE' && snapshot.type === 'REMOTE';
  const navigate = useNavigate();

  return (
    <ActionsMenu>
      {(withClose) => (
        <>
          <Tooltip content={canCreate ? undefined : <T id="actions.cannotCreateVolume" />}>
            {(props) => (
              <ButtonMenuItem
                {...props}
                disabled={!canCreate}
                onClick={withClose(() => {
                  void navigate({ to: '/volumes/new', search: { snapshot: snapshot.id } });
                })}
              >
                <IconPlus className="size-4" />
                <T id="actions.createVolume" />
              </ButtonMenuItem>
            )}
          </Tooltip>

          <ButtonMenuItem onClick={withClose(() => openDialog('EditSnapshot', snapshot))}>
            <IconPen className="size-4" />
            <T id="actions.update" />
          </ButtonMenuItem>

          <ButtonMenuItem onClick={withClose(() => openDialog('ConfirmDeleteSnapshot', snapshot))}>
            <IconTrash className="size-4" />
            <T id="actions.delete" />
          </ButtonMenuItem>
        </>
      )}
    </ActionsMenu>
  );
}
