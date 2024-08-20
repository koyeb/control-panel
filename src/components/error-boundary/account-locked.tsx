import { useTallyDialog } from 'src/hooks/tally';
import { Translate } from 'src/intl/translate';
import { SecondaryLayout } from 'src/layouts/secondary/secondary-layout';

import { ExternalLink } from '../link';

const T = Translate.prefix('errorBoundary.accountLocked');

export function AccountLocked() {
  const { onOpen } = useTallyDialog('wQRgBY');

  return (
    <SecondaryLayout className="col max-w-xl gap-4 text-center">
      <div className="typo-heading">
        <T id="title" />
      </div>

      <div className="text-xs text-dim">
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

      <div>
        <T id="line2" />
      </div>

      <div>
        <T
          id="line3"
          values={{
            validate: (children) => (
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
