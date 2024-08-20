import { TextSkeleton } from 'src/components/skeleton';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('serviceCreation.review');

export function Tips() {
  const isPending = false;

  return (
    <div className="card xl:col hidden gap-2 p-4">
      <span className="font-medium">
        <T id="tips.title" />
      </span>

      {isPending && (
        <>
          <TextSkeleton width="full" />
          <TextSkeleton width={12} />
        </>
      )}

      {!isPending && (
        <span className="text-dim">
          <T id="tips.fallback" />
        </span>
      )}
    </div>
  );
}
