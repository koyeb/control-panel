import { createContext, useContext, useMemo, useRef, useState } from 'react';

export type PaletteItem = {
  label: string;
  description?: string;
  render?: () => React.ReactNode;
  keywords: string[];
  weight?: number;
  loading?: boolean;
  keepOpen?: boolean;
  execute: () => void;
};

type CommandPaletteState = {
  defaultItems: Set<PaletteItem>;
  items?: PaletteItem[];
  setItems: (items?: PaletteItem[]) => void;

  inputValue: string;
  setInputValue: (inputValue: string) => void;

  loading: boolean;
  setLoading: (loading: boolean) => void;
  mutationEffects: { onMutate: () => void; onSettled: () => void };
};

const context = createContext<CommandPaletteState>(null as never);

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<PaletteItem[]>();
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const defaultItems = useRef<Set<PaletteItem>>(new Set());

  const value = useMemo<CommandPaletteState>(
    () => ({
      defaultItems: defaultItems.current,
      items,
      setItems,

      inputValue,
      setInputValue,

      loading,
      setLoading,
      mutationEffects: {
        onMutate: () => setLoading(true),
        onSettled: () => setLoading(false),
      },
    }),
    [loading, inputValue, items],
  );

  return <context.Provider value={value}>{children}</context.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCommandPaletteContext() {
  return useContext(context);
}
