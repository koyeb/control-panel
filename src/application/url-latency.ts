export async function getUrlLatency(url: string) {
  return new Promise<number | null>((resolve) => {
    const [observe, unsubscribe] = observeResources((entries) => {
      const entry = entries.find((entry) => entry.url === url);

      if (entry) {
        unsubscribe();
        resolve(entry.latency);
      }
    });

    observe();

    fetch(url, { mode: 'no-cors' }).catch(() => {
      unsubscribe();
      resolve(null);
    });
  });
}

type ResourceTiming = {
  url: string;
  latency: number;
};

function observeResources(cb: (entry: Array<ResourceTiming>) => void): [() => void, () => void] {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries().filter(isPerformanceResourceTiming).map(transformResourceTiming);

    cb(entries);
  });

  return [() => observer.observe({ type: 'resource', buffered: true }), () => observer.disconnect()];
}

function isPerformanceResourceTiming(
  this: void,
  entry: PerformanceEntry,
): entry is PerformanceResourceTiming {
  return entry instanceof PerformanceResourceTiming;
}

function transformResourceTiming(this: void, entry: PerformanceResourceTiming): ResourceTiming {
  let latency = entry.responseStart - entry.requestStart;

  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Timing-Allow-Origin
  if (latency === 0) {
    latency = entry.duration;
  }

  return {
    url: entry.name,
    latency,
  };
}
