import { Stepper } from '@koyeb/design-system';
import clsx from 'clsx';
import { AnimatePresence, motion, wrap } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { stopPropagation } from 'src/application/dom-events';
import { SvgComponent } from 'src/application/types';
import { createTranslate } from 'src/intl/translate';

import anyHardware from './images/any-hardware.png';
import Dots from './images/dots.svg?react';
import Lines from './images/lines.svg?react';
import Progress from './images/progress.svg?react';
import seamlessDeployment from './images/seamless-deployment.png';
import zeroConfig from './images/zero-config.png';
import LogoEtoro from './logos/etoro.svg?react';
import LogoHuggingface from './logos/huggingface.svg?react';
import LogoMirakl from './logos/mirakl.svg?react';
import LogoNeon from './logos/neon.svg?react';
import LogoOllama from './logos/ollama.svg?react';
import LogoPhotoroom from './logos/photoroom.svg?react';
import LogoSimplismart from './logos/simplismart.svg?react';
import LogoUltralytics from './logos/ultralytics.svg?react';
import LogoZilliz from './logos/zilliz.svg?react';

// cSpell:ignore etoro huggingface mirakl ollama photoroom simplismart ultralytics zilliz populum

const T = createTranslate('layouts.authentication');

export default function Slides() {
  const slides = useMemo<[SlideProps, SlideProps, SlideProps]>(
    () => [
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
        logos: [LogoNeon, LogoEtoro, LogoSimplismart],
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
        logos: [LogoHuggingface, LogoOllama, LogoPhotoroom],
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
        logos: [LogoUltralytics, LogoZilliz, LogoMirakl],
      },
    ],
    [],
  );

  const [index, setIndex] = useState<0 | 1 | 2>(0);
  const key = useRef(0);
  const slide = slides[index];

  const next = useCallback(() => {
    setIndex(wrap(0, slides.length, index + 1) as 0 | 1 | 2);
    key.current = Math.random();
  }, [slides, index]);

  useEffect(() => {
    const interval = setInterval(next, 6 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [next]);

  return (
    <div className="dark col h-full rounded-2xl bg-neutral/95 **:border-border" onClick={next}>
      <div className="row justify-center py-8" onClick={stopPropagation}>
        <Stepper totalSteps={3} activeStep={index} onClick={(i) => setIndex(i as typeof index)} />
      </div>

      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence initial={false}>
          <Slide key={key.current} {...slide} />
        </AnimatePresence>
      </div>
    </div>
  );
}

const gradientText = clsx([
  'bg-linear-to-tr from-[#D1D8DC] via-[#B0A6B6] to-[#E2E7E9] bg-clip-text text-transparent',
  'text-5xl font-semibold',
  'px-6 py-3',
]);

type SlideProps = {
  illustration: string;
  line1: React.ReactNode;
  line2: React.ReactNode;
  features: React.ReactNode[];
  images: SvgComponent[];
  logos: SvgComponent[];
};

function Slide({ illustration, line1, line2, features, images, logos }: SlideProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', visualDuration: 0.4, bounce: 0.4 }}
      exit={{ opacity: 0, x: -50 }}
      className="absolute inset-0 col"
    >
      <img src={illustration} className="mx-auto" style={{ maxHeight: '40vh' }} />

      <div className="ml-24 grid flex-1 grid-cols-[auto_1fr] grid-rows-[auto_auto_1fr] *:border-t *:border-l">
        <div className={clsx(gradientText, 'col-span-2 inline-block')}>{line1}</div>

        <div className="row-span-2 p-6">
          {images.map((Image, index) => (
            <Image key={index} className="w-14" />
          ))}
        </div>

        <div className={gradientText}>{line2}</div>

        <div className="col p-4">
          <div className="text-lg text-dim">
            {features.map((feature, index) => (
              <div key={index}>{feature}</div>
            ))}
          </div>

          <CustomerLogos logos={logos} />
        </div>
      </div>
    </motion.div>
  );
}

function CustomerLogos({ logos }: { logos: SvgComponent[] }) {
  return (
    <div className="mt-auto col gap-3 py-6 text-gray">
      <div className="text-xs font-medium">
        <T id="argumentumAdPopulum" />
      </div>
      <div className="row max-w-lg flex-wrap gap-x-4 gap-y-3">
        {logos.map((Logo, index) => (
          <Logo key={index} className="h-5" />
        ))}
      </div>
    </div>
  );
}
