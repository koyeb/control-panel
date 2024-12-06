import {
  FloatingOverlay,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';

import { Button, Input } from '@koyeb/design-system';
import { useRegion, useRegions } from 'src/api/hooks/catalog';
import { useUser } from 'src/api/hooks/session';
import { onKeyDownPositiveInteger } from 'src/application/restrict-keys';
import { IconArrowRight, IconChevronRight } from 'src/components/icons';
import { RegionFlag } from 'src/components/region-flag';
import { useSearchParam } from 'src/hooks/router';

import Croissant from './images/croissant.svg?react';

const steps = [
  'introduction',
  'regions',
  'services',
  'deploymentMethod',
  'metrics',
  'team',
  'recap',
] as const;

type WrappedData = {
  deployments: number;
  favoriteRegion: string;
  allRegions: string[];
  createdServices: number;
  mostActiveServices: Array<{
    appName: string;
    serviceName: string;
  }>;
  deploymentMethod: 'git' | 'docker';
  pushes: number;
  buildTime: number;
  requests: number;
};

const fakeData: WrappedData = {
  deployments: 666,
  favoriteRegion: 'fra',
  // allRegions: ['fra'],
  allRegions: ['fra', 'sin', 'was'],
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
  deploymentMethod: 'docker',
  pushes: 123,
  buildTime: 421,
  requests: 76600,
};

export function Wrapped({ data = fakeData }: { data?: WrappedData }) {
  const [wrapped, setWrapped] = useSearchParam('wrapped');
  const [index, setIndex] = useState(0);
  const step = steps[index ?? -1];

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

  if (wrapped === null) {
    return null;
  }

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
            className="col absolute size-full max-h-[80%] max-w-md rounded-2xl bg-neutral px-8 py-12"
            {...getFloatingProps()}
          >
            {step &&
              {
                introduction: <Introduction data={data} next={next} />,
                regions: <Region data={data} />,
                services: <Services data={data} />,
                deploymentMethod: <DeploymentMethod data={data} />,
                metrics: <Metrics data={data} />,
                team: <Team data={data} />,
                recap: <Recap data={data} />,
              }[step]}

            <footer className="row mt-auto justify-end">
              <Button
                color="gray"
                variant="ghost"
                onClick={next}
                className={clsx('text-xl', { invisible: step === 'introduction' })}
              >
                Next
                <IconArrowRight className="size-4" />
              </Button>
            </footer>
          </motion.div>
        </AnimatePresence>
      </FloatingOverlay>
    </FloatingPortal>
  );
}

function Introduction({ data, next }: { data: WrappedData; next?: () => void }) {
  const user = useUser();

  return (
    <>
      <div className="col flex-1 justify-center">
        <p className="text-center text-4xl font-medium">What a year, {user.name}!</p>
      </div>

      <div className="flex-[2]">
        <p className="text-center text-2xl font-medium">You deployed {data.deployments} times this year!</p>

        <Croissant className="my-16 h-32 " />

        <p className="mx-16 text-center text-lg">We prepared a recap of your best Koyeb events!</p>
      </div>

      <Button size={3} onClick={next}>
        Let&apos;s go!
        <IconChevronRight />
      </Button>
    </>
  );
}

type FadeProps = {
  show: boolean;
  delay?: number;
  after?: () => void;
  children: React.ReactNode;
};

function Fade({ show, delay, after, children }: FadeProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: show ? 1 : 0 }}
      onAnimationComplete={() => show && after?.()}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

function Region({ data }: { data: WrappedData }) {
  const region = useRegion(data.favoriteRegion);

  const otherRegions = useRegions().filter(
    (region) => region.identifier !== data.favoriteRegion && data.allRegions.includes(region.identifier),
  );

  const [step, setStep] = useState(0);

  return (
    <React.Fragment key={1}>
      <div>
        <p className="text-center text-2xl font-medium">Your favorite region is...</p>

        <motion.p
          initial={{ opacity: 0, transform: 'scale(0%)' }}
          animate={{ opacity: 1, transform: 'scale(100%)' }}
          transition={{ delay: 1, ease: 'easeOut', bounce: 0, duration: 1 }}
          onAnimationComplete={() => setStep(1)}
          className="row my-16 items-center justify-center gap-6 overflow-x-clip text-center text-4xl"
        >
          <RegionFlag identifier={region?.identifier} />
          {region?.displayName}
          <RegionFlag identifier={region?.identifier} />
        </motion.p>
      </div>

      {otherRegions.length === 0 && (
        <Fade show={step >= 1} after={() => setStep(2)} delay={0.5}>
          {<p className="mx-8 text-center text-lg font-medium">{regionSentences[data.favoriteRegion]}</p>}
          <Croissant className="my-16 ml-auto h-32 -scale-x-100" />
        </Fade>
      )}

      {otherRegions.length > 0 && (
        <Fade show={step >= 1} after={() => setStep(2)} delay={0.5}>
          <p className="text-center text-lg font-medium">
            But you deployed all around the world, in{' '}
            {otherRegions.map((region) => region.displayName).join(', ')}
          </p>

          <Croissant className="my-16 ml-auto h-32 -scale-x-100" />

          <p className="text-4xl">Truly global!!</p>
        </Fade>
      )}
    </React.Fragment>
  );
}

