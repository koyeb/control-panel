import { Dialog } from '@koyeb/design-system';
import { useInstance } from 'src/api/hooks/catalog';
import { ExternalLink, ExternalLinkButton } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.serviceForm');

type RestrictedGpuDialogProps = {
  open: boolean;
  onClose: () => void;
  instanceIdentifier: string | null;
};

export function RestrictedGpuDialog({ open, onClose, instanceIdentifier }: RestrictedGpuDialogProps) {
  const instance = useInstance(instanceIdentifier);
  const link = 'https://app.reclaim.ai/m/koyeb-intro/short-call';

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      width="lg"
      title={<T id="gpuRestrictedDialog.title" />}
      className="col gap-4"
    >
      <p>
        <T id="gpuRestrictedDialog.line1" values={{ instance: instance?.displayName }} />
      </p>

      <p>
        <T
          id="gpuRestrictedDialog.line2"
          values={{
            link: (children) => (
              <ExternalLink openInNewTab href={link} className="underline">
                {children}
              </ExternalLink>
            ),
          }}
        />
      </p>

      <div className="row mt-2 items-center justify-end gap-4">
        <ExternalLinkButton openInNewTab href={link}>
          <T id="gpuRestrictedDialog.cta" />
        </ExternalLinkButton>
      </div>
    </Dialog>
  );
}
