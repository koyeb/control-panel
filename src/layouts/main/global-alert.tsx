import { useQuery } from '@tanstack/react-query';

import { Alert } from '@koyeb/design-system';
import { useManageBillingQuery, useSubscriptionQuery } from 'src/api/hooks/billing';
import { useOrganizationUnsafe, useUser } from 'src/api/hooks/session';
import { getConfig } from 'src/application/config';
import { ExternalLink } from 'src/components/link';
import { QueryGuard } from 'src/components/query-error';
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
  const user = useUser();
  const { idenfyServiceBaseUrl } = getConfig();

  const query = useQuery({
    queryKey: ['idenfy', idenfyServiceBaseUrl, user.id],
    async queryFn() {
      const response = await fetch(`${idenfyServiceBaseUrl}/${user.id}`, { method: 'POST' });
      return response.text();
    },
  });

  if (!query.isSuccess) {
    return <QueryGuard query={query} />;
  }

  return (
    <Alert
      className="mb-4"
      variant="warning"
      description={
        <T
          id="accountUnderReview"
          values={{
            link: (children) => (
              <ExternalLink
                openInNewTab
                className="underline"
                href={`https://ivs.idenfy.com/api/v2/redirect?authToken=${query.data}`}
              >
                {children}
              </ExternalLink>
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
