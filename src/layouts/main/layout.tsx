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
import { Button } from '@koyeb/design-system';
import { cva } from 'class-variance-authority';
import clsx from 'clsx';
import { useEffect, useReducer } from 'react';

import { usePureFunction, useUpdateEffect } from 'src/hooks/lifecycle';
import { useLocation } from 'src/hooks/router';
import { IconMenu } from 'src/icons';

const breakpoints = {
  tablet: '40rem', // 640px
  desktop: '80rem', // 1280px
};

type LayoutProps = {
  banner: React.ReactNode;
  header: React.ReactNode;
  menu: React.ReactNode;
  menuCollapsed: React.ReactNode;
  main: React.ReactNode;
  context: React.ReactNode;
  contextExpanded: boolean;
};

export function Layout({ banner, header, menu, menuCollapsed, main, context, contextExpanded }: LayoutProps) {
  const [state, dispatch] = useLayoutState();
  const location = useLocation();

  useMediaQuery(`(width >= ${breakpoints.tablet})`, () => {
    dispatch({ type: 'resized', size: getCurrentSize() });
  });

  useMediaQuery(`(width >= ${breakpoints.desktop})`, () => {
    dispatch({ type: 'resized', size: getCurrentSize() });
  });

  useUpdateEffect(() => {
    dispatch({ type: 'menu:closed' });
    dispatch({ type: 'sidebar:closed' });
  }, [location]);

  return (
    <>
      {banner && <div className="fixed inset-x-0 top-0 z-30 h-8 bg-neutral">{banner}</div>}

      <div
        onMouseEnter={() => dispatch({ type: 'sidebar:opened' })}
        onMouseLeave={() => dispatch({ type: 'sidebar:closed' })}
        className={clsx('fixed z-20 hidden h-screen w-16 overflow-x-visible sm:block', banner && 'pt-8')}
      >
        <aside className={sidebarClass({ state: state.sidebar })}>
          {state.sidebar === 'opened' && menu}
          {state.sidebar === 'collapsed' && menuCollapsed}
        </aside>
      </div>

      <div className={clsx('sm:pl-16 xl:pl-64', banner && 'pt-8', contextExpanded && 'min-[120rem]:pr-128')}>
        <div className="@container/main mx-auto max-w-300">
          <header
            className={clsx(
              'px-2 max-sm:z-10 sm:px-4',
              'max-sm:bg-neutral max-sm:shadow-sm',
              'max-sm:row max-sm:items-center max-sm:gap-1',
              'max-sm:sticky max-sm:top-0',
              banner && 'max-sm:top-8',
            )}
          >
            <Button
              size={1}
              color="gray"
              variant="ghost"
              onClick={() => dispatch({ type: 'menu:opened' })}
              className="px-1! sm:hidden"
            >
              <IconMenu className="size-5 text-dim" />
            </Button>

            {header}
          </header>

          {main}
        </div>
      </div>

      <MobileMenu
        state={state.menu}
        onOpen={() => dispatch({ type: 'menu:opened' })}
        onClose={() => dispatch({ type: 'menu:closed' })}
      >
        {menu}
      </MobileMenu>

      {context && (
        <div className={contextClass({ expanded: contextExpanded, banner: Boolean(banner) })}>{context}</div>
      )}
    </>
  );
}

type MobileMenuProps = {
  state: 'opened' | 'closed';
  onOpen: () => void;
  onClose: () => void;
  children: React.ReactNode;
};

function MobileMenu({ state, onOpen, onClose, children }: MobileMenuProps) {
  const { refs, floatingStyles, context } = useFloating({
    whileElementsMounted: autoUpdate,
    onOpenChange: (open) => (open ? onOpen() : onClose()),
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
          className={sidebarClass({ state: 'mobile' })}
          {...getFloatingProps()}
        >
          {children}
        </aside>
      </FloatingPortal>
    </FloatingOverlay>
  );
}

const sidebarClass = cva('h-full overflow-y-auto border-r bg-[#fbfbfb] dark:bg-[#151518]', {
  variants: {
    state: {
      collapsed: 'w-full',
      opened: 'w-64',
      mobile: 'z-20 w-64',
    },
  },
  defaultVariants: {
    state: 'collapsed',
  },
});

const contextClass = cva('fixed inset-y-0 right-0 w-0', {
  variants: {
    expanded: { true: 'w-full max-w-lg' },
    banner: { true: 'pt-8' },
  },
});

type LayoutState = {
  menu: 'closed' | 'opened';
  sidebar: 'collapsed' | 'opened';
  size: 'mobile' | 'tablet' | 'desktop';
};

type LayoutAction =
  | { type: 'menu:opened' }
  | { type: 'menu:closed' }
  | { type: 'sidebar:opened' }
  | { type: 'sidebar:closed' }
  | { type: 'resized'; size: 'mobile' | 'tablet' | 'desktop' };

function useLayoutState() {
  const size = getCurrentSize();

  return useReducer(layoutStateReducer, {
    menu: 'closed',
    sidebar: size === 'desktop' ? 'opened' : 'collapsed',
    size,
  });
}

const layoutStateReducer: React.Reducer<LayoutState, LayoutAction> = (state, action) => {
  if (state.size === 'mobile') {
    if (action.type === 'menu:opened') {
      return { ...state, menu: 'opened' };
    }

    if (action.type === 'menu:closed') {
      return { ...state, menu: 'closed' };
    }
  }

  if (state.size === 'tablet') {
    if (action.type === 'sidebar:opened') {
      return { ...state, sidebar: 'opened' };
    }

    if (action.type === 'sidebar:closed') {
      return { ...state, sidebar: 'collapsed' };
    }
  }

  if (action.type === 'resized') {
    if (action.size === 'mobile' || action.size === 'tablet') {
      return { menu: 'closed', sidebar: 'collapsed', size: action.size };
    }

    return { menu: 'closed', sidebar: 'opened', size: action.size };
  }

  return state;
};

function getCurrentSize(): LayoutState['size'] {
  if (window.matchMedia(`(width < ${breakpoints.tablet})`).matches) {
    return 'mobile';
  }

  if (window.matchMedia(`(width < ${breakpoints.desktop})`).matches) {
    return 'tablet';
  }

  return 'desktop';
}

function useMediaQuery(query: string, cb: () => void) {
  const cbMemo = usePureFunction(cb);

  useEffect(() => {
    const matchMedia = window.matchMedia(query);

    matchMedia.addEventListener('change', cbMemo);

    return () => {
      matchMedia.removeEventListener('change', cbMemo);
    };
  }, [query, cbMemo]);
}
