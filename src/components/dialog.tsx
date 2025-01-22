import { useCallback } from 'react';

import {
  Dialog as BaseDialog,
  DialogFooter as BaseDialogFooter,
  DialogHeader as BaseDialogHeader,
  Button,
} from '@koyeb/design-system';
import { useDialogContext } from 'src/application/dialog-context';
import { Translate } from 'src/intl/translate';

type DialogProps = Omit<React.ComponentProps<typeof BaseDialog>, 'open' | 'onClose'> & {
  id: string;
};

export function Dialog({ id, ...props }: DialogProps) {
  const { openDialogId } = useDialogContext();
  const onClose = Dialog.useClose();

  return <BaseDialog open={id === openDialogId} onClose={onClose} {...props} />;
}

Dialog.useOpen = function useOpenDialog() {
  const { setOpenDialogId } = useDialogContext();

  return useCallback(
    (dialogId: string) => {
      setOpenDialogId(dialogId);
    },
    [setOpenDialogId],
  );
};

Dialog.useClose = function useCloseDialog() {
  const { setOpenDialogId } = useDialogContext();

  return useCallback(() => {
    setOpenDialogId(undefined);
  }, [setOpenDialogId]);
};

export function DialogHeader(props: Omit<React.ComponentProps<typeof BaseDialogHeader>, 'onClose'>) {
  const closeDialog = Dialog.useClose();

  return <BaseDialogHeader onClose={closeDialog} {...props} />;
}

export function DialogFooter(props: React.ComponentProps<typeof BaseDialogFooter>) {
  return <BaseDialogFooter {...props} />;
}

export function CloseDialogButton(props: React.ComponentProps<typeof Button>) {
  const closeDialog = Dialog.useClose();

  return (
    <Button variant="ghost" color="gray" onClick={closeDialog} {...props}>
      {props.children ?? <Translate id="common.close" />}
    </Button>
  );
}
