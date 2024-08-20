import IconCheck from 'lucide-static/icons/check.svg?react';
import IconCopy from 'lucide-static/icons/copy.svg?react';
import { useEffect, useState } from 'react';

import { useClipboard } from 'src/hooks/clipboard';

type CopyIconButtonProps = React.ComponentProps<'button'> & {
  text: string;
  iconClassName?: string;
};

export function CopyIconButton({ text, iconClassName, ...props }: CopyIconButtonProps) {
  const copy = useClipboard();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 600);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [copied]);

  return (
    <button type="button" onClick={() => copy(text, () => setCopied(true))} {...props}>
      {!copied && <IconCopy className="size-full" />}
      {copied && <IconCheck className="size-full" />}
    </button>
  );
}
