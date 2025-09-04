import { createContext, useContext } from 'react';

import { AssertionError, assert } from 'src/utils/assert';

import { CommandPalette } from './use-command-palette';

export const CommandPaletteContext = createContext<CommandPalette>(null as never);

export function useCommandPaletteContext() {
  const value = useContext(CommandPaletteContext);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  assert(value !== null, new AssertionError('Missing command palette provider'));

  return value;
}
