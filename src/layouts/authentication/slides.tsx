import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';

import { Stepper } from '@koyeb/design-system';
import { stopPropagation } from 'src/application/dom-events';
import { SvgComponent } from 'src/application/types';
import { createTranslate } from 'src/intl/translate';
import { createArray } from 'src/utils/arrays';

import anyHardware from './images/any-hardware.png';
import Dots from './images/dots.svg?react';
import Lines from './images/lines.svg?react';
import Progress from './images/progress.svg?react';
import seamlessDeployment from './images/seamless-deployment.png';
import zeroConfig from './images/zero-config.png';

const T = createTranslate('layouts.authentication');

export function Slides() {
  const [index, setIndex] = useState<0 | 1 | 2>(0);

  const next = useCallback(() => {
    setIndex(((index + 1) % 3) as typeof index);
  }, [index]);

  useEffect(() => {
    const interval = setInterval(next, 6 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [next]);

  const props: Record<0 | 1 | 2, SlideProps> = [
    {
      illustration: zeroConfig,
      line1: <T id="zeroConfig.line1" />,
      line2: <T id="zeroConfig.line2" />,
      features: [
        <T key={1} id="zeroConfig.feature1" />,
        <T key={2} id="zeroConfig.feature2" />,
        <T key={3} id="zeroConfig.feature3" />,
      ],
      images: [Dots, Progress, Lines],
    },
    {
      illustration: seamlessDeployment,
      line1: <T id="seamlessDeployment.line1" />,
      line2: <T id="seamlessDeployment.line2" />,
      features: [
        <T key={1} id="seamlessDeployment.feature1" />,
        <T key={2} id="seamlessDeployment.feature2" />,
        <T key={3} id="seamlessDeployment.feature3" />,
      ],
      images: [Progress, Lines, Dots],
    },
    {
      illustration: anyHardware,
      line1: <T id="anyHardware.line1" />,
      line2: <T id="anyHardware.line2" />,
      features: [
        <T key={1} id="anyHardware.feature1" />,
        <T key={2} id="anyHardware.feature2" />,
        <T key={3} id="anyHardware.feature3" />,
      ],
      images: [Lines, Dots, Progress],
    },
  ];

  return (
    <div className="dark relative h-full rounded-2xl bg-[#111111] [&_*]:border-[#1E1E1E]" onClick={next}>
      <Helmet>
        {createArray(3, (i) => (
          <link rel="preload" href={props[i as 0 | 1 | 2].illustration} as="image" />
        ))}
      </Helmet>

      {createArray(3, (i) => (
        <AnimatePresence>
          {i === index && (
            <motion.div
              className="absolute inset-0 h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <Slide {...props[i]} />
            </motion.div>
          )}
        </AnimatePresence>
      ))}

      <div className="row absolute inset-x-0 bottom-12 justify-center" onClick={stopPropagation}>
        <Stepper totalSteps={3} activeStep={index} onClick={(i) => setIndex(i as typeof index)} />
      </div>
    </div>
  );
}

const gradientText = clsx([
  'bg-gradient-to-tr from-[#D1D8DC] via-[#B0A6B6] to-[#E2E7E9] bg-clip-text text-transparent',
  'text-5xl font-semibold',
  'px-6 py-3',
]);

type SlideProps = {
  illustration: string;
  line1: React.ReactNode;
  line2: React.ReactNode;
  features: React.ReactNode[];
  images: SvgComponent[];
};

function Slide({ illustration, line1, line2, features, images }: SlideProps) {
  return (
    <div className="col h-full">
      <img src={illustration} style={{ maxHeight: '50vh' }} className="mx-auto object-cover" />

      {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
      <div className="ml-24 grid flex-1 grid-cols-[auto_1fr] grid-rows-[auto_auto_1fr] [&>*]:border-l [&>*]:border-t">
        <div className={clsx(gradientText, 'col-span-2 inline-block')}>{line1}</div>

        <div className="row-span-2 p-6">
          {images.map((Image, index) => (
            <Image key={index} className="w-14" />
          ))}
        </div>

        <div className={gradientText}>{line2}</div>

        <div className="p-4 text-lg text-dim">
          {features.map((feature, index) => (
            <div key={index}>{feature}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
