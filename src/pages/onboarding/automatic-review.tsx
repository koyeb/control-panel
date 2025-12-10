import { Spinner } from '@koyeb/design-system';
import { useQuery } from '@tanstack/react-query';

import { apiQuery } from 'src/api';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.onboarding.automaticReview');

export function AutomaticReview() {
  useQuery({
    ...apiQuery('get /v1/account/organization', {}),
    refetchInterval: 1000,
  });

  return (
    <div className="row items-center gap-2">
      <Spinner className="size-5" />
      <p className="text-base">
        <T id="pending" />
      </p>
    </div>
  );
}
