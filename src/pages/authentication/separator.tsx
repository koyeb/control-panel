import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.authentication');

export function Separator() {
  return (
    <div className="row my-6 items-center justify-center">
      <hr className="flex-1 border-strong/40" />

      <span className="px-6 text-xs text-dim/80">
        <T id="or" />
      </span>

      <hr className="flex-1 border-strong/40" />
    </div>
  );
}