const regionSentences: Record<string, string> = {
  fra: "Let's celebrate with beers and pretzels! 🥨🍺",
  par: "Let's have a croque monsieur tonight! 🥪",
  sin: "Let's find a sentence for sin!",
  was: "Let's find a sentence for was!",
  sfo: "Let's find a sentence for sfo!",
  tyo: "Let's find a sentence for tyo!",
};

function Services({ data }: { data: WrappedData }) {
  const mostActiveService = data.mostActiveServices[0];
  const otherActiveServices = data.mostActiveServices.slice(1);

  return (
    <>
      <p className="my-8 text-2xl">
        You created <strong>{data.createdServices}</strong> services this year.
      </p>

      <p className="my-8 text-2xl">
        There is one that stands out. You&apos;ve been most active on{' '}
        <strong>
          {mostActiveService?.appName}/{mostActiveService?.serviceName}
        </strong>
      </p>

      {otherActiveServices.length > 1 && (
        <>
          <p className="mt-2 text-lg">Here are your top {otherActiveServices.length} services:</p>

          <ol className="list-inside list-decimal pl-4 pt-4 ">
            {otherActiveServices.map((service, index) => (
              <li key={index} className="text-lg">
                {service.appName}/{service.serviceName}
              </li>
            ))}
          </ol>
        </>
      )}

      <Croissant className="my-16 h-32" />
    </>
  );
}

function DeploymentMethod({ data }: { data: WrappedData }) {
  return (
    <>
      {data.deploymentMethod === 'git' && (
        <>
          <p className="my-8 text-2xl">You&apos;re a go-getter and a git-pusher!</p>
          <p className="my-8 text-2xl">You pushed a grand total of {data.pushes} times this year!</p>
          <div>
            <Croissant className="h-32" />
          </div>
          <p className="my-8 text-2xl">And each time, you trusted us to build the code for you 💫</p>
          <p className="my-8 text-2xl">We did, for {data.buildTime} minutes. Keep pushing!</p>
        </>
      )}

      {data.deploymentMethod === 'docker' && (
        <>
          <div>
            <Croissant className="h-32" />
          </div>
          <p className="my-8 text-2xl">Clearly, you know what you want in life and in infrastructure.</p>
          <p className="my-8 text-2xl">
            Your favorite way to deploy is to use already built docker containers!
          </p>
        </>
      )}
    </>
  );
}

function Metrics({ data }: { data: WrappedData }) {
  const [tries, setTries] = useState(3);
  const [lastAnswer, setLastAnswer] = useState<number>();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const value = Number.parseInt(new FormData(event.currentTarget).get('guess') as string);

    if (!Number.isFinite(value) || tries <= 0) {
      return;
    }

    setLastAnswer(Number(value));
    setTries(value === data.requests ? 0 : tries - 1);
  };

  const result = Math.abs(Math.log10(data.requests) - Math.log10(lastAnswer ?? 0));

  return (
    <>
      <p className="my-8 text-2xl">Can you guess how many requests your service handled this year?</p>

      <div className="row">
        <Croissant className="w-1/2" />
        <Croissant className="w-1/2 -scale-x-100" />
      </div>

      <div className="text-lg">
        <p>Give us your best guess, {tries} tries remaining!</p>

        <form onSubmit={handleSubmit}>
          <Input
            name="guess"
            onKeyDown={onKeyDownPositiveInteger}
            className="mx-auto my-8 max-w-32"
            inputBoxClassName="border-strong"
          />
        </form>
      </div>

      {lastAnswer !== undefined && tries > 0 && (
        <p className="my-8 text-center text-6xl">{lastAnswer < data.requests ? 'Higher!' : 'Lower!'}</p>
      )}

      {tries === 0 && (
        <>
          <p className="my-4 text-center text-2xl">{data.requests} requests!</p>

          <p className="text-center text-lg">
            {lastAnswer === data.requests && "That's it!!!"}
            {result > 0 && result <= 2 && 'So close!!'}
            {result > 2 && result <= 3 && 'Not far!'}
            {result > 3 && result <= 4 && 'Nice try!'}
            {result > 4 && 'Can you believe it?'}
          </p>
        </>
      )}
    </>
  );
}

function Team({ data }: { data: WrappedData }) {
  return <>Team</>;
}

function Recap({ data }: { data: WrappedData }) {
  return <>Recap</>;
}
