import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { AccordionSection, Badge, Button } from '@koyeb/design-system';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { useInstancesQuery, useRegionalDeployment } from 'src/api';
import { isInstanceRunning } from 'src/application/service-functions';
import { InstanceLogs } from 'src/components/logs';
import { Metadata } from 'src/components/metadata';
import { QueryGuard } from 'src/components/query-error';
import { RegionFlag } from 'src/components/region-flag';
import { InstanceStatusBadge } from 'src/components/status-badges';
import { InstanceStatusDot } from 'src/components/status-dot';
import { StatusesSelector } from 'src/components/statuses-selector';
import { IconChevronRight } from 'src/icons';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { Translate, createTranslate, translateStatus } from 'src/intl/translate';
import { ComputeDeployment, Instance, InstanceStatus, Replica } from 'src/model';
import { shortId } from 'src/utils/strings';

import { ReplicaCpu, ReplicaMemory } from './replica-metadata';

const T = createTranslate('modules.deployment.deploymentLogs.scaling.drawer');

const MotionFloatingOverlay = motion.create(FloatingOverlay);

type ReplicaDrawerProps = {
  deployment: ComputeDeployment;
  replica: Replica;
  metrics?: { cpu?: number; memory?: number };
  open: boolean;
  onClose: () => void;
};

export function ReplicaDrawer({ deployment, replica, metrics, open, onClose }: ReplicaDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} className="col gap-6 p-6">
      <Header replica={replica} onClose={onClose} />
      <ReplicaStats replica={replica} metrics={metrics} />
      <NoActiveInstance replica={replica} />
      <InstanceHistory deployment={deployment} replica={replica} />
    </Drawer>
  );
}

function Header({ replica, onClose }: { replica: Replica; onClose: () => void }) {
  return (
    <div className="row items-center gap-2">
      <RegionFlag regionId={replica.region} className="size-5" />

      <div className="text-2xl font-medium">
        <T id="title" values={{ index: replica.index }} />
      </div>

      <Button color="gray" size={3} onClick={onClose} className="ms-auto">
        <Translate id="common.close" />
      </Button>
    </div>
  );
}

type ReplicaStatsProps = {
  replica: Replica;
  metrics?: { cpu?: number; memory?: number };
};

function ReplicaStats({ replica, metrics }: ReplicaStatsProps) {
  if (!replica.instanceId || !replica.status) {
    return null;
  }

  const instanceId = <span className="font-medium">{shortId(replica.instanceId)}</span>;

  return (
    <div className="row flex-wrap gap-x-12 gap-y-3 rounded-md border px-3 py-2">
      <Metadata label={<T id="activeInstance" />} value={instanceId} />

      <Metadata label={<T id="status" />} value={<InstanceStatusBadge status={replica.status} />} />

      {metrics?.cpu !== undefined && (
        <Metadata label={<T id="cpu" />} value={<ReplicaCpu value={metrics.cpu} />} />
      )}

      {metrics?.memory !== undefined && (
        <Metadata label={<T id="memory" />} value={<ReplicaMemory value={metrics.memory} />} />
      )}
    </div>
  );
}

function NoActiveInstance({ replica }: { replica: Replica }) {
  if (replica.instanceId === undefined) {
    return (
      <div className="rounded-lg border p-3 text-xs text-dim">
        <T id="noActiveInstance" />
      </div>
    );
  }

  return null;
}

const allStatuses: InstanceStatus[] = [
  'ALLOCATING',
  'STARTING',
  'HEALTHY',
  'UNHEALTHY',
  'STOPPING',
  'STOPPED',
  'ERROR',
  'SLEEPING',
];

type InstanceHistoryProps = {
  deployment: ComputeDeployment;
  replica: Replica;
};

function InstanceHistory({ deployment, replica }: InstanceHistoryProps) {
  const [expanded, setExpanded] = useState<Instance>();

  const [statuses, setStatuses] = useState(allStatuses);
  const regionalDeployment = useRegionalDeployment(deployment.id, replica.region);

  const query = useInstancesQuery({
    deploymentId: deployment.id,
    replicaIndex: replica.index,
    regionalDeploymentId: regionalDeployment?.id,
    statuses,
  });

  return (
    <div className="col gap-4">
      <div className="text-lg font-medium">
        <T id="instanceHistory.title" />
      </div>

      <StatusesSelector
        value={statuses}
        onChange={setStatuses}
        label={<T id="instanceHistory.filters.status.placeholder" />}
        statuses={allStatuses}
        renderItem={translateStatus}
        Dot={InstanceStatusDot}
        field={() => ({ className: 'max-w-52' })}
        dropdown={{ matchReferenceSize: true }}
      />

      <QueryGuard query={query}>
        {({ instances }) => (
          <InstanceList
            instances={statuses.length === 0 ? [] : instances}
            expanded={expanded}
            setExpanded={setExpanded}
            hasFilters={statuses.length < allStatuses.length}
          />
        )}
      </QueryGuard>
    </div>
  );
}

