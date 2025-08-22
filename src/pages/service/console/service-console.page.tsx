import { Alert } from '@koyeb/design-system';
import { useEffect, useMemo, useState } from 'react';

import { useInstanceQuery, useInstancesQuery } from 'src/api/hooks/service';
import { Instance } from 'src/api/model';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { SelectInstance } from 'src/components/select-instance';
import Terminal from 'src/components/terminal/terminal';
import { useRouteParam } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

import { useTerminal } from './use-terminal';

const T = createTranslate('pages.service.console');

export function ServiceConsolePage() {
  const serviceId = useRouteParam('serviceId');

  const instancesQuery = useInstancesQuery({ serviceId, statuses: ['HEALTHY'] });
  const instances = useMemo(() => instancesQuery.data?.instances ?? [], [instancesQuery.data]);

  const [instance, setInstance] = useState<Instance | null>(null);

  useEffect(() => {
    if (instance === null && instances[0] !== undefined) {
      setInstance(instances[0]);
    }
  }, [instances, instance]);

  if (instancesQuery.isPending) {
    return <Loading />;
  }

  if (instancesQuery.error) {
    return <QueryError error={instancesQuery.error} />;
  }

  return (
    <>
      <SelectInstance
        label={<T id="instanceLabel" />}
        instances={instances}
        value={instance}
        onChange={setInstance}
        renderNoItems={() => (
          <div className="col h-10 items-center justify-center text-dim">No healthy instances</div>
        )}
        className="w-full max-w-xs self-start"
      />

      {instances.length === 0 && (
        <Alert
          variant="warning"
          title={<T id="noInstance.title" />}
          description={<T id="noInstance.description" />}
        />
      )}

      {instance && <InstanceTerminal instanceId={instance.id} />}
    </>
  );
}

function InstanceTerminal({ instanceId }: { instanceId: string }) {
  const { data: instance } = useInstanceQuery(instanceId);

  const { setTerminal, onData, onSizeChanged } = useTerminal(instanceId, {
    readOnly: instance?.status !== 'HEALTHY',
  });

  return <Terminal ref={setTerminal} onSizeChange={onSizeChanged} onData={onData} />;
}
