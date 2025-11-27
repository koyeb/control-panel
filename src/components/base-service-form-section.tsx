import { AccordionSection } from '@koyeb/design-system';
import clsx from 'clsx';

import { Shortcut } from 'src/components/shortcut';
import { IconChevronDown } from 'src/icons';

type ExpandSource = 'click' | 'keydown' | 'shortcut';

type BaseServiceFormSectionProps = {
  title: React.ReactNode;
  summary: React.ReactNode;
  action: React.ReactNode;
  expanded: boolean;
  onExpand: (source: ExpandSource) => void;
  keepMounted?: boolean;
  shortcut?: number;
  hasError?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function BaseServiceFormSection({
  title,
  summary,
  action,
  expanded,
  onExpand: expand,
  keepMounted,
  shortcut,
  hasError,
  className,
  children,
}: BaseServiceFormSectionProps) {
  return (
    <AccordionSection
      keepMounted={keepMounted}
      header={
        <Header
          expanded={expanded}
          hasError={hasError}
          title={title}
          description={expanded ? action : summary}
          shortcut={shortcut?.toString()}
          expand={expand}
        />
      }
      isExpanded={expanded}
      hasError={hasError}
    >
      <div className={clsx('px-5 py-4', className)}>{children}</div>
    </AccordionSection>
  );
}

type HeaderProps = {
  expanded: boolean;
  hasError?: boolean;
  title: React.ReactNode;
  description: React.ReactNode;
  shortcut?: string;
  expand: (source: ExpandSource) => void;
};

function Header({ expanded, hasError, title, description, shortcut, expand }: HeaderProps) {
  return (
    <header
      className={clsx(
        'row cursor-pointer items-center gap-6 px-5 py-2',
        expanded && 'bg-linear-to-b from-inverted/5 to-inverted/0',
        hasError && 'bg-linear-to-b from-red/10 to-red/0',
      )}
      onClick={() => expand('click')}
    >
      <div className="col min-w-0 gap-1">
        <span className="font-medium">{title}</span>
        <span className="text-xs text-dim">{description}</span>
      </div>

      {shortcut !== undefined && (
        <div className="ms-auto">
          <Shortcut keystrokes={['meta', shortcut]} onTrigger={() => expand('shortcut')} />
        </div>
      )}

      <div>
        <IconChevronDown
          tabIndex={0}
          onKeyDown={(event) => event.key === ' ' && expand('keydown')}
          className={clsx('size-5 rounded-sm text-icon focusable', expanded && 'rotate-180')}
        />
      </div>
    </header>
  );
}
