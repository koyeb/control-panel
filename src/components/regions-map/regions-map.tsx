import clsx from 'clsx';

import { CatalogRegion } from 'src/api/model';

import map from './map.png';

const regionStyles: Record<string, { position: React.CSSProperties; arrow: ArrowProps }> = {
  fra: {
    position: { left: '52%', bottom: '68%' },
    arrow: { placement: 'bottom', left: '40%' },
  },
  par: {
    position: { left: '48%', top: '38%' },
    arrow: { placement: 'top', left: '50%' },
  },
  was: {
    position: { left: '22%', bottom: '63%' },
    arrow: { placement: 'bottom', left: '70%' },
  },
  sfo: {
    position: { left: '18%', top: '46%' },
    arrow: { placement: 'top', left: '40%' },
  },
  tyo: {
    position: { left: '82%', bottom: '58%' },
    arrow: { placement: 'bottom', left: '65%' },
  },
  sin: {
    position: { left: '74%', top: '66%' },
    arrow: { placement: 'top', left: '50%' },
  },
  'aws-us-east-1': {
    position: { left: '27%', bottom: '64%' },
    arrow: { placement: 'bottom', left: '50%' },
  },
};

type RegionsMapProps = {
  regions: CatalogRegion[];
  className?: string;
  renderRegion: (region: CatalogRegion) => React.ReactNode;
};

export function RegionsMap({ regions, className, renderRegion }: RegionsMapProps) {
  return (
    <div className={clsx('relative mx-auto size-fit', className)}>
      <img src={map} />
      {regions.map((region) => (
        <RegionItem key={region.identifier} region={region} renderRegion={renderRegion} />
      ))}
    </div>
  );
}

type RegionsItemProps = {
  region: CatalogRegion;
  renderRegion: (region: CatalogRegion) => React.ReactNode;
};

function RegionItem({ region, renderRegion }: RegionsItemProps) {
  const styles = regionStyles[region.identifier];

  if (!styles) {
    return null;
  }

  return (
    <div key={region.identifier} style={styles.position} className="absolute -translate-x-1/2">
      {renderRegion(region)}
      <Arrow {...styles.arrow} />
    </div>
  );
}

type ArrowProps = {
  placement: 'top' | 'bottom';
  left: string;
};

function Arrow({ placement, left }: ArrowProps) {
  return (
    <svg
      viewBox="0 0 16 8"
      className={clsx(
        'absolute bottom-0 h-2 w-4 -translate-x-1/2 fill-inverted/50',
        placement === 'top' && 'top-0 -translate-y-full rotate-180',
        placement === 'bottom' && 'bottom-0 translate-y-full',
      )}
      style={{ left }}
    >
      <path d="M 0 0 h 16 l -8 8 L 0 0" />
    </svg>
  );
}
