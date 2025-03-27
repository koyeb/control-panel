import { Tooltip } from '@koyeb/design-system';
import type { CatalogAvailability } from 'src/api/model';
import { IconGlobe } from 'src/components/icons';
import { createTranslate, TranslateEnum } from 'src/intl/translate';

const T = createTranslate('components.instanceSelector');

export function CatalogAvailability({ availability }: { availability: CatalogAvailability }) {
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
          <IconGlobe className="size-4" />
          <TranslateEnum enum="catalogAvailability" value={availability} />
        </div>
      )}
    </Tooltip>
  );
}
