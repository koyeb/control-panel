import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import { useState, useCallback, useEffect } from 'react';

import { Stepper } from '@koyeb/design-system';
import { stopPropagation } from 'src/application/dom-events';
import { createArray } from 'src/utils/arrays';

import deployment from './images/deployment.svg';
import map from './images/map.svg';
import scaling from './images/scaling.svg';

export function Slides() {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    setIndex((index + 1) % content.length);
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
        <Slide key={idx} show={idx === index} content={content[index]!} />
      ))}

      <div className="row absolute inset-x-0 bottom-12 justify-center" onClick={stopPropagation}>
        <Stepper totalSteps={3} activeStep={index} onClick={setIndex} />
      </div>
    </div>
  );
}

const gradientText = clsx(
  'bg-gradient-to-tr from-[#D1D8DC] via-[#B0A6B6] to-[#E2E7E9] bg-clip-text text-transparent',
);

function Slide({ show, content }: { show: boolean; content: SlideContent }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="col absolute inset-0"
        >
          <div className="col flex-1 items-center justify-center">
            <img src={content.illustration} />
          </div>

          <div className="col ml-24 flex-1 border-l border-t">
            <div className={clsx('inline-block px-6 py-3 text-5xl font-semibold', gradientText)}>
              {content.line1}
            </div>

            <div className="row flex-1 border-t">
              <div className="p-6">image</div>

              <div className="col flex-1 border-l">
                <div className={clsx('px-6 py-3 text-5xl font-semibold', gradientText)}>{content.line2}</div>

                <div className="border-t">
                  <div className="p-4 text-lg text-dim">
                    {content.features.map((feature, index) => (
                      <div key={index}>{feature}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type SlideContent = {
  illustration: string;
  line1: string;
  line2: string;
  features: string[];
};

const content: SlideContent[] = [
  {
    illustration: scaling,
    line1: 'Zero config',
    line2: 'infrastructure',
    features: [
      'Smart and fast autoscaling on GPU and CPU',
      'Zero-downtime deployments',
      'Built-in observability',
    ],
  },
  {
    illustration: deployment,
    line1: 'Seamless',
    line2: 'deployment',
    features: [
      'Instant API endpoint',
      'Build and deploy anything from web apps to inference',
      'Native HTTP/2, WebSocket, and gRPC support',
    ],
  },
  {
    illustration: map,
    line1: 'Any hardware',
    line2: 'anywhere',
    features: [
      'High-performance CPUs, GPUs, and accelerators',
      'Available globally across 10 regions and containers',
      'Ultra-fast NVME storage',
    ],
  },
];
