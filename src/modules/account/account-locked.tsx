import { useIdenfyLink } from 'src/application/idenfy';
import { ExternalLink } from 'src/components/link';
import { useTallyDialog } from 'src/hooks/tally';
import { createTranslate } from 'src/intl/translate';
import { SecondaryLayout } from 'src/layouts/secondary/secondary-layout';

const T = createTranslate('modules.account.accountLocked');

export function AccountLocked() {
  const idenfyLink = useIdenfyLink();
  const tally = useTallyDialog('wQRgBY');

  return (
    <SecondaryLayout className="mx-auto col max-w-xl gap-4 text-center">
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
              idenfyLink ? (
                <ExternalLink openInNewTab className="text-link" href={idenfyLink}>
                  {children}
                </ExternalLink>
              ) : (
                <button type="button" className="text-link" onClick={tally.openPopup}>
                  {children}
                </button>
              ),
          }}
        />
      </div>
    </SecondaryLayout>
  );
}
