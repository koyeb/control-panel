import { useQuery } from '@tanstack/react-query';

import { Spinner } from '@koyeb/design-system';
import { useApiQueryFn } from 'src/api/use-api';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('onboarding.automaticReview');

export function AutomaticReview() {
  useQuery({
    ...useApiQueryFn('getCurrentOrganization'),
    refetchInterval: 1000,
  });

  return (
    <div className="row justify-center gap-4">
      <Spinner className="size-6" />
      <p className="text-base">
        <T id="pending" />
      </p>
    </div>
  );
}
