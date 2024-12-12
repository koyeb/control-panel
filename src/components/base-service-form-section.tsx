import clsx from 'clsx';

import { AccordionSection } from '@koyeb/design-system';
import { IconChevronDown } from 'src/components/icons';
import { Shortcut } from 'src/components/shortcut';

type ExpandSource = 'click' | 'keydown' | 'shortcut';

type BaseServiceFormSectionProps = {
  expanded: boolean;
  expand: (source: ExpandSource) => void;
  keepMounted?: boolean;
  title: React.ReactNode;
  expandedTitle: React.ReactNode;
  description: React.ReactNode;
  shortcut?: number;
  hasError?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function BaseServiceFormSection({
  expanded,
  expand,
  keepMounted,
  title,
  expandedTitle,
  description,
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
          title={expanded ? expandedTitle : title}
          description={description}
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
        expanded && 'bg-gradient-to-b from-inverted/5 to-inverted/0',
        hasError && 'bg-gradient-to-b from-red/10 to-red/0',
      )}
      onClick={() => expand('click')}
    >
      <div>
        <IconChevronDown
          tabIndex={0}
          onKeyDown={(event) => event.key === ' ' && expand('keydown')}
          className={clsx('focusable text-icon size-5 rounded', expanded && 'rotate-180')}
        />
      </div>

      <div className="col min-w-0 gap-1">
        <span className="text-xs text-dim">{description}</span>
        <span className="font-medium">{title}</span>
      </div>

      {shortcut !== undefined && (
        <div className="ms-auto">
          <Shortcut keystrokes={['meta', shortcut]} onTrigger={() => expand('shortcut')} />
        </div>
      )}
    </header>
  );
}
