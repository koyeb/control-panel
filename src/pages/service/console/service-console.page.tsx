import { useEffect, useState } from 'react';

import { Alert } from '@koyeb/design-system';
import { useInstancesQuery } from 'src/api/hooks/service';
import { Instance } from 'src/api/model';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { SelectInstance } from 'src/components/select-instance';
import Terminal from 'src/components/terminal/terminal';
import { useRouteParam } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { hasProperty } from 'src/utils/object';

import { useTerminal } from './use-terminal';

const T = createTranslate('pages.service.console');

export function ServiceConsolePage() {
  const serviceId = useRouteParam('serviceId');
  const instancesQuery = useInstancesQuery({ serviceId, status: 'healthy' });
  const [instance, setInstance] = useState<Instance | null>(null);

  useEffect(() => {
    const instances = instancesQuery.data;

    if (instances?.[0] === undefined) {
      return;
    }

    if (instance === null || !instances.find(hasProperty('id', instance.id))) {
      setInstance(instances[0]);
    }
  }, [instancesQuery.data, instance]);

  if (instancesQuery.isPending) {
    return <Loading />;
  }

  if (instancesQuery.error) {
    return <QueryError error={instancesQuery.error} />;
  }

  const instances = instancesQuery.data;

  if (instances.length === 0) {
    return (
      <Alert
        variant="warning"
        title={<T id="noInstance.title" />}
        description={<T id="noInstance.description" />}
      />
    );
  }

  return (
    <>
      <SelectInstance
        label={<T id="instanceLabel" />}
        instances={instances}
        value={instance}
        onChange={setInstance}
        className="w-full max-w-xs self-start"
      />

      {instance && <InstanceTerminal instanceId={instance.id} />}
    </>
  );
}

function InstanceTerminal({ instanceId }: { instanceId: string }) {
  const { setTerminal, onData, onSizeChanged } = useTerminal(instanceId);

  return <Terminal ref={setTerminal} onSizeChange={onSizeChanged} onData={onData} />;
}
