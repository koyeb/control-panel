import { useEffect, useRef, useState } from 'react';

import { ProgressBar } from '@koyeb/design-system';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('pages.database.layout.databaseStarting');

type DatabaseStartingProps = {
  isStarting: boolean;
  onCompleted: () => void;
};

export function DatabaseStarting(props: DatabaseStartingProps) {
  const progress = useProgress(props);

  return (
    <div className="col mx-auto w-full max-w-lg justify-center gap-2 py-6 text-center">
      <p className="text-lg font-medium">
        <T id="title" />
      </p>

      <p className="text-dim">
        <T id="description" />
      </p>

      <ProgressBar progress={progress} className="mt-4" />
    </div>
  );
}

function useProgress({ isStarting, onCompleted }: DatabaseStartingProps, interpolate = easeOutSine) {
  const total = useProgress.total;
  const [progress, setProgress] = useState(0);
  const start = useRef(now());

  useEffect(() => {
    function handler() {
      if (!isStarting) {
        setProgress((p) => (p < 1 ? Math.min(1, p + 0.05) : p));
        return;
      }

      const elapsed = now() - start.current;
      const progress = interpolate(Math.min(1, elapsed / total));

      if (progress < 0.9) {
        setProgress(progress);
      } else {
        setProgress(0.9);
      }
    }

    const interval = window.setInterval(handler, 100);

    return () => {
      window.clearInterval(interval);
    };
  }, [isStarting, interpolate, total]);

  useEffect(() => {
    if (!isStarting) {
      const elapsed = now() - start.current;

      if (elapsed < 1000) {
        onCompleted();
      } else if (progress === 1) {
        const timeout = window.setTimeout(onCompleted, 1000);

        return () => {
          window.clearTimeout(timeout);
        };
      }
    }
  }, [isStarting, onCompleted, progress]);

  return progress;
}

useProgress.total = 30 * 1000;

function easeOutSine(x: number): number {
  return Math.sin((x * Math.PI) / 2);
}

function now() {
  return new Date().getTime();
}
