import { useInstance } from 'src/api/hooks/catalog';
import { Dialog, DialogFooter, DialogHeader } from 'src/components/dialog';
import { ExternalLink, ExternalLinkButton } from 'src/components/link';
import { tallyForms, useTallyLink } from 'src/hooks/tally';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.serviceForm');

export function QuotaIncreaseRequestDialog({ instanceIdentifier }: { instanceIdentifier: string | null }) {
  const instance = useInstance(instanceIdentifier);
  const tallyLink = useTallyLink(tallyForms.getInTouch);

  return (
    <Dialog id="QuotaIncreaseRequest" className="col w-full max-w-xl gap-4">
      <DialogHeader title={<T id="quotaIncreaseRequestDialog.title" />} />

      <p>
        <T id="quotaIncreaseRequestDialog.line1" values={{ instance: instance?.displayName }} />
      </p>

      <p>
        <T
          id="quotaIncreaseRequestDialog.line2"
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
          <T id="quotaIncreaseRequestDialog.cta" />
        </ExternalLinkButton>
      </DialogFooter>
    </Dialog>
  );
}
