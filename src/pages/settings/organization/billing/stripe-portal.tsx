import { Alert } from '@koyeb/design-system';
import { useManageBillingQuery } from 'src/api/hooks/billing';
import { IconSquareArrowOutUpRight } from 'src/components/icons';
import { LinkButton } from 'src/components/link';
import { QueryError } from 'src/components/query-error';
import { SectionHeader } from 'src/components/section-header';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.organizationSettings.billing.stripePortal');

export function StripePortal() {
  const query = useManageBillingQuery();

  if (query.isError) {
    return <QueryError error={query.error} />;
  }

  return (
    <section className="col items-start gap-4">
      <SectionHeader title={<T id="title" />} description={<T id="description" />} />

      <LinkButton
        disabled={query.isPending || query.data === null}
        href={query.data?.url}
        component="a"
        color="gray"
        target="_blank"
        rel="noopener noreferrer"
      >
        <T id="cta" />
        <IconSquareArrowOutUpRight className="size-4" />
      </LinkButton>

      {query.data === null && <Alert variant="info" description={<T id="noBillingInformation" />} />}
    </section>
  );
}
