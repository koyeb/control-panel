import { Alert } from '@koyeb/design-system';
import { useManageBillingQuery, useSubscriptionQuery } from 'src/api/hooks/billing';
import { useOrganizationUnsafe } from 'src/api/hooks/session';
import { useIdenfyLink } from 'src/application/idenfy';
import { ExternalLink } from 'src/components/link';
import { useTallyDialog } from 'src/hooks/tally';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('layouts.main');

export function GlobalAlert() {
  const organization = useOrganizationUnsafe();
  const subscriptionQuery = useSubscriptionQuery(organization?.latestSubscriptionId);

  if (organization?.statusMessage === 'reviewing_account') {
    return <AccountUnderReviewAlert />;
  }

  if (subscriptionQuery.data?.hasPaymentFailure) {
    return <PaymentFailureAlert />;
  }

  if (subscriptionQuery.data?.hasPendingUpdate) {
    return <PendingUpdateAlert />;
  }

  return null;
}

function AccountUnderReviewAlert() {
  const idenfyLink = useIdenfyLink();
  const tally = useTallyDialog('wQRgBY');

  return (
    <Alert
      className="mb-4"
      variant="warning"
      description={
        <T
          id="accountUnderReview"
          values={{
            link: (children) =>
              idenfyLink ? (
                <ExternalLink openInNewTab className="underline" href={idenfyLink}>
                  {children}
                </ExternalLink>
              ) : (
                <button type="button" className="underline" onClick={tally.openPopup}>
                  {children}
                </button>
              ),
          }}
        />
      }
    />
  );
}

function PaymentFailureAlert() {
  return (
    <Alert
      className="mb-4"
      variant="warning"
      description={
        <T id="paymentFailure" values={{ stripe: (children) => <StripePortal>{children}</StripePortal> }} />
      }
    />
  );
}

function PendingUpdateAlert() {
  return (
    <Alert
      className="mb-4"
      variant="warning"
      description={
        <T
          id="subscriptionHasPendingUpdate"
          values={{ stripe: (children) => <StripePortal>{children}</StripePortal> }}
        />
      }
    />
  );
}

function StripePortal({ children }: { children: React.ReactNode }) {
  const manageBillingQuery = useManageBillingQuery();

  if (!manageBillingQuery.isSuccess || manageBillingQuery.data === null) {
    return children;
  }

  return (
    <ExternalLink openInNewTab href={manageBillingQuery.data.url} className="focusable rounded font-semibold">
      {children}
    </ExternalLink>
  );
}
