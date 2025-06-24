import { useQuery } from '@tanstack/react-query';

import { Spinner } from '@koyeb/design-system';
import { useApiQueryFn } from 'src/api/use-api';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.onboarding.automaticReview');

export function AutomaticReview() {
  useQuery({
    ...useApiQueryFn('getCurrentOrganization'),
    refetchInterval: 1000,
  });

  return (
    <div className="row h-screen flex-1 items-center justify-center gap-2 overflow-auto p-3">
      <Spinner className="size-5" />
      <p className="text-base">
        <T id="pending" />
      </p>
    </div>
  );
}
