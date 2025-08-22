import { TextSkeleton } from 'src/components/skeleton';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.serviceCreation.review');

export function Tips() {
  const isPending = false as boolean;

  return (
    <div className="card hidden gap-2 p-4 xl:col">
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
