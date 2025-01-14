import { useInstance } from 'src/api/hooks/catalog';
import { Dialog, DialogHeader } from 'src/components/dialog';
import { ExternalLink, ExternalLinkButton } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.serviceForm');

export function RestrictedGpuDialog({ instanceIdentifier }: { instanceIdentifier: string | null }) {
  const instance = useInstance(instanceIdentifier);
  const link = 'https://app.reclaim.ai/m/koyeb-intro/short-call';

  return (
    <Dialog id="RestrictedGpu" className="col w-full max-w-xl gap-4">
      <DialogHeader title={<T id="gpuRestrictedDialog.title" />} />

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
