import {
  FloatingOverlay,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { useOrganization } from 'src/api/hooks/session';
import { useToken } from 'src/application/token';
import { useSearchParam } from 'src/hooks/router';

import { DeploymentMethod } from './steps/deployment-method';
import { Introduction } from './steps/introduction';
import { Metrics } from './steps/metrics';
import { Recap } from './steps/recap';
import { Region } from './steps/region';
import { Services } from './steps/services';
import { Team } from './steps/team';
import { fetchWrappedData, mapWrappedData, WrappedData } from './wrapped-data';

const steps = [
  'introduction',
  'regions',
  'services',
  'deploymentMethod',
  'metrics',
  'team',
  'recap',
] as const;

export function Wrapped() {
  const [wrapped, setWrapped] = useSearchParam('wrapped');
  const [index, setIndex] = useState(0);
  const step = steps[index ?? -1];

  const organization = useOrganization();
  const { token } = useToken();

  const query = useQuery({
    refetchInterval: false,
    enabled: wrapped !== null,
    queryKey: ['wrapped', { organizationId: organization.id }, token],
    queryFn: () => fetchWrappedData(token, organization.id, true),
    select: (result) => mapWrappedData(result),
  });

  useEffect(() => {
    fetchWrappedData(token, organization.id, false).catch(() => {});
  }, [token, organization]);

  const next = () => (step === 'recap' ? close() : setIndex((index ?? 0) + 1));
  const close = () => setWrapped(null);

  const { refs, context } = useFloating({
    open: wrapped !== null,
    onOpenChange(open) {
      if (!open) {
        close?.();
      }
    },
  });

  const dismiss = useDismiss(context, { outsidePressEvent: 'mousedown' });
  const role = useRole(context, { role: 'dialog' });

  const { getFloatingProps } = useInteractions([dismiss, role]);

  if (wrapped === null || !query.isSuccess) {
    return null;
  }

  const data = query.data;

  return (
    <FloatingPortal>
      <FloatingOverlay
        lockScroll
        className="absolute inset-0 z-40 flex items-center justify-center bg-inverted/25 backdrop-blur-sm backdrop-grayscale"
      >
        <AnimatePresence>
          <motion.div
            ref={refs.setFloating}
            key={step}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            // eslint-disable-next-line tailwindcss/no-arbitrary-value
            className="col absolute size-full max-h-[48rem] max-w-sm overflow-y-auto rounded-2xl bg-[#fffcf4] p-8 pt-12 text-black"
            {...getFloatingProps()}
          >
            {step &&
              {
                introduction: <Introduction data={data} next={next} />,
                regions: <Region data={data} next={next} />,
                services: <Services data={data} next={next} />,
                deploymentMethod: <DeploymentMethod data={data} next={next} />,
                metrics: <Metrics data={data} next={next} />,
                team: <Team data={data} next={next} />,
                recap: <Recap />,
              }[step]}
          </motion.div>
        </AnimatePresence>
      </FloatingOverlay>
    </FloatingPortal>
  );
}

const fakeData: WrappedData = {
  deployments: 666,
  regions: ['fra'],
  // regions: ['fra', 'sin', 'was'],
  createdServices: 42,
  mostActiveServices: [
    {
      appName: 'my-funky-project',
      serviceName: 'api',
    },
    {
      appName: 'my-funky-project',
      serviceName: 'frontend',
    },
    {
      appName: 'some-random',
      serviceName: 'project',
    },
  ],
  deploymentMethod: 'git',
  // deploymentMethod: 'docker',
  pushes: 123,
  buildTime: 421,
  requests: 76600,
  team: ['Tom', 'Jeanne'],
};

void fakeData;
