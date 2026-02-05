import { useEffect, useEffectEvent } from 'react';
import { useForm } from 'react-hook-form';

import { ComputeDeployment, Instance } from 'src/model';

import { LogStream, LogType } from './use-logs';

export type LogsFilters = {
  type: LogType;
  deploymentId: string | null;
  instanceId: string | null;
  regions: string[];
  streams: LogStream[];
  search: string;
};

export function useLogsFilters(
  type: 'build' | 'runtime',
  { deployment, instance }: { deployment?: ComputeDeployment; instance?: Instance },
) {
  const defaultFilters: LogsFilters = {
    type,
    deploymentId: deployment?.id ?? null,
    instanceId: instance?.id ?? null,
    regions: deployment?.definition.regions ?? [],
    streams: ['stdout', 'stderr', 'koyeb'],
    search: '',
  };

  const filters = useForm({
    defaultValues: defaultFilters,
  });

  const resetFilters = useEffectEvent(() => {
    filters.reset(defaultFilters);
  });

  useEffect(() => {
    resetFilters();
  }, [deployment?.id, instance?.id]);

  return filters;
}
