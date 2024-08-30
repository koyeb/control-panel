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
  header: React.ReactNode;
  menu: (collapsed: boolean) => React.ReactNode;
  main: React.ReactNode;
  containerClassName?: string;
};

export function Layout({ header, menu, main, containerClassName }: LayoutProps) {
  const [menuState, setMenuState] = useSideMenuState();

  return (
    <>
      <SideMenu state={menuState} setState={setMenuState}>
        {menu(menuState === 'collapsed')}
      </SideMenu>

      <div className={clsx('sm:pl-16 xl:pl-64', containerClassName)}>
        <div className="mx-auto max-w-main">
          <Header onOpen={() => setMenuState('opened')}>{header}</Header>
          {main}
        </div>
      </div>
    </>
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

function SideMenu({ state, setState, children }: SideMenuProps) {
  const isDesktop = useBreakpoint('xl');
  const isTablet = useBreakpoint('sm') && !isDesktop;
  const isMobile = !isTablet && !isDesktop;

  const { refs, floatingStyles, context } = useFloating({
    whileElementsMounted: autoUpdate,
    onOpenChange: (open) => {
      if (!open && !isDesktop) {
        setState(isTablet ? 'collapsed' : 'closed');
      }
    },
    open: isMobile ? state === 'opened' : true,
    strategy: 'fixed',
  });

  const { status } = useTransitionStatus(context);
  const { isMounted, styles } = useTransitionStyles(context, {
    initial: { opacity: 0, transform: 'translateX(-50%)' },
    open: { opacity: 1, transform: 'translateX(0)' },
  });

  const dismiss = useDismiss(context, { outsidePressEvent: 'mousedown' });
  const { getFloatingProps } = useInteractions([dismiss]);

  const wrap = (children: React.ReactNode) => {
    if (isTablet || isDesktop) {
      return children;
    }

    if (!isMounted) {
      return null;
    }

    return (
      <FloatingOverlay
        lockScroll
        className={clsx('z-20 transition-all', status === 'open' && 'bg-black/25 backdrop-blur-sm')}
      >
        {children}
      </FloatingOverlay>
    );
  };

  return (
    <FloatingPortal root={document.getElementById('root')}>
      {wrap(
        <aside
          ref={refs.setFloating}
          onMouseEnter={() => isTablet && setState('opened')}
          onMouseLeave={() => isTablet && setState('collapsed')}
          style={{ ...floatingStyles, ...(isMobile ? styles : {}) }}
          // eslint-disable-next-line tailwindcss/no-arbitrary-value
          className={clsx(
            'inset-y-0 z-20 max-h-screen overflow-y-auto border-r bg-[#fbfbfb] dark:bg-[#151518]',
            {
              'w-16': state === 'collapsed',
              'w-64': state === 'closed' || state === 'opened',
            },
          )}
          {...getFloatingProps()}
        >
          {children}
        </aside>,
      )}
    </FloatingPortal>
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
