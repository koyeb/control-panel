import clsx from 'clsx';
import { useEffect } from 'react';

import { Button, ButtonGroup, InfoTooltip } from '@koyeb/design-system';
import { ApiMetricName } from 'src/api/api-types';
import { useInstance } from 'src/api/hooks/catalog';
import { useDeployment, useService } from 'src/api/hooks/service';
import { isComputeDeployment } from 'src/api/mappers/deployment';
import { parseBytes } from 'src/application/memory';
import { DocumentTitle } from 'src/components/document-title';
import { Title } from 'src/components/title';
import { useRouteParam, useSearchParam } from 'src/hooks/router';
import { useServiceName } from 'src/hooks/service';
import { Translate } from 'src/intl/translate';
import { CpuGraph } from 'src/modules/metrics/graphs/cpu-graph';
import { HttpThroughputGraph } from 'src/modules/metrics/graphs/http-throughput-graph';
import { MemoryGraph } from 'src/modules/metrics/graphs/memory-graph';
import { PublicDataTransferGraph } from 'src/modules/metrics/graphs/public-data-transfer-graph';
import { ResponseTimeGraph } from 'src/modules/metrics/graphs/response-time-graph';
import { MetricsTimeFrame, isMetricsTimeFrame, metricsTimeFrames } from 'src/modules/metrics/metrics-helpers';
import { useMetricsQueries } from 'src/modules/metrics/use-metrics';
import { assert, defined } from 'src/utils/assert';

const T = Translate.prefix('pages.service.metrics');

export function ServiceMetricsPage() {
  const serviceId = useRouteParam('serviceId');
  const serviceName = useServiceName(serviceId);

  const [timeFrame, setTimeFrame] = useTimeFrame();

  return (
    <>
      <DocumentTitle title={`${serviceName} Service Metrics`} />

      <Title
        title="Metrics"
        end={
          <ButtonGroup>
            {metricsTimeFrames.map((s) => (
              <Button
                key={s}
                type="button"
                variant={s === timeFrame ? 'solid' : 'outline'}
                onClick={() => setTimeFrame(s)}
              >
                {s.toUpperCase()}
              </Button>
            ))}
          </ButtonGroup>
        }
      />

      {isMetricsTimeFrame(timeFrame) && <ServiceMetrics serviceId={serviceId} timeFrame={timeFrame} />}
    </>
  );
}

const metrics: ApiMetricName[] = [
  'CPU_TOTAL_PERCENT',
  'MEM_RSS',
  'HTTP_THROUGHPUT',
  'HTTP_RESPONSE_TIME_50P',
  'HTTP_RESPONSE_TIME_90P',
  'HTTP_RESPONSE_TIME_99P',
  'HTTP_RESPONSE_TIME_MAX',
  'PUBLIC_DATA_TRANSFER_IN',
  'PUBLIC_DATA_TRANSFER_OUT',
] as const;

function ServiceMetrics({ serviceId, timeFrame }: { serviceId: string; timeFrame: MetricsTimeFrame }) {
  const service = defined(useService(serviceId));
  const queries = useMetricsQueries({ serviceId, metrics, timeFrame });
  const instance = useServiceInstanceType(serviceId);

  return (
    <>
      <div className="col lg:row gap-4">
        <GraphCard label={<T id="cpu.label" />} tooltip={<T id="cpu.tooltip" />} className="flex-1">
          <CpuGraph
            loading={queries.isPending}
            error={queries.error['CPU_TOTAL_PERCENT']}
            data={queries.data['CPU_TOTAL_PERCENT']}
          />
        </GraphCard>

        <GraphCard label={<T id="memory.label" />} tooltip={<T id="memory.tooltip" />} className="flex-1">
          <MemoryGraph
            loading={queries.isPending}
            error={queries.error['MEM_RSS']}
            data={queries.data['MEM_RSS']}
            max={parseBytes(instance?.ram)}
          />
        </GraphCard>
      </div>

      {service.type === 'web' && (
        <>
          <GraphCard label={<T id="responseTime.label" />} tooltip={<T id="responseTime.tooltip" />}>
            <ResponseTimeGraph
              loading={queries.isPending}
              error={
                queries.error['HTTP_RESPONSE_TIME_50P'] ??
                queries.error['HTTP_RESPONSE_TIME_90P'] ??
                queries.error['HTTP_RESPONSE_TIME_99P'] ??
                queries.error['HTTP_RESPONSE_TIME_MAX']
              }
              data={{
                '50p': queries.data['HTTP_RESPONSE_TIME_50P'],
                '90p': queries.data['HTTP_RESPONSE_TIME_90P'],
                '99p': queries.data['HTTP_RESPONSE_TIME_99P'],
                max: queries.data['HTTP_RESPONSE_TIME_MAX'],
              }}
            />
          </GraphCard>

          <GraphCard label={<T id="httpThroughput.label" />} tooltip={<T id="httpThroughput.tooltip" />}>
            <HttpThroughputGraph
              loading={queries.isPending}
              error={queries.error['HTTP_THROUGHPUT']}
              data={queries.data['HTTP_THROUGHPUT']}
            />
          </GraphCard>

          <GraphCard
            label={<T id="publicDataTransfer.label" />}
            tooltip={<T id="publicDataTransfer.tooltip" />}
          >
            <PublicDataTransferGraph
              loading={queries.isPending}
              error={queries.error['PUBLIC_DATA_TRANSFER_IN'] ?? queries.error['PUBLIC_DATA_TRANSFER_OUT']}
              data={{
                in: queries.data['PUBLIC_DATA_TRANSFER_IN'],
                out: queries.data['PUBLIC_DATA_TRANSFER_OUT'],
              }}
            />
          </GraphCard>
        </>
      )}
    </>
  );
}

type GraphCardProps = {
  label: React.ReactNode;
  tooltip: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

function GraphCard({ label, tooltip, className, children }: GraphCardProps) {
  return (
    <div className={clsx('card col gap-4 p-4 pb-0', className)}>
      <div className="row items-center gap-2">
        <div className="text-base font-medium">{label}</div>
        <InfoTooltip content={tooltip} />
      </div>

      {children}
    </div>
  );
}

function useTimeFrame() {
  const [timeFrame, setTimeFrame] = useSearchParam('time-frame');

  useEffect(() => {
    if (!isMetricsTimeFrame(timeFrame)) {
      setTimeFrame('5m');
    }
  }, [timeFrame, setTimeFrame]);

  return [timeFrame, setTimeFrame] as const;
}

function useServiceInstanceType(serviceId: string) {
  const service = useService(serviceId);
  const deployment = useDeployment(service?.latestDeploymentId);

  assert(!deployment || isComputeDeployment(deployment));

  return useInstance(deployment?.definition.instanceType ?? null);
}
