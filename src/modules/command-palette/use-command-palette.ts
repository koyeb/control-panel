import { useCallback, useEffect, useMemo, useReducer } from 'react';

type CommandWithoutOptions = {
  id: string;
  group: string;
  label: string;
  keywords: string[];
  execute: () => void | Promise<void>;
};

type CommandWithOptions<Option> = Omit<CommandWithoutOptions, 'execute'> & {
  stringifyOption: (option: Option) => string;
  getOptions: () => Option[] | Promise<Option[]>;
  execute: (selected: Option) => void | Promise<void>;
};

type Command<Option = unknown> = CommandWithoutOptions | CommandWithOptions<Option>;

export function useCommandPalette() {
  const [state, dispatch] = useReducer(reducer, {
    commands: new Set(),
    elements: new Map(),
    open: false,
    loading: false,
    search: '',
    highlightedIndex: 0,
  } satisfies State);

  useEffect(() => {
    const command = Array.from(state.commands.values()).at(state.highlightedIndex);
    const element = command ? state.elements.get(command) : undefined;

    element?.scrollIntoView();
  }, [state]);

  const actions = useMemo(
    () => ({
      registerCommand(command: Command) {
        dispatch({ type: 'register-command', command });
      },
      registerElement(command: Command, element: Element | null) {
        dispatch({ type: 'register-element', command, element });
      },
      setOpen(open: boolean) {
        dispatch({ type: 'set-open', open });
      },
      setSearch(search: string) {
        dispatch({ type: 'set-search', search });
      },
      keyDown(key: string) {
        dispatch({ type: 'key-down', key });
      },
    }),
    [dispatch],
  );

  const executeCommand = useCallback((command: Command, option: unknown) => {
    command.execute(option);
  }, []);

  const execute = useCallback(async () => {
    const command = Array.from(state.commands.values()).at(state.highlightedIndex);

    if (!command) {
      return;
    }

    executeCommand(command, undefined);
    return;

    if (state.currentCommand !== undefined && state.options !== undefined) {
      const option = Array.from(state.options).at(state.highlightedIndex);

      dispatch({ type: 'set-loading', loading: true });

      await state.currentCommand.execute(option);

      dispatch({ type: 'set-loading', loading: false });
    }

    if ('getOptions' in command) {
      dispatch({ type: 'set-loading', loading: true });

      const options = await command.getOptions();

      dispatch({ type: 'set-loading', loading: false });
      dispatch({ type: 'set-current-command', command, options });
    }
  }, [state, dispatch, executeCommand]);

  return [state, { ...actions, execute }] as const;
}

type State = {
  commands: Set<Command>;
  currentCommand?: Command;
  options?: Set<unknown>;
  elements: Map<Command, Element>;
  open: boolean;
  loading: boolean;
  search: string;
  highlightedIndex: number;
};

type RegisterCommandAction = {
  type: 'register-command';
  command: Command;
};

type RegisterElementAction = {
  type: 'register-element';
  command: Command;
  element: Element | null;
};

type SetOpenAction = {
  type: 'set-open';
  open: boolean;
};

type SetLoadingAction = {
  type: 'set-loading';
  loading: boolean;
};

type SearchAction = {
  type: 'set-search';
  search: string;
};

type KeyDownAction = {
  type: 'key-down';
  key: string;
};

type SetOptionsAction = {
  type: 'set-current-command';
  command: Command | null;
  options: unknown[] | null;
};

type Action =
  | RegisterCommandAction
  | RegisterElementAction
  | SetOpenAction
  | SetLoadingAction
  | SearchAction
  | SetOptionsAction
  | KeyDownAction;

const reducer: React.Reducer<State, Action> = (state, action) => {
  if (action.type === 'register-command') {
    state.commands = new Set(state.commands);
    state.commands.add(action.command);
  }

  if (action.type === 'register-element') {
    state.elements = new Map(state.elements);

    if (action.element === null) {
      state.elements.delete(action.command);
    } else {
      state.elements.set(action.command, action.element);
    }
  }

  if (action.type === 'set-open') {
    state.open = action.open;
  }

  if (action.type === 'set-loading') {
    state.loading = action.loading;
  }

  if (action.type === 'set-search') {
    state.search = action.search;
  }

  if (action.type === 'set-current-command') {
    if (action.options !== null) {
      state.options = new Set(action.options);
    } else {
      delete state.options;
    }
  }

  if (action.type === 'key-down') {
    if (action.key === 'ArrowDown') {
      state.highlightedIndex += 1;
      state.highlightedIndex %= state.commands.size;
    }

    if (action.key === 'ArrowDown') {
      state.highlightedIndex -= 1;

      if (state.highlightedIndex < 0) {
        state.highlightedIndex = state.commands.size - 1;
      }
    }
  }

  return state;
};
