import clsx from 'clsx';
import { useState } from 'react';

import { container } from 'src/application/container';
import { ExternalLink } from 'src/components/link';
import { IconX } from 'src/icons';
import { TOKENS } from 'src/tokens';

import BackgroundLeft from './background-left.svg?react';
import BackgroundRight from './background-right.svg?react';

const storage = container.resolve(TOKENS.storage);
const storedDismissedIds = storage.value<Record<string, boolean>>('dismissed-banner-id', JSON);
const dismissedIds = storedDismissedIds.read() ?? {};

type HomePageBannerProps = {
  id: string;
  title: string;
  description: string;
  cta: { label: string; href: string };
  className?: string;
};

export function HomePageBanner({ id, title, description, cta, className }: HomePageBannerProps) {
  const [dismissed, setDismissed] = useState(Boolean(dismissedIds[id]));

  if (dismissed) {
    return null;
  }

  const handleDismiss = () => {
    storedDismissedIds.write({ ...dismissedIds, [id]: true });
    setDismissed(true);
  };

  return (
    <div className={clsx('relative col gap-4 overflow-hidden rounded-lg bg-green/10 p-6', className)}>
      <BackgroundLeft className="absolute inset-y-0 -left-24 -z-10 h-full md:left-0" />
      <BackgroundRight className="absolute inset-y-0 -right-24 -z-10 h-full md:right-0" />

      <button className="absolute top-6 right-6" onClick={handleDismiss}>
        <IconX className="size-4" />
      </button>

      <div className="col gap-1">
        <div className="mr-8 text-2xl font-bold text-green">{title}</div>
        <div className="text-base text-green">{description}</div>
      </div>

      <ExternalLink
        href={cta.href}
        className="row h-8 items-center justify-center rounded-md bg-neutral px-3 font-medium md:self-start"
      >
        {cta.label}
      </ExternalLink>
    </div>
  );
}
