import { useMutation } from '@tanstack/react-query';
import { produce } from 'immer';
import sortBy from 'lodash-es/sortBy';
import { useCallback, useMemo, useReducer, useRef } from 'react';

import { SvgComponent } from 'src/application/types';
import { normalizeDiacriticCharacters } from 'src/utils/strings';

export type PaletteState = State;
export type PaletteOption = Option;
export type PaletteContext = Context;

export type CommandPalette = ReturnType<typeof useCommandPalette>;

const initialState: State = {
  input: {
    Icon: null,
    placeholder: '',
    value: '',
  },
  options: {
    contexts: [],
    items: [],
    highlightedIndex: 0,
  },
  initial: {
    input: {
      Icon: null,
      placeholder: null,
    },
    options: {
      items: [],
      contexts: [],
    },
  },
  stack: [],
};

export function useCommandPalette(onClose: () => void) {
  const [state, dispatch] = useReducer(produce(producer), initialState);
  const { input, options, stack } = state;

  const filteredOptions = useMemo(
    () => filterOptions(options.items, options.contexts, input.value),
    [options.items, options.contexts, input.value],
  );

  const highlightedOption = filteredOptions.at(options.highlightedIndex);

  const keepOpen = useRef<boolean>(false);

  const { isPending, mutateAsync } = useMutation({
    meta: { showError: false },

    mutationFn: async (fn: () => unknown) => {
      return fn();
    },

    onMutate: () => {
      keepOpen.current = false;

      if (highlightedOption?.hasSubOptions) {
        keepOpen.current = true;

        dispatch({ type: 'push' });

        dispatch({
          type: 'setInput',
          input: {
            Icon: highlightedOption.Icon,
            placeholder: highlightedOption.placeholder,
          },
        });
      }
    },

    onSuccess: () => {
      if (!keepOpen.current) {
        onClose();
      }
    },
  });

  return {
    input,
    options: filteredOptions,
    contexts: filterContexts(options.contexts, filteredOptions),
    highlightedIndex: options.highlightedIndex,
    highlightedOption: highlightedOption,
    loading: isPending,
    canGoBack: stack.length > 0,

    clear: useCallback(() => {
      dispatch({ type: 'clear' });
    }, []),

    reset: useCallback(() => {
      dispatch({ type: 'reset' });
    }, []),

    setIcon: useCallback((Icon: SvgComponent) => {
      dispatch({ type: 'setInput', input: { Icon } });
    }, []),

    setPlaceholder: useCallback((placeholder: string) => {
      dispatch({ type: 'setInput', input: { placeholder } });
    }, []),

    setInputValue: useCallback((value: string) => {
      dispatch({ type: 'setInput', input: { value } });
    }, []),

    setHighlightedIndex: useCallback((highlightedIndex: number) => {
      dispatch({ type: 'setHighlightedIndex', highlightedIndex });
    }, []),

    addContext: useCallback((context: Context) => {
      dispatch({ type: 'addContext', context });
    }, []),

    removeContext: useCallback((contextId: string) => {
      dispatch({ type: 'removeContext', contextId });
    }, []),

    addOption: useCallback((option: Option) => {
      dispatch({
        type: 'addOption',
        option: option.contextId ? { ...option, id: `${option.contextId}:${option.id}` } : option,
      });
    }, []),

    removeOption: useCallback((optionId: string) => {
      dispatch({ type: 'removeOption', optionId: optionId });
    }, []),

    back: useCallback(() => {
      dispatch({ type: 'pop' });
    }, []),

    execute: useCallback(
      (option: Option) => {
        return mutateAsync(option.execute);
      },
      [mutateAsync],
    ),
  };
}

function filterOptions(options: Option[], contexts: Context[], search: string) {
  const contextIds: Array<string | undefined> = contexts.map((context) => context.id);
  const sortedOptions = sortBy(options, (option) => contextIds.indexOf(option.contextId));

  return sortedOptions.filter(optionFilter(search));
}

function optionFilter(search: string) {
  const normalize = (str: string) => normalizeDiacriticCharacters(str).toLowerCase();
  const query = normalize(search);

  return (option: Option) => {
    return normalize(option.label).includes(query) || normalize(option.description ?? '').includes(query);
  };
}

