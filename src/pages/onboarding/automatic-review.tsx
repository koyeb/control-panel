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
    <section className="row flex-1 items-center justify-center gap-2">
      <Spinner className="size-5" />
      <T id="pending" />
    </section>
  );
}
