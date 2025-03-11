import clsx from 'clsx';
import { isBefore, sub } from 'date-fns';
import { useCallback, useMemo } from 'react';
import { Controller, UseFormReturn, useForm } from 'react-hook-form';

import { useRegions } from 'src/api/hooks/catalog';
import {
  App,
  CatalogRegion,
  ComputeDeployment,
  Instance,
  LogLine as LogLineType,
  Service,
} from 'src/api/model';
import { ControlledCheckbox, ControlledSelect } from 'src/components/controlled';
import {
  LogLineContent,
  LogLineDate,
  LogLineInstanceId,
  LogLineStream,
  LogOptions,
  Logs,
} from 'src/components/logs/logs';
import waitingForLogsImage from 'src/components/logs/waiting-for-logs.gif';
import { RegionFlag } from 'src/components/region-flag';
import { SelectInstance } from 'src/components/select-instance';
import { useFormValues } from 'src/hooks/form';
import { LogsApi } from 'src/hooks/logs';
import { createTranslate, Translate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';
import { hasProperty } from 'src/utils/object';

const T = createTranslate('modules.deployment.deploymentLogs.runtime');

type Filters = {
  region: string | null;
  instance: string | null;
  logs: boolean;
  events: boolean;
};

type RuntimeLogsProps = {
  app: App;
  service: Service;
  deployment: ComputeDeployment;
  instances: Instance[];
  logs: LogsApi;
};

export function RuntimeLogs({ app, service, deployment, instances, logs }: RuntimeLogsProps) {
  const { error, lines } = logs;
  const regions = useRegions().filter((region) => deployment.definition.regions.includes(region.identifier));

  const form = useForm<Filters>({
    defaultValues: {
      region: null,
      instance: null,
      logs: true,
      events: true,
    },
  });

  const filters = useFormValues(form);
  const filteredLines = useFilteredLines(lines, filters, instances);
  const filteredInstances = useFilteredInstances(filters, instances);

  const renderLine = useCallback((line: LogLineType, options: LogOptions) => {
    return <LogLine options={options} line={line} />;
  }, []);

  if (error) {
    return <Translate id="common.errorMessage" values={{ message: error.message }} />;
  }

  const waitingForLogs = instances.length === 0;
  const hasFilters = form.formState.isDirty;

  const expired = [
    lines.length === 0,
    inArray(deployment.status, ['canceled', 'error', 'stopped']),
    isBefore(new Date(deployment.date), sub(new Date(), { hours: 72 })),
  ].every(Boolean);

  if (waitingForLogs && inArray(deployment.status, ['pending', 'provisioning', 'scheduled', 'allocating'])) {
    return <WaitingForLogs />;
  }

  return (
    <Logs
      appName={app.name}
      serviceName={service.name}
      header={<LogsFilters form={form} regions={regions} instances={filteredInstances} />}
      expired={expired}
      hasFilters={hasFilters}
      hasInstanceOption
      logs={{ ...logs, lines: filteredLines }}
      renderLine={renderLine}
    />
  );
}

function useFilteredLines(lines: LogLineType[], filters: Filters, instances: Instance[]) {
  return useMemo(() => {
    return lines.filter((line) => {
      const instance = instances.find(hasProperty('id', line.instanceId));

      if (!filters.logs && line.stream !== 'koyeb') {
        return false;
      }

      if (!filters.events && line.stream === 'koyeb') {
        return false;
      }

      if (filters.region !== null && filters.region !== instance?.region) {
        return false;
      }

      if (filters.instance !== null && filters.instance !== line.instanceId) {
        return false;
      }

      return true;
    });
  }, [lines, filters, instances]);
}

function useFilteredInstances(filters: Filters, instances: Instance[]) {
  return useMemo(() => {
    if (filters.region === null) {
      return instances;
    }

    return instances.filter(hasProperty('region', filters.region));
  }, [filters, instances]);
}

function WaitingForLogs() {
  return (
    <div className="col h-full items-center justify-center gap-2 py-12">
      <img src={waitingForLogsImage} />

      <p className="font-medium">
        <T id="waitingForLogs.title" />
      </p>
      <p className="max-w-xl text-center">
        <T id="waitingForLogs.description" />
      </p>
    </div>
  );
}

type LogsFiltersProps = {
  form: UseFormReturn<Filters>;
  regions: CatalogRegion[];
  instances: Instance[];
};

function LogsFilters({ form, regions, instances }: LogsFiltersProps) {
  return (
    <div className="col sm:row gap-4">
      <ControlledSelect
        control={form.control}
        name="region"
        items={regions}
        placeholder={<T id="filters.allRegions" />}
        getKey={(region) => region.identifier}
        itemToString={(region) => region.displayName}
        itemToValue={(region) => region.identifier}
        onItemClick={(region) => region.identifier === form.watch('region') && form.setValue('region', null)}
        renderItem={(region) => (
          <div className="row gap-2 whitespace-nowrap">
            <RegionFlag identifier={region.identifier} className="size-4" />
            {region.displayName}
          </div>
        )}
        onChangeEffect={() => form.setValue('instance', null)}
        className="md:min-w-48"
      />

      <Controller
        control={form.control}
        name="instance"
        render={({ field }) => (
          <SelectInstance
            instances={instances}
            placeholder={<T id="filters.allInstances" />}
            value={instances.find(hasProperty('id', field.value)) ?? null}
            onChange={(instance) => field.onChange(instance.id)}
            unselect={<T id="filters.allInstances" />}
            onUnselect={() => field.onChange(null)}
            className="min-w-64"
          />
        )}
      />

      <div className="row gap-4">
        <ControlledCheckbox control={form.control} name="logs" label={<T id="filters.logs" />} />
        <ControlledCheckbox control={form.control} name="events" label={<T id="filters.events" />} />
      </div>
    </div>
  );
}

function LogLine({ options, line }: { options: LogOptions; line: LogLineType }) {
  return (
    <div className={clsx('row px-4', line.stream === 'koyeb' && 'bg-blue/10')}>
      {options.date && (
        <LogLineDate
          line={line}
          year="numeric"
          month="2-digit"
          day="2-digit"
          hour="2-digit"
          minute="2-digit"
          second="2-digit"
        />
      )}

      {options.stream && <LogLineStream line={line} />}

      {options.instance && <LogLineInstanceId line={line} />}

      <LogLineContent line={line} options={options} />
    </div>
  );
}