type InstanceListProps = {
  instances: Instance[];
  expanded: Instance | undefined;
  setExpanded: (instance: Instance | undefined) => void;
  hasFilters: boolean;
};

function InstanceList({ instances, expanded, setExpanded, hasFilters }: InstanceListProps) {
  const key = hasFilters ? 'instanceHistory.noInstancesFiltered' : 'instanceHistory.noInstances';

  return (
    <div className="rounded-lg border">
      {instances.map((instance) => (
        <InstanceItem
          key={instance.id}
          instance={instance}
          expanded={instance === expanded}
          toggleExpanded={() => setExpanded(instance === expanded ? undefined : instance)}
        />
      ))}

      {instances.length === 0 && (
        <div className="col items-center gap-2 p-6">
          <div className="text-base">
            <T id={`${key}.title`} />
          </div>
          <div className="text-dim">
            <T id={`${key}.description`} />
          </div>
        </div>
      )}
    </div>
  );
}

type InstanceItemProps = {
  instance: Instance;
  expanded: boolean;
  toggleExpanded: () => void;
};

function InstanceItem({ instance, expanded, toggleExpanded }: InstanceItemProps) {
  return (
    <AccordionSection
      key={instance.id}
      isExpanded={expanded}
      header={<InstanceItemHeader expanded={expanded} toggleExpanded={toggleExpanded} instance={instance} />}
    >
      <InstanceLogs instance={instance} />
    </AccordionSection>
  );
}

type InstanceItemHeaderProps = {
  instance: Instance;
  expanded: boolean;
  toggleExpanded: () => void;
};

function InstanceItemHeader({ expanded, toggleExpanded, instance }: InstanceItemHeaderProps) {
  return (
    <header onClick={toggleExpanded} className="col cursor-pointer gap-2 p-4">
      <div className="row items-center gap-2">
        <div>
          <IconChevronRight className={clsx('size-4 transition-transform', expanded && 'rotate-90')} />
        </div>

        <InstanceStatusBadge status={instance.status} />

        {(isInstanceRunning(instance) || instance.status === 'SLEEPING') && (
          <Badge color="blue" size={1}>
            <T id="instanceHistory.activeBadge" />
          </Badge>
        )}

        <div className="font-medium">{shortId(instance.id)}</div>

        <div className="ms-auto text-xs text-dim">
          <FormattedDistanceToNow value={instance.createdAt} />
        </div>
      </div>

      <div className="text-dim">{instance.messages.join(' ')}</div>
    </header>
  );
}

function useDrawer(open: boolean, onClose: () => void) {
  const floating = useFloating({
    open,
    onOpenChange: (open) => !open && onClose(),
    transform: true,
  });

  const dismiss = useDismiss(floating.context, { outsidePressEvent: 'mousedown' });
  const role = useRole(floating.context, { role: 'dialog' });

  const { getFloatingProps } = useInteractions([dismiss, role]);

  return {
    floating,
    getFloatingProps,
  };
}

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
};

function Drawer({ open, onClose, className, children }: DrawerProps) {
  const drawer = useDrawer(open, onClose);
  const duration = 120;

  return (
    <FloatingPortal root={document.getElementById('root')}>
      <AnimatePresence>
        {open && (
          <MotionFloatingOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration / 1000 }}
            style={{ overflow: 'hidden' }}
            className="z-40 col items-center justify-center bg-neutral/50 backdrop-blur"
            lockScroll
          >
            <FloatingFocusManager context={drawer.floating.context}>
              <motion.div
                {...drawer.getFloatingProps()}
                ref={drawer.floating.refs.setFloating}
                initial={{ x: 50 }}
                animate={{ x: 0 }}
                exit={{ x: 50 }}
                transition={{ ease: 'easeOut', duration: duration / 1000 }}
                className={clsx(
                  'fixed inset-y-0 right-0 w-full max-w-4xl overflow-auto bg-popover shadow-lg',
                  className,
                )}
              >
                {children}
              </motion.div>
            </FloatingFocusManager>
          </MotionFloatingOverlay>
        )}
      </AnimatePresence>
    </FloatingPortal>
  );
}
