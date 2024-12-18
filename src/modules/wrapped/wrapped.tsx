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

import { Alert } from '@koyeb/design-system';
import { useOrganization } from 'src/api/hooks/session';
import { useToken } from 'src/application/token';
import { Link } from 'src/components/link';
import { useSearchParam } from 'src/hooks/router';

import Croissant from './images/croissant.svg?react';
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

  const organization = useOrganization();
  const { token } = useToken();

  const query = useQuery({
    queryKey: ['wrapped', { organizationId: organization.id }, token],
    queryFn: () => fetchWrappedData(token, organization.id, false),
    select: (result) => mapWrappedData(organization.id, result),
  });

  if (!query.isSuccess || query.data === null) {
    return null;
  }

  const link = (children: string) => (
    <Link className="text-green" href={`/?wrapped`}>
      {children}
    </Link>
  );

  return (
    <>
      <Alert
        icon={<Croissant className="w-16" />}
        variant="info"
        title="End of year surprise!"
        description={<>Curious about your stats? {link('Click here')} to see your yearly recap.</>}
        className="mb-8"
      />

      <WrappedDialog data={query.data} open={wrapped !== null} onClose={() => setWrapped(null)} />
    </>
  );
}

const MotionFloatingOverlay = motion.create(FloatingOverlay);

function WrappedDialog({ open, onClose, data }: { open: boolean; onClose: () => void; data: WrappedData }) {
  const { refs, context } = useFloating({
    open,
    onOpenChange(open) {
      if (!open) {
        onClose?.();
      }
    },
  });

  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'dialog' });

  const { getFloatingProps } = useInteractions([dismiss, role]);

  const [index, setIndex] = useState(0);
  const step = steps[index ?? -1];

  const next = () => setIndex((index ?? 0) + 1);

  useEffect(() => {
    setIndex(0);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <FloatingPortal>
          <MotionFloatingOverlay
            lockScroll
            className="fixed inset-0 z-40 flex items-center justify-center bg-inverted/25 backdrop-blur-sm backdrop-grayscale"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnimatePresence>
              <motion.div
                ref={refs.setFloating}
                key={step}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.2 }}
                // eslint-disable-next-line tailwindcss/no-arbitrary-value
                className="absolute size-full max-h-[48rem] max-w-sm cursor-pointer overflow-auto rounded-2xl bg-[#fffcf4] p-8 text-black"
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
                    recap: <Recap next={onClose} />,
                  }[step]}
              </motion.div>
            </AnimatePresence>
          </MotionFloatingOverlay>
        </FloatingPortal>
      )}
    </AnimatePresence>
  );
}
