import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';

declare global {
  interface Window {
    openDialog: (dialogId: string) => void;
  }
}

type DialogContext = {
  openDialogId: string | undefined;
  setOpenDialogId: (dialogId: string | undefined) => void;
};

const dialogContext = createContext<DialogContext>(null as never);

export function DialogProvider(props: { children: React.ReactNode }) {
  const [openDialogId, setOpenDialogId] = useState<string>();
  const value = useMemo(() => ({ openDialogId, setOpenDialogId }), [openDialogId]);

  useEffect(() => {
    window.openDialog = setOpenDialogId;
  }, []);

  return createElement(dialogContext.Provider, { value }, props.children);
}

export function useDialogContext() {
  const value = useContext(dialogContext);

  if (value === null) {
    throw new Error('Missing dialog context');
  }

  return value;
}
