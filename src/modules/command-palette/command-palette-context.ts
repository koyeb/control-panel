import { createContext, createElement, useCallback, useContext, useEffect, useMemo } from 'react';

import { useMap } from 'src/hooks/collection';
import { createId } from 'src/utils/strings';

export type Command = {
  label: React.ReactNode;
  description: React.ReactNode;
  keywords: string[];
  weight?: number;
  execute: () => void | Promise<void>;
};

type CommandPaletteContext = ReturnType<typeof useMap<string, Command>>;

const commandPaletteContext = createContext<CommandPaletteContext>(null as never);

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  return createElement(commandPaletteContext.Provider, { value: useMap<string, Command>() }, children);
}

export function useCommands(search: string) {
  const [commandsMap] = useContext(commandPaletteContext);

  const filter = useCallback(
    (command: Command) => {
      if (search === '') {
        return true;
      }

      return search
        .split(' ')
        .filter((word) => word.trim() !== '')
        .every((word) => command.keywords.some((keyword) => keyword.match(word)));
    },
    [search],
  );

  return useMemo(() => {
    return Array.from(commandsMap.entries())
      .filter(([, command]) => filter(command))
      .map(([id, command]) => ({ id, ...command }));
  }, [commandsMap, filter]);
}

export function useRegisterCommand(
  param: Omit<Command, 'id'> | ((register: (command: Omit<Command, 'id'>) => void) => void),
  deps: React.DependencyList = [],
) {
  const [, { add: register, remove: unregister }] = useContext(commandPaletteContext);

  useEffect(() => {
    if (typeof param !== 'object') {
      return;
    }

    const id = createId();

    register(id, param);

    return () => {
      unregister(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register, unregister, ...deps]);

  useEffect(() => {
    if (typeof param !== 'function') {
      return;
    }

    const ids: string[] = [];

    param((command) => {
      const id = createId();

      ids.push();

      register(id, command);
    });

    return () => {
      ids.map(unregister);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register, unregister, ...deps]);
}
