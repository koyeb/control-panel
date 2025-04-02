import { dequal } from 'dequal';

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
  context?: Record<string, unknown>;
};

export function Dialog({ id, context: contextProp, ...props }: DialogProps) {
  const { dialogId, context } = useDialogContext();
  const onClose = Dialog.useClose();

  const open = id === dialogId && dequal(context, contextProp);

  return <BaseDialog open={open} onClose={onClose} {...props} />;
}

Dialog.useOpen = function useOpenDialog() {
  return useDialogContext().openDialog;
};

Dialog.useClose = function useCloseDialog() {
  return useDialogContext().closeDialog;
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
