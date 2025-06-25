import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.authentication');

export function Separator() {
  return (
    <div className="my-6 row items-center justify-center">
      <hr className="flex-1 border-zinc-400/40" />

      <span className="px-6 text-xs text-dim/80">
        <T id="or" />
      </span>

      <hr className="flex-1 border-zinc-400/40" />
    </div>
  );
}
