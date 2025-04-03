import { Tooltip } from '@koyeb/design-system';
import type { CatalogAvailability } from 'src/api/model';
import { SvgComponent } from 'src/application/types';
import { IconSignal, IconSignalHigh, IconSignalMedium } from 'src/components/icons';
import { createTranslate, TranslateEnum } from 'src/intl/translate';

const T = createTranslate('components.instanceSelector');

export function CatalogAvailability({ availability }: { availability: CatalogAvailability }) {
  const Icon = icons[availability];

  return (
    <Tooltip
      content={
        <T
          id="availabilityTooltip"
          values={{ availability: <TranslateEnum enum="catalogAvailability" value={availability} /> }}
        />
      }
    >
      {(props) => (
        <div {...props} className="row items-center gap-1">
          <Icon className="size-4" />
          <TranslateEnum enum="catalogAvailability" value={availability} />
        </div>
      )}
    </Tooltip>
  );
}

const icons: Record<CatalogAvailability, SvgComponent> = {
  unknown: IconSignalMedium,
  low: IconSignalMedium,
  medium: IconSignalHigh,
  high: IconSignal,
};
