// cspell:word instatus hasissues undermaintenance allundermaintenance alldegradedperformance allpartialoutage allminoroutage allmajoroutage someundermaintenance somedegradedperformance somepartialoutage someminoroutage somemajoroutage oneundermaintenance onedegradedperformance onepartialoutage oneminoroutage onemajoroutage

import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useEffect } from 'react';
import { z } from 'zod';

import { Tooltip } from '@koyeb/design-system';
import { reportError } from 'src/application/report-error';
import { IconSquareArrowOutUpRight } from 'src/components/icons';
import { ExternalLink } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';

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
    meta: { showError: false },
    throwOnError: false,
    async queryFn() {
      const response = await fetch(`${statusPageUrl}/summary.json`);

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json() as Promise<unknown>;
    },
    select: (result): [status: Status, message?: string] => {
      const summary = schema.parse(result);

      if (summary.page.status === 'UP') {
        return ['up'];
      }

      if (summary.page.status === 'UNDERMAINTENANCE') {
        return ['underMaintenance'];
      }

      const incident = summary.activeIncidents?.[0];

      if (summary.page.status === 'HASISSUES' && incident !== undefined) {
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
        'row mx-4 items-center gap-1',
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
        <Tooltip allowHover content={message}>
          {(props) => (
            <span {...props}>
              <T id={status} />
            </span>
          )}
        </Tooltip>
      )}

      {!collapsed && (
        <div className="ms-auto">
          <IconSquareArrowOutUpRight className="size-4 text-dim" />
        </div>
      )}
    </ExternalLink>
  );
}