function filterContexts(contexts: Context[], filteredOptions: Option[]) {
  const filteredContextIds = new Set(filteredOptions.map((option) => option.contextId));

  return contexts.filter((context) => filteredContextIds.has(context.id));
}

type Option = {
  id: string;
  contextId?: string;
  label: string;
  description?: string;
  Icon?: SvgComponent;
  placeholder?: string;
  hasSubOptions?: boolean;
  shortcut?: string;
  execute: () => unknown;
};

type Context = {
  id: string;
  label: string;
};

type State = {
  input: {
    Icon: SvgComponent | null;
    placeholder: string;
    value: string;
  };
  options: {
    items: Option[];
    contexts: Context[];
    highlightedIndex: number;
  };
  initial: {
    input: {
      Icon: SvgComponent | null;
      placeholder: string | null;
    };
    options: {
      items: Option[];
      contexts: Context[];
    };
  };
  stack: Array<State['initial']>;
};

type ClearAction = {
  type: 'clear';
};

type ResetAction = {
  type: 'reset';
};

type SetInputAction = {
  type: 'setInput';
  input: Partial<State['input']>;
};

type AddOptionAction = {
  type: 'addOption';
  option: Option;
};

type RemoveOptionAction = {
  type: 'removeOption';
  optionId: string;
};

type AddContextAction = {
  type: 'addContext';
  context: Context;
};

type RemoveContextAction = {
  type: 'removeContext';
  contextId: string;
};

type SetHighlightedIndexAction = {
  type: 'setHighlightedIndex';
  highlightedIndex: number;
};

type PushAction = {
  type: 'push';
};

type PopAction = {
  type: 'pop';
};

type Action =
  | ClearAction
  | ResetAction
  | SetInputAction
  | AddOptionAction
  | RemoveOptionAction
  | AddContextAction
  | RemoveContextAction
  | SetHighlightedIndexAction
  | PushAction
  | PopAction;

function producer(state: State, action: Action): State {
  if (action.type === 'clear') {
    return initialState;
  }

  if (action.type === 'reset') {
    Object.assign(state.input, state.initial.input);
    Object.assign(state.options, state.initial.options);

    state.input.value = '';
    state.options.highlightedIndex = 0;
    state.stack = [];
  }

  if (action.type === 'setInput') {
    Object.assign(state.input, action.input);

    state.initial.input.Icon ??= action.input.Icon ?? null;
    state.initial.input.placeholder ??= action.input.placeholder ?? null;
  }

  if (action.type === 'addOption') {
    state.options.items.push(action.option);

    if (state.stack.length === 0) {
      state.initial.options.items.push(action.option);
    }
  }

  if (action.type === 'removeOption') {
    state.options.items = filterById(state.options.items, action.optionId);
    state.initial.options.items = filterById(state.initial.options.items, action.optionId);
  }

  if (action.type === 'addContext') {
    state.options.contexts.push(action.context);

    if (state.stack.length === 0) {
      state.initial.options.contexts.push(action.context);
    }
  }

  if (action.type === 'removeContext') {
    state.options.contexts = filterById(state.options.contexts, action.contextId);
    state.initial.options.contexts = filterById(state.initial.options.contexts, action.contextId);
  }

  if (action.type === 'setHighlightedIndex') {
    state.options.highlightedIndex = action.highlightedIndex;
  }

  if (action.type === 'push') {
    state.stack.push({
      input: {
        Icon: state.input.Icon,
        placeholder: state.input.placeholder,
      },
      options: {
        items: state.options.items,
        contexts: state.options.contexts,
      },
    });

    state.input.value = '';
    state.options.items = [];
    state.options.contexts = [];
    state.options.highlightedIndex = 0;
  }

  if (action.type === 'pop') {
    const result = state.stack.pop();

    if (result) {
      Object.assign(state.input, result.input);
      Object.assign(state.options, result.options);
    }
  }

  return state;
}

function filterById<T extends { id: string }>(collection: T[], id: string) {
  return collection.filter((item) => item.id !== id);
}
