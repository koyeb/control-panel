import clsx from 'clsx';
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
import LogoEtoro from './logos/etoro.svg?react';
import LogoHuggingface from './logos/huggingface.svg?react';
import LogoMirakl from './logos/mirakl.svg?react';
import LogoNeon from './logos/neon.svg?react';
import LogoOllama from './logos/ollama.svg?react';
import LogoPhotoroom from './logos/photoroom.svg?react';
import LogoSimplismart from './logos/simplismart.svg?react';
import LogoUltralytics from './logos/ultralytics.svg?react';
import LogoZilliz from './logos/zilliz.svg?react';

const T = createTranslate('layouts.authentication');

export default function Slides() {
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
  ];

  return (
    <div className="col dark h-full rounded-2xl bg-[#111111] [&_*]:border-[#1E1E1E]" onClick={next}>
      <Helmet>
        {createArray(3, (i) => (
          <link rel="preload" href={props[i as 0 | 1 | 2].illustration} as="image" />
        ))}
      </Helmet>

      <div className="row justify-center py-8" onClick={stopPropagation}>
        <Stepper totalSteps={3} activeStep={index} onClick={(i) => setIndex(i as typeof index)} />
      </div>

      <Slide {...props[index]} />
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
  logos: SvgComponent[];
};

function Slide({ illustration, line1, line2, features, images, logos }: SlideProps) {
  return (
    <>
      <img src={illustration} className="mx-auto" style={{ maxHeight: '40vh' }} />

      {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
      <div className="ml-24 grid flex-1 grid-cols-[auto_1fr] grid-rows-[auto_auto_1fr] [&>*]:border-l [&>*]:border-t">
        <div className={clsx(gradientText, 'col-span-2 inline-block')}>{line1}</div>

        <div className="row-span-2 p-6">
          {images.map((Image, index) => (
            <Image key={index} className="w-14" />
          ))}
        </div>

        <div className={gradientText}>{line2}</div>

        <div className="col justify-between p-4">
          <div className="text-lg text-dim">
            {features.map((feature, index) => (
              <div key={index}>{feature}</div>
            ))}
          </div>

          <CustomerLogos logos={logos} />
        </div>
      </div>
    </>
  );
}

function CustomerLogos({ logos }: { logos: SvgComponent[] }) {
  return (
    <div className="col gap-3 py-6 text-[#71717b]">
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
