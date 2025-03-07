import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.authentication');

export function Separator() {
  return (
    <div className="row my-6 items-center justify-center">
      <hr className="flex-1 border-[#9F9F9F]/30" />

      <span className="px-6 text-xs text-[#9F9F9F]">
        <T id="or" />
      </span>

      <hr className="flex-1 border-[#9F9F9F]/30" />
    </div>
  );
}
