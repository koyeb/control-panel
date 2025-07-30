import { Spinner } from '@koyeb/design-system';

import { useIdenfyLink } from 'src/application/idenfy';
import { DocumentTitle } from 'src/components/document-title';
import { ExternalLink } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';
import { SecondaryLayout } from 'src/layouts/secondary/secondary-layout';

const T = createTranslate('modules.account.accountLocked');

export function AccountLocked() {
  return (
    <SecondaryLayout className="mx-auto col max-w-xl gap-4 text-center">
      <DocumentTitle />

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
        <T id="line3" values={{ link: (children) => <ValidateAccount>{children}</ValidateAccount> }} />
      </div>
    </SecondaryLayout>
  );
}

function ValidateAccount({ children }: { children: React.ReactNode }) {
  const idenfyLink = useIdenfyLink();

  if (idenfyLink) {
    return (
      <ExternalLink openInNewTab className="text-link" href={idenfyLink}>
        {children}
      </ExternalLink>
    );
  }

  return (
    <span className="underline">
      {children}
      <Spinner className="ml-1 size-em" />
    </span>
  );
}
