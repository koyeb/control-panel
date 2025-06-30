import {
  FloatingOverlay,
  FloatingPortal,
  autoUpdate,
  useDismiss,
  useFloating,
  useInteractions,
  useTransitionStatus,
  useTransitionStyles,
} from '@floating-ui/react';
import { Button, useBreakpoint } from '@koyeb/design-system';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

import { IconMenu } from 'src/components/icons';
import { useUpdateEffect } from 'src/hooks/lifecycle';
import { useLocation } from 'src/hooks/router';

type LayoutProps = {
  banner: React.ReactNode;
  hasBanner: boolean;
  header: React.ReactNode;
  menu: React.ReactNode;
  menuCollapsed: React.ReactNode;
  main: React.ReactNode;
  context: React.ReactNode;
  contextExpanded: boolean;
};

export function Layout(props: LayoutProps) {
  const isMobile = !useBreakpoint('sm');

  if (isMobile) {
    return <LayoutMobile {...props} />;
  }

  return <LayoutTablet {...props} />;
}

function LayoutTablet({
  banner,
  hasBanner,
  header,
  menu,
  menuCollapsed,
  main,
  context,
  contextExpanded,
}: LayoutProps) {
  const [state, setState] = useState<'opened' | 'collapsed'>('collapsed');
  const isDesktop = useBreakpoint('xl');

  useEffect(() => {
    if (isDesktop) {
      setState('opened');
    } else {
      setState('collapsed');
    }
  }, [isDesktop]);

  return (
    <>
      {banner && <div className="fixed inset-x-0 top-0 z-30 h-8 bg-neutral">{banner}</div>}

      <div
        onMouseEnter={() => !isDesktop && setState('opened')}
        onMouseLeave={() => !isDesktop && setState('collapsed')}
        className={clsx('fixed z-20 h-screen w-16 overflow-x-visible', hasBanner && 'pt-8')}
      >
        <Aside className={clsx({ 'w-full': state === 'collapsed', 'w-64': state === 'opened' })}>
          {state === 'opened' && menu}
          {state === 'collapsed' && menuCollapsed}
        </Aside>
      </div>

      <div className={clsx('pl-16 xl:pl-64', hasBanner && 'pt-8', contextExpanded && '3xl:pr-[32rem]')}>
        <div className="@container/main mx-auto max-w-[75rem]">
          <header className="px-4">{header}</header>
          {main}
        </div>
      </div>

      <Context context={context} expanded={contextExpanded} banner={Boolean(banner)} />
    </>
  );
}

function LayoutMobile({ banner, header, menu, main }: LayoutProps) {
  const [state, setState] = useState<'opened' | 'closed'>('closed');
  const location = useLocation();

  useUpdateEffect(() => {
    setState('closed');
  }, [location]);

  return (
    <>
      <header className="sticky top-0 z-10 row items-center gap-1 border-b bg-neutral px-2 shadow-sm">
        <Button size={1} color="gray" variant="ghost" onClick={() => setState('opened')} className="!px-1">
          <IconMenu className="size-5 text-dim" />
        </Button>

        <div className="flex-1 overflow-x-auto">{header}</div>
      </header>

      <MobileMenu state={state} setState={setState}>
        {menu}
      </MobileMenu>

      {banner}

      {main}
    </>
  );
}

type MobileMenuProps = {
  state: 'opened' | 'closed';
  setState: (state: 'opened' | 'closed') => void;
  children: React.ReactNode;
};

function MobileMenu({ state, setState, children }: MobileMenuProps) {
  const { refs, floatingStyles, context } = useFloating({
    whileElementsMounted: autoUpdate,
    onOpenChange: (open) => {
      setState(open ? 'opened' : 'closed');
    },
    open: state === 'opened',
    strategy: 'fixed',
  });

  const { status } = useTransitionStatus(context);
  const { isMounted, styles } = useTransitionStyles(context, {
    initial: { opacity: 0, transform: 'translateX(-50%)' },
    open: { opacity: 1, transform: 'translateX(0)' },
  });

  const dismiss = useDismiss(context, { outsidePressEvent: 'mousedown' });
  const { getFloatingProps } = useInteractions([dismiss]);

  if (!isMounted) {
    return null;
  }

  return (
    <FloatingOverlay
      lockScroll
      className={clsx('z-20 transition-all', status === 'open' && 'bg-black/25 backdrop-blur-sm')}
    >
      <FloatingPortal root={document.getElementById('root')}>
        <Aside
          ref={refs.setFloating}
          style={{ ...floatingStyles, ...styles }}
          className="z-20 w-64"
          {...getFloatingProps()}
        >
          {children}
        </Aside>
      </FloatingPortal>
    </FloatingOverlay>
  );
}

function Aside({ className, ...props }: React.ComponentProps<'aside'>) {
  return (
    <aside
      className={clsx('h-full overflow-y-auto border-r bg-[#fbfbfb] dark:bg-[#151518]', className)}
      {...props}
    />
  );
}

type ContextProps = {
  context: React.ReactNode;
  expanded: boolean;
  banner: boolean;
};

function Context({ context, expanded, banner }: ContextProps) {
  if (!context) {
    return null;
  }

  return (
    <div className={clsx('fixed inset-y-0 right-0 w-0', expanded && 'w-full max-w-lg', banner && 'pt-8')}>
      {context}
    </div>
  );
}
