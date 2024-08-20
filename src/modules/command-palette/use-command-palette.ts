import { useReducer, useEffect, createContext, createElement, useContext, useCallback, useRef } from 'react';

import { useNavigate } from 'src/hooks/router';

export type CommandPalettePage = {
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  render: () => React.ReactNode;
};

export type CommandPaletteSection = {
  title: string;
  items: Array<CommandPalettePage>;
};

type CommandPaletteState = {
  isOpen: boolean;
  serviceType: ServiceType | undefined;
  deploymentMethod: DeploymentMethod | undefined;
  sections: CommandPaletteSection[];
  filteredSections: CommandPaletteSection[];
  search: string;
  page?: CommandPalettePage;
  navigationRefs: Map<CommandPalettePage, HTMLElement | null>;
};

export type ServiceType = 'web' | 'worker';
export type DeploymentMethod = 'github' | 'docker';

type GetSections = (
  serviceType: ServiceType | undefined,
  deploymentMethod: DeploymentMethod | undefined,
) => CommandPaletteSection[];

type CommandPaletteContext = ReturnType<typeof useCreateCommandPalette>;

const commandPaletteContext = createContext<CommandPaletteContext>(null as never);

export function useCommandPalette() {
  return useContext(commandPaletteContext);
}

type CommandPaletteProviderProps = {
  getSections: GetSections;
  children: React.ReactNode;
};

export const CommandPaletteProvider = ({ getSections, children }: CommandPaletteProviderProps) => {
  return createElement(
    commandPaletteContext.Provider,
    { value: useCreateCommandPalette(getSections) },
    children,
  );
};

function useCreateCommandPalette(getSections: GetSections) {
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(reducer, {
    isOpen: false,
    serviceType: undefined,
    deploymentMethod: undefined,
    sections: [],
    filteredSections: [],
    search: '',
    page: undefined,
    navigationRefs: new Map(),
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isOpen, serviceType, deploymentMethod, filteredSections, search, page, navigationRefs } = state;

  const focusSearchInput = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    dispatch({ type: 'sections-changed', sections: getSections(serviceType, deploymentMethod) });
  }, [getSections, serviceType, deploymentMethod]);

  return {
    isOpen,
    serviceType,
    deploymentMethod,
    sections: filteredSections,
    page,
    search,

    searchInputRef,
    focusSearchInput,

    onNavigationItemRef: navigationRefs.set.bind(navigationRefs),

    navigate: useCallback(
      (to: string) => {
        dispatch({ type: 'dialog-state-changed', isOpen: false });
        navigate(to);
      },
      [navigate],
    ),

    dialogOpened: useCallback(() => {
      dispatch({ type: 'dialog-state-changed', isOpen: true });
      focusSearchInput();
    }, [focusSearchInput]),

    dialogClosed: useCallback(() => {
      dispatch({ type: 'dialog-state-changed', isOpen: false });
    }, []),

    reset: useCallback(() => {
      dispatch({ type: 'reset' });
    }, []),

    serviceTypeChanged: useCallback((serviceType: ServiceType) => {
      dispatch({ type: 'service-type-changed', serviceType });
    }, []),

    deploymentMethodChanged: useCallback((deploymentMethod: DeploymentMethod) => {
      dispatch({ type: 'deployment-method-changed', deploymentMethod });
    }, []),

    searchChanged: useCallback((value: string) => {
      dispatch({ type: 'search-changed', value });
    }, []),

    pageChanged: useCallback((page: CommandPalettePage) => {
      dispatch({ type: 'page-changed', page });
    }, []),

    arrowKeyPressed: useCallback((arrow: 'up' | 'down') => {
      dispatch({ type: 'arrow-key-pressed', arrow });
    }, []),

    backspacePressed: useCallback(() => {
      dispatch({ type: 'backspace-key-pressed' });
    }, []),
  };
}

type Reset = {
  type: 'reset';
};

type DialogStateChanged = {
  type: 'dialog-state-changed';
  isOpen: boolean;
};

type ServiceTypeChanged = {
  type: 'service-type-changed';
  serviceType: ServiceType;
};

type DeploymentMethodChanged = {
  type: 'deployment-method-changed';
  deploymentMethod: DeploymentMethod;
};

type SectionsChanged = {
  type: 'sections-changed';
  sections: CommandPaletteSection[];
};

type SearchChanged = {
  type: 'search-changed';
  value: string;
};

type SetPage = {
  type: 'page-changed';
  page: CommandPalettePage;
};

type ArrowKeyPressed = {
  type: 'arrow-key-pressed';
  arrow: 'up' | 'down';
};

type BackspaceKeyPressed = {
  type: 'backspace-key-pressed';
};

type CommandPaletteAction =
  | DialogStateChanged
  | Reset
  | ServiceTypeChanged
  | DeploymentMethodChanged
  | SectionsChanged
  | SearchChanged
  | SetPage
  | ArrowKeyPressed
  | BackspaceKeyPressed;

function reducer(state: CommandPaletteState, action: CommandPaletteAction): CommandPaletteState {
  if (state.deploymentMethod === 'github') {
    if (action.type === 'search-changed') {
      return {
        ...state,
        search: action.value,
      };
    }

    if (action.type === 'arrow-key-pressed') {
      return state;
    }
  }

  if (action.type === 'dialog-state-changed') {
    return { ...state, isOpen: action.isOpen };
  }

  if (action.type === 'reset') {
    const firstPage = state.sections[0]?.items[0];

    state.navigationRefs.get(firstPage as CommandPalettePage)?.scrollIntoView({ block: 'center' });

    return {
      ...state,
      serviceType: undefined,
      deploymentMethod: undefined,
      page: firstPage,
    };
  }

  if (action.type === 'service-type-changed') {
    return {
      ...state,
      serviceType: action.serviceType,
    };
  }

  if (action.type === 'deployment-method-changed') {
    return {
      ...state,
      deploymentMethod: action.deploymentMethod,
    };
  }

  if (action.type === 'sections-changed') {
    return {
      ...state,
      sections: action.sections,
      filteredSections: action.sections,
      page: action.sections[0]?.items[0],
      search: '',
      navigationRefs: new Map(),
    };
  }

  if (action.type === 'search-changed') {
    const search = action.value;
    const filteredSections = filterSections(state.sections, search);

    return {
      ...state,
      search,
      filteredSections,
      page: filteredSections[0]?.items[0],
    };
  }

  if (action.type === 'page-changed') {
    return {
      ...state,
      page: action.page,
    };
  }

  if (action.type === 'arrow-key-pressed') {
    if (!state.page) {
      return state;
    }

    const pages = state.filteredSections.flatMap((section) => section.items);
    const index = pages.indexOf(state.page);
    const page = action.arrow === 'up' ? pages[index - 1] : pages[index + 1];

    if (!page) {
      return state;
    }

    state.navigationRefs.get(page)?.scrollIntoView({ block: 'center' });

    return {
      ...state,
      page,
    };
  }

  if (action.type === 'backspace-key-pressed') {
    const next = { ...state };

    if (next.deploymentMethod) {
      next.deploymentMethod = undefined;
    } else if (next.serviceType) {
      next.serviceType = undefined;
    }

    return next;
  }

  return state;
}

function filterSections(sections: CommandPaletteSection[], search: string) {
  if (search === '') {
    return sections;
  }

  const filterPage = (page: CommandPalettePage) => {
    return page.label.toLowerCase().includes(search.toLowerCase());
  };

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter(filterPage),
    }))
    .filter((section) => section.items.length > 0);
}
