import { createContext, createElement, useContext, useMemo, useState } from 'react';

type DialogContext = {
  openDialogId: string | undefined;
  setOpenDialogId: (dialogId: string | undefined) => void;
};

const dialogContext = createContext<DialogContext>(null as never);

export function DialogProvider(props: { children: React.ReactNode }) {
  const [openDialogId, setOpenDialogId] = useState<string>();
  const value = useMemo(() => ({ openDialogId, setOpenDialogId }), [openDialogId]);

  return createElement(dialogContext.Provider, { value }, props.children);
}

export function useDialogContext() {
  const value = useContext(dialogContext);

  if (value === null) {
    throw new Error('Missing dialog context');
  }

  return value;
}
