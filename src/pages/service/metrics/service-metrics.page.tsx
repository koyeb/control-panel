import { ButtonGroup, InfoTooltip } from '@koyeb/design-system';
import clsx from 'clsx';

import type { API } from 'src/api/api';
import { useInstance } from 'src/api/hooks/catalog';
import { useComputeDeployment, useService } from 'src/api/hooks/service';
import { parseBytes } from 'src/application/memory';
import { LinkButton } from 'src/components/link';
import { Title } from 'src/components/title';
import { createTranslate } from 'src/intl/translate';
import { CpuGraph } from 'src/modules/metrics/graphs/cpu-graph';
import { HttpThroughputGraph } from 'src/modules/metrics/graphs/http-throughput-graph';
import { MemoryGraph } from 'src/modules/metrics/graphs/memory-graph';
import { PublicDataTransferGraph } from 'src/modules/metrics/graphs/public-data-transfer-graph';
import { ResponseTimeGraph } from 'src/modules/metrics/graphs/response-time-graph';
import { MetricsTimeFrame, metricsTimeFrames } from 'src/modules/metrics/metrics-helpers';
import { useMetricsQueries } from 'src/modules/metrics/use-metrics';

const T = createTranslate('pages.service.metrics');

type MetricsPageProps = {
  serviceId: string;
  timeFrame: MetricsTimeFrame;
};

export function ServiceMetricsPage({ serviceId, timeFrame }: MetricsPageProps) {
  return (
    <>
      <Title
        title="Metrics"
        end={
          <ButtonGroup>
            {metricsTimeFrames.map((s) => (
              <LinkButton
                key={s}
                from="/services/$serviceId/metrics"
                search={{ 'time-frame': s }}
                type="button"
                variant={s === timeFrame ? 'solid' : 'outline'}
              >
                {s.toUpperCase()}
              </LinkButton>
            ))}
          </ButtonGroup>
        }
      />

      <ServiceMetrics serviceId={serviceId} timeFrame={timeFrame} />
    </>
  );
}

const metrics: API.MetricName[] = [
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
  const service = useService(serviceId);
  const queries = useMetricsQueries({ serviceId, metrics, timeFrame });
  const instance = useServiceInstanceType(serviceId);

  return (
    <>
      <div className="col gap-4 lg:row">
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
            max={parseBytes(instance?.memory)}
          />
        </GraphCard>
      </div>

      {service?.type === 'web' && (
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

function useServiceInstanceType(serviceId: string) {
  const service = useService(serviceId);
  const activeDeployment = useComputeDeployment(service?.activeDeploymentId);
  const latestDeployment = useComputeDeployment(service?.latestDeploymentId);

  return useInstance((activeDeployment ?? latestDeployment)?.definition.instanceType);
}
