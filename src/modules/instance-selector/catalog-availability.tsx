import { TranslateEnum, createTranslate } from 'src/intl/translate';
import type { CatalogAvailability } from 'src/model';

const T = createTranslate('components.instanceSelector');

export function CatalogAvailability({ availability }: { availability: CatalogAvailability }) {
  return (
    <T
      id="availability"
      values={{ availability: <TranslateEnum enum="catalogAvailability" value={availability} /> }}
    />
  );
}
