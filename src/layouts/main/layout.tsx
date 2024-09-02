import {
  autoUpdate,
  FloatingOverlay,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
  useTransitionStatus,
  useTransitionStyles,
} from '@floating-ui/react';
import clsx from 'clsx';
import IconMenu from 'lucide-static/icons/menu.svg?react';
import { useCallback, useEffect, useState } from 'react';

import { Button, useBreakpoint } from '@koyeb/design-system';
import { useUpdateEffect } from 'src/hooks/lifecycle';
import { useLocation } from 'src/hooks/router';

type LayoutProps = {
  banner?: React.ReactNode;
  header: React.ReactNode;
  menu: (collapsed: boolean) => React.ReactNode;
  main: React.ReactNode;
  context?: React.ReactNode;
};

export function Layout({ banner, header, menu, main, context }: LayoutProps) {
  const [menuState, setMenuState] = useSideMenuState();

  return (
    <div className="row">
      <SideMenu state={menuState} setState={setMenuState}>
        {menu(menuState === 'collapsed')}
      </SideMenu>

      <div className="h-screen flex-1 overflow-auto">
        {banner}

        <div className={clsx('mx-auto max-w-main', context && 'pr-4')}>
          <Header onOpen={() => setMenuState('opened')}>{header}</Header>
          {main}
        </div>
      </div>

      {context}
    </div>
  );
}

function Header({ onOpen, children }: { onOpen: () => void; children: React.ReactNode }) {
  return (
    <header
      className={clsx(
        'row z-10 items-center gap-1 px-2 sm:px-4',
        'sticky top-0 border-b bg-neutral shadow-sm sm:static sm:border-none sm:shadow-none',
      )}
    >
      <Button size={1} color="gray" variant="ghost" onClick={onOpen} className="!px-1 sm:hidden">
        <IconMenu className="size-5 text-dim" />
      </Button>

      <div className="flex-1 overflow-x-auto">{children}</div>
    </header>
  );
}

type SideMenuState = 'closed' | 'collapsed' | 'opened';
type SetSideMenuState = (state: SideMenuState) => void;

type SideMenuProps = {
  state: SideMenuState;
  setState: SetSideMenuState;
  children: React.ReactNode;
};

function SideMenu(props: SideMenuProps) {
  const isDesktop = useBreakpoint('xl');
  const isTablet = useBreakpoint('sm') && !isDesktop;

  if (isDesktop) {
    return <SideMenuDesktop {...props} />;
  }

  if (isTablet) {
    return <SideMenuTablet {...props} />;
  }

  return <SideMenuMobile {...props} />;
}

function SideMenuDesktop({ children }: SideMenuProps) {
  return (
    <aside
      // eslint-disable-next-line tailwindcss/no-arbitrary-value
      className="z-20 h-screen w-64 overflow-y-auto border-r bg-[#fbfbfb] dark:bg-[#151518]"
    >
      {children}
    </aside>
  );
}

function SideMenuTablet({ state, setState, children }: SideMenuProps) {
  return (
    <div
      onMouseEnter={() => setState('opened')}
      onMouseLeave={() => setState('collapsed')}
      className={clsx('z-20 w-16 overflow-x-visible')}
    >
      <aside
        // eslint-disable-next-line tailwindcss/no-arbitrary-value
        className={clsx('h-screen overflow-y-auto border-r bg-[#fbfbfb] dark:bg-[#151518]', {
          'w-full': state === 'collapsed',
          'w-64': state === 'opened',
        })}
      >
        {children}
      </aside>
    </div>
  );
}

function SideMenuMobile({ state, setState, children }: SideMenuProps) {
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
        <aside
          ref={refs.setFloating}
          style={{ ...floatingStyles, ...styles }}
          // eslint-disable-next-line tailwindcss/no-arbitrary-value
          className="inset-y-0 z-20 h-screen w-64 overflow-y-auto border-r bg-[#fbfbfb] dark:bg-[#151518]"
          {...getFloatingProps()}
        >
          {children}
        </aside>
      </FloatingPortal>
    </FloatingOverlay>
  );
}

function useSideMenuState() {
  const isDesktop = useBreakpoint('xl');
  const isTablet = useBreakpoint('sm');

  const getState = useCallback((): SideMenuState => {
    if (isDesktop) return 'opened';
    else if (isTablet) return 'collapsed';
    else return 'closed';
  }, [isDesktop, isTablet]);

  const [state, setState] = useState(getState);

  useEffect(() => {
    setState(getState);
  }, [getState]);

  const location = useLocation();

  useUpdateEffect(() => {
    if (!isDesktop && !isTablet) {
      setState('closed');
    }
  }, [location]);

  return [state, setState] as const;
}
