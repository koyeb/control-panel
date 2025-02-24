import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';

import { Stepper } from '@koyeb/design-system';
import { stopPropagation } from 'src/application/dom-events';
import { createTranslate } from 'src/intl/translate';
import { createArray } from 'src/utils/arrays';

import deployment from './images/deployment.svg';
import map from './images/map.svg';
import scaling from './images/scaling.png';

const T = createTranslate('layouts.authentication');

const slides = ['zeroConfig', 'seamlessDeployment', 'anyHardware'] as const;

const illustrations = {
  zeroConfig: { src: scaling, width: 488 },
  seamlessDeployment: { src: deployment },
  anyHardware: { src: map },
};

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

  return (
    <div
      className="dark relative h-full overflow-hidden rounded-2xl bg-[#111111] [&_*]:border-[#1E1E1E]"
      onClick={next}
    >
      {createArray(3, (idx) => (
        <Slide key={idx} show={idx === index} slide={slides[index]} />
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

function Slide({ show, slide }: { show: boolean; slide: (typeof slides)[number] }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="col absolute inset-0"
        >
          <div className="col flex-1 items-center justify-center">
            <img {...illustrations[slide]} />
          </div>

          {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
          <div className="ml-24 grid flex-1 grid-cols-[auto_1fr] grid-rows-[auto_auto_1fr] [&>*]:border-l [&>*]:border-t">
            <div className={clsx(gradientText, 'col-span-2 inline-block')}>
              <T id={`${slide}.line1`} />
            </div>

            <div className="row-span-2 p-6">image</div>

            <div className={gradientText}>
              <T id={`${slide}.line2`} />
            </div>

            <div className="p-4 text-lg text-dim">
              {createArray(3, (index) => (
                <div key={index}>{<T id={`${slide}.feature${(index + 1) as 1 | 2 | 3}`} />}</div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
