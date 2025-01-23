import { useManageBillingQuery } from 'src/api/hooks/billing';
import { useOrganization } from 'src/api/hooks/session';
import { IconSquareArrowOutUpRight } from 'src/components/icons';
import { LinkButton } from 'src/components/link';
import { QueryError } from 'src/components/query-error';
import { SectionHeader } from 'src/components/section-header';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.organizationSettings.billing.stripePortal');

export function StripePortal() {
  const organization = useOrganization();
  const query = useManageBillingQuery();

  if (query.isError) {
    return <QueryError error={query.error} />;
  }

  return (
    <section className="col items-start gap-4">
      <SectionHeader title={<T id="title" />} description={<T id="description" />} />

      <LinkButton
        disabled={query.isPending || query.data === undefined}
        href={query.data?.url}
        component="a"
        color="gray"
        target="_blank"
        rel="noopener noreferrer"
      >
        <T id="cta" />
        <IconSquareArrowOutUpRight className="size-4" />
      </LinkButton>

      {organization.plan === 'hobby' && (
        <p className="border-l-4 border-green/50 pl-3 text-xs text-dim">
          <T id="upgradeRequired" />
        </p>
      )}
    </section>
  );
}
