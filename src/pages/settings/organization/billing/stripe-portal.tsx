import { Button, Spinner } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';

import { apiMutation, useOrganization } from 'src/api';
import { SectionHeader } from 'src/components/section-header';
import { IconSquareArrowOutUpRight } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.organizationSettings.billing.stripePortal');

export function StripePortal() {
  const organization = useOrganization();

  const mutation = useMutation({
    ...apiMutation('get /v1/billing/manage', {}),
    onSuccess({ url }) {
      window.open(url, '_blank');
    },
  });

  const Icon = mutation.isPending ? Spinner : IconSquareArrowOutUpRight;

  return (
    <section className="col items-start gap-4">
      <SectionHeader title={<T id="title" />} description={<T id="description" />} />

      <Button color="gray" onClick={() => mutation.mutate()}>
        <T id="cta" />
        <Icon className="size-4" />
      </Button>

      {!organization?.currentSubscriptionId && (
        <p className="border-l-4 border-green/50 pl-3 text-xs text-dim">
          <T id="upgradeRequired" />
        </p>
      )}
    </section>
  );
}
