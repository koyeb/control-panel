import { Dialog, DialogFooter, DialogHeader, useDialogContext } from 'src/components/dialog';
import { ExternalLink, ExternalLinkButton } from 'src/components/link';
import { tallyForms, useTallyLink } from 'src/hooks/tally';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('components.instanceSelector.actions.requestQuotaIncreaseDialog');

export function RequestQuotaIncreaseDialog() {
  const instance = useDialogContext('RequestQuotaIncrease');
  const tallyLink = useTallyLink(tallyForms.getInTouch);

  return (
    <Dialog id="RequestQuotaIncrease" className="col w-full max-w-xl gap-4">
      <DialogHeader title={<T id="title" />} />

      <p>
        <T id="line1" values={{ instance: instance?.displayName }} />
      </p>

      <p>
        <T
          id="line2"
          values={{
            link: (children) => (
              <ExternalLink openInNewTab href={tallyLink} className="underline">
                {children}
              </ExternalLink>
            ),
          }}
        />
      </p>

      <DialogFooter>
        <ExternalLinkButton openInNewTab href={tallyLink}>
          <T id="cta" />
        </ExternalLinkButton>
      </DialogFooter>
    </Dialog>
  );
}
