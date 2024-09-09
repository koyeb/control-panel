import { useQuery } from '@tanstack/react-query';

import { useUserUnsafe } from 'src/api/hooks/session';
import { getConfig } from 'src/application/config';
import { useTallyDialog } from 'src/hooks/tally';
import { Translate } from 'src/intl/translate';
import { SecondaryLayout } from 'src/layouts/secondary/secondary-layout';

import { ExternalLink } from './link';

const T = Translate.prefix('errorBoundary.accountLocked');

export function AccountLocked() {
  const user = useUserUnsafe();
  const { onOpen } = useTallyDialog('wQRgBY');

  return (
    <SecondaryLayout className="col mx-auto max-w-xl gap-4 text-center">
      <div className="typo-heading">
        <T id="title" />
      </div>

      <div className="text-xs font-medium text-dim">
        <T
          id="line1"
          values={{
            terms: (children) => (
              <ExternalLink openInNewTab href="https://www.koyeb.com/docs/legal/terms" className="text-link">
                {children}
              </ExternalLink>
            ),
          }}
        />
      </div>

      <div className="text-dim">
        <T id="line2" />
      </div>

      <div className="text-dim">
        <T
          id="line3"
          values={{
            link: (children) =>
              user ? (
                <IdenfyLink userId={user.id}>{children}</IdenfyLink>
              ) : (
                <button type="button" className="text-link" onClick={onOpen}>
                  {children}
                </button>
              ),
          }}
        />
      </div>
    </SecondaryLayout>
  );
}

function IdenfyLink({ userId, children }: { userId: string; children: React.ReactNode }) {
  const { idenfyServiceBaseUrl } = getConfig();

  const query = useQuery({
    queryKey: ['idenfy', idenfyServiceBaseUrl, userId],
    async queryFn() {
      const response = await fetch(`${idenfyServiceBaseUrl}/${userId}`, { method: 'POST' });
      return response.text();
    },
  });

  if (!query.isSuccess) {
    return null;
  }

  return (
    <ExternalLink
      openInNewTab
      className="text-link"
      href={`https://ivs.idenfy.com/api/v2/redirect?authToken=${query.data}`}
    >
      {children}
    </ExternalLink>
  );
}
