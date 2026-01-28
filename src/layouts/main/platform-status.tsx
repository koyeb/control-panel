import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useEffect } from 'react';
import { z } from 'zod';

import { reportError } from 'src/application/sentry';
import { ExternalLink } from 'src/components/link';
import { Tooltip } from 'src/components/tooltip';
import { IconSquareArrowOutUpRight } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

// cSpell:ignore hasissues undermaintenance degradedperformance partialoutage majoroutage

const T = createTranslate('components.platformStatus');

const schema = z.object({
  page: z.object({
    status: z.union([z.literal('UP'), z.literal('HASISSUES'), z.literal('UNDERMAINTENANCE')]),
  }),
  activeIncidents: z
    .array(
      z.object({
        name: z.string(),
        status: z.string(),
        impact: z.union([
          z.literal('OPERATIONAL'),
          z.literal('UNDERMAINTENANCE'),
          z.literal('DEGRADEDPERFORMANCE'),
          z.literal('PARTIALOUTAGE'),
          z.literal('MAJOROUTAGE'),
        ]),
      }),
    )
    .optional(),
});

type InstatusSummary = z.infer<typeof schema>;
type InstatusImpact = NonNullable<InstatusSummary['activeIncidents']>[number]['impact'];

type Status = 'up' | 'underMaintenance' | 'degradedPerformance' | 'partialOutage' | 'majorOutage';

const statusMap: Record<InstatusImpact, Status> = {
  OPERATIONAL: 'up',
  UNDERMAINTENANCE: 'underMaintenance',
  DEGRADEDPERFORMANCE: 'degradedPerformance',
  PARTIALOUTAGE: 'partialOutage',
  MAJOROUTAGE: 'majorOutage',
};

const colorMap: Record<Status, 'green' | 'orange' | 'red'> = {
  up: 'green',
  underMaintenance: 'orange',
  degradedPerformance: 'orange',
  partialOutage: 'orange',
  majorOutage: 'red',
};

const statusPageUrl = 'https://status.koyeb.com';

export function PlatformStatus({ collapsed }: { collapsed: boolean }) {
  const query = useQuery({
    queryKey: ['instatus'],
    async queryFn() {
      const response = await fetch(`${statusPageUrl}/summary.json`);

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json() as Promise<unknown>;
    },

    refetchInterval: 60_000,
    throwOnError: false,
    meta: { showError: false },

    select(result): [status: Status, message?: string] {
      const summary = schema.parse(result);

      if (summary.page.status === 'UP') {
        return ['up'];
      }

      if (summary.page.status === 'UNDERMAINTENANCE') {
        return ['underMaintenance'];
      }

      const incident = summary.activeIncidents?.[0];

      if (incident !== undefined) {
        return [statusMap[incident.impact], incident.name];
      }

      return ['up'];
    },
  });

  useEffect(() => {
    if (query.isError) {
      reportError(query.error);
    }
  }, [query.isError, query.error]);

  if (!query.isSuccess) {
    return null;
  }

  const [status, message] = query.data;
  const color = colorMap[status];

  return (
    <ExternalLink
      openInNewTab
      href={statusPageUrl}
      className={clsx(
        'mx-4 row items-center gap-1',
        'rounded-md border px-2 py-1',
        'transition-colors hover:bg-muted/50',
        'text-start text-xs font-medium text-dim',
      )}
    >
      <span
        className={clsx('my-0.5 size-3 rounded-full', {
          'bg-green': color === 'green',
          'bg-orange': color === 'orange',
          'bg-red': color === 'red',
        })}
      />

      {!collapsed && (
        <Tooltip
          allowHover
          content={message}
          trigger={(props) => (
            <span {...props}>
              <T id={status} />
            </span>
          )}
        />
      )}

      {!collapsed && (
        <div className="ms-auto">
          <IconSquareArrowOutUpRight className="size-4 text-dim" />
        </div>
      )}
    </ExternalLink>
  );
}
