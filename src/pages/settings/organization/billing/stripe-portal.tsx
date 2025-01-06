import { Alert } from '@koyeb/design-system';
import { useManageBillingQuery } from 'src/api/hooks/billing';
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
    <section className="col gap-6">
      <div className="row items-start gap-8">
        <SectionHeader title={<T id="title" />} description={<T id="description" />} />

        <LinkButton
          disabled={query.isPending || query.data === null}
          href={query.data?.url}
          component="a"
          target="_blank"
          rel="noopener noreferrer"
        >
          <T id="cta" />
        </LinkButton>
      </div>

      {query.data === null && <Alert variant="info" description={<T id="noBillingInformation" />} />}
    </section>
  );
}
