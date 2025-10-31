import { useEffect, useEffectEvent } from 'react';
import { useForm } from 'react-hook-form';

import { useFeatureFlag } from 'src/hooks/feature-flag';
import { ComputeDeployment, Instance } from 'src/model';

import { LogStream, LogType, LogsPeriod } from './use-logs';

export type LogsFilters = {
  type: LogType;
  deploymentId: string | null;
  regionalDeploymentId: string | null;
  instanceId: string | null;
  streams: LogStream[];
  period: LogsPeriod;
  search: string;
};

export function useLogsFilters(
  type: 'build' | 'runtime',
  { deployment, instance }: { deployment?: ComputeDeployment; instance?: Instance },
) {
  const logsFiltersFlag = useFeatureFlag('logs-filters');

  const defaultFilters: LogsFilters = {
    type,
    deploymentId: deployment?.id ?? null,
    regionalDeploymentId: null,
    instanceId: instance?.id ?? null,
    streams: ['stdout', 'stderr', 'koyeb'],
    period: type === 'runtime' && logsFiltersFlag ? '1h' : '30d',
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
