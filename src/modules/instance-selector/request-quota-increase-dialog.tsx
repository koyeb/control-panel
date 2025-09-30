import { Dialog, DialogFooter, DialogHeader } from 'src/components/dialog';
import { ExternalLink, ExternalLinkButton } from 'src/components/link';
import { tallyForms, useTallyLink } from 'src/hooks/tally';
import { createTranslate } from 'src/intl/translate';
import { CatalogInstance } from 'src/model';

const T = createTranslate('components.instanceSelector.actions.requestQuotaIncreaseDialog');

export function RequestQuotaIncreaseDialog({ instance }: { instance: CatalogInstance }) {
  const tallyLink = useTallyLink(tallyForms.getInTouch);

  return (
    <Dialog
      id="RequestQuotaIncrease"
      context={{ instanceId: instance.id }}
      className="col w-full max-w-xl gap-4"
    >
      <DialogHeader title={<T id="title" />} />

      <p>
        <T id="line1" values={{ instance: instance.displayName }} />
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
