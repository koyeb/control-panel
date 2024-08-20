import clsx from 'clsx';
import IconExternalLink from 'lucide-static/icons/external-link.svg?react';

import { ExternalLink } from './link';

type DocumentationLinkProps = {
  path: `/docs/${string}`;
  className?: string;
  children: React.ReactNode;
};

export function DocumentationLink({ path, className, children }: DocumentationLinkProps) {
  return (
    <ExternalLink
      openInNewTab
      href={`https://koyeb.com${path}`}
      className={clsx('text-link inline-flex flex-row items-center gap-1', className)}
    >
      {children}
      <IconExternalLink className="h-4" />
    </ExternalLink>
  );
}
