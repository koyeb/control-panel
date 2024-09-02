import clsx from 'clsx';

import { IconExternalLink } from 'src/components/icons';

import { ExternalLink } from './link';

type DocumentationLinkProps = {
  path: `/docs/${string}`;
  className?: string;
  children: React.ReactNode;
};

export function DocumentationLink({ path, className, children }: DocumentationLinkProps) {
  return (
    <ExternalLink openInNewTab href={`https://koyeb.com${path}`} className={clsx('text-link', className)}>
      {children}
      <IconExternalLink className="inline-block h-4 align-middle" />
    </ExternalLink>
  );
}
