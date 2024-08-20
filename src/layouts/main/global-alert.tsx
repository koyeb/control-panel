import { Alert } from '@koyeb/design-system';
import { useManageBillingQuery, useSubscriptionQuery } from 'src/api/hooks/billing';
import { useOrganizationUnsafe } from 'src/api/hooks/session';
import { ExternalLink } from 'src/components/link';
import { useTallyDialog } from 'src/hooks/tally';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('layouts.main');

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
  const { onOpen } = useTallyDialog('wQRgBY');

  return (
    <Alert
      variant="warning"
      description={
        <T
          id="accountUnderReview"
          values={{
            form: (children) => (
              <button type="button" onClick={onOpen} className="underline">
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
