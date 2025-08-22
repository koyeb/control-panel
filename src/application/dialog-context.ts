import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';

declare global {
  interface Window {
    openDialog: (dialogId: string) => void;
  }
}

type DialogContext = {
  dialogId: string | undefined;
  context?: Record<string, unknown>;
  openDialog: (dialogId: string | undefined, context?: Record<string, unknown>) => void;
  closeDialog: () => void;
};

const dialogContext = createContext<DialogContext>(null as never);

export function DialogProvider(props: { children: React.ReactNode }) {
  const [dialogId, setDialogId] = useState<string>();
  const [context, setContext] = useState<Record<string, unknown>>();

  const openDialog = useCallback<DialogContext['openDialog']>((dialogId, context) => {
    setDialogId(dialogId);
    setContext(context);
  }, []);

  const closeDialog = useCallback<DialogContext['closeDialog']>(() => {
    setDialogId(undefined);
    setContext(undefined);
  }, []);

  const value = useMemo<DialogContext>(
    () => ({ dialogId, context, openDialog, closeDialog }),
    [dialogId, context, openDialog, closeDialog],
  );

  useEffect(() => {
    window.openDialog = openDialog;
  }, [openDialog]);

  return createElement(dialogContext.Provider, { value }, props.children);
}

export function useDialogContext() {
  const value = useContext(dialogContext);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (value === null) {
    throw new Error('Missing dialog context');
  }

  return value;
}
