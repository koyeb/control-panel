import { useReducer, useEffect, createContext, createElement, useContext, useCallback, useRef } from 'react';

import { Dialog } from 'src/components/dialog';
import { useNavigate } from 'src/hooks/router';

type CreateServiceDialogPage = {
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  render: () => React.ReactNode;
};

export type CreateServiceDialogSection = {
  title: string;
  items: Array<CreateServiceDialogPage>;
};

type CreateServiceDialogState = {
  serviceType: ServiceType | undefined;
  deploymentMethod: DeploymentMethod | undefined;
  sections: CreateServiceDialogSection[];
  filteredSections: CreateServiceDialogSection[];
  search: string;
  page?: CreateServiceDialogPage;
  navigationRefs: Map<CreateServiceDialogPage, HTMLElement | null>;
};

type ServiceType = 'web' | 'worker';
type DeploymentMethod = 'github' | 'docker';

type GetSections = (
  serviceType: ServiceType | undefined,
  deploymentMethod: DeploymentMethod | undefined,
) => CreateServiceDialogSection[];

type CreateServiceDialogContext = ReturnType<typeof useCreateCreateServiceDialog>;

const createServiceDialogContext = createContext<CreateServiceDialogContext>(null as never);

export function useCreateServiceDialog() {
  return useContext(createServiceDialogContext);
}

type CreateServiceDialogProviderProps = {
  getSections: GetSections;
  children: React.ReactNode;
};

export const CreateServiceDialogProvider = ({ getSections, children }: CreateServiceDialogProviderProps) => {
  return createElement(
    createServiceDialogContext.Provider,
    { value: useCreateCreateServiceDialog(getSections) },
    children,
  );
};

function useCreateCreateServiceDialog(getSections: GetSections) {
  const openDialog = Dialog.useOpen();
  const closeDialog = Dialog.useClose();
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(reducer, {
    serviceType: undefined,
    deploymentMethod: undefined,
    sections: [],
    filteredSections: [],
    search: '',
    page: undefined,
    navigationRefs: new Map(),
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { serviceType, deploymentMethod, filteredSections, search, page, navigationRefs } = state;

  const focusSearchInput = useCallback(() => {
    setTimeout(() => searchInputRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    dispatch({ type: 'sections-changed', sections: getSections(serviceType, deploymentMethod) });
  }, [getSections, serviceType, deploymentMethod]);

  return {
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
        closeDialog();
        navigate(to);
      },
      [closeDialog, navigate],
    ),

    dialogOpened: useCallback(() => {
      openDialog('CreateService');
      focusSearchInput();
    }, [openDialog, focusSearchInput]),

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

    pageChanged: useCallback((page: CreateServiceDialogPage) => {
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
  sections: CreateServiceDialogSection[];
};

type SearchChanged = {
  type: 'search-changed';
  value: string;
};

type SetPage = {
  type: 'page-changed';
  page: CreateServiceDialogPage;
};

type ArrowKeyPressed = {
  type: 'arrow-key-pressed';
  arrow: 'up' | 'down';
};

type BackspaceKeyPressed = {
  type: 'backspace-key-pressed';
};

type CreateServiceDialogAction =
  | Reset
  | ServiceTypeChanged
  | DeploymentMethodChanged
  | SectionsChanged
  | SearchChanged
  | SetPage
  | ArrowKeyPressed
  | BackspaceKeyPressed;

function reducer(
  state: CreateServiceDialogState,
  action: CreateServiceDialogAction,
): CreateServiceDialogState {
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

  if (action.type === 'reset') {
    const firstPage = state.sections[0]?.items[0];

    state.navigationRefs.get(firstPage as CreateServiceDialogPage)?.scrollIntoView({ block: 'center' });

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

function filterSections(sections: CreateServiceDialogSection[], search: string) {
  if (search === '') {
    return sections;
  }

  const filterPage = (page: CreateServiceDialogPage) => {
    return page.label.toLowerCase().includes(search.toLowerCase());
  };

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter(filterPage),
    }))
    .filter((section) => section.items.length > 0);
}
