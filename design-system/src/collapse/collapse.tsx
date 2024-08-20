import clsx from 'clsx';
import { useLayoutEffect, useRef, useState } from 'react';

import { useElementSize } from '../utils/use-element-size';

type CollapseProps = {
  isExpanded: boolean;
  forceMount?: true;
  children: React.ReactNode;
};

export function Collapse({ isExpanded, forceMount, children }: CollapseProps) {
  const [transitioning, setTransitioning] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useUpdateLayoutEffect(() => {
    setTransitioning(true);
  }, [isExpanded]);

  const { height } = useElementSize(ref);

  return (
    <div
      // eslint-disable-next-line tailwindcss/no-arbitrary-value
      className={clsx('overflow-hidden transition-[max-height] will-change-[max-height]')}
      style={{ maxHeight: isExpanded ? height : 0 }}
      onTransitionEnd={() => setTransitioning(false)}
    >
      <div ref={setRef} className={clsx('overflow-hidden', !isExpanded && !transitioning && 'hidden')}>
        {(isExpanded || transitioning || forceMount) && children}
      </div>
    </div>
  );
}

function useUpdateLayoutEffect(effect: React.EffectCallback, deps: React.DependencyList) {
  const isFirstRender = useRef(true);

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    } else {
      effect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
