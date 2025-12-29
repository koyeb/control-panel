import { Button, ButtonColor } from '@koyeb/design-system';
import { useForm } from 'react-hook-form';

import { handleSubmit } from 'src/hooks/form';
import { Translate } from 'src/intl/translate';

import { CloseDialogButton, Dialog, DialogFooter, DialogHeader } from './dialog';
import { ControlledInput } from './forms';

export type ConfirmationDialogProps = {
  title: React.ReactNode;
  description: React.ReactNode;
  destructiveAction?: boolean;
  destructiveActionMessage?: React.ReactNode;
  confirmationText: string;
  submitText: React.ReactNode;
  submitColor?: ButtonColor;
  onConfirm: () => Promise<unknown>;
  onAutofill?: () => void;
};

export function ConfirmationDialog() {
  return (
    <Dialog id="Confirmation" className="col w-full max-w-xl gap-4">
      {(props) => <DialogContent {...props} />}
    </Dialog>
  );
}

function DialogContent({
  title,
  description,
  destructiveAction,
  destructiveActionMessage,
  confirmationText,
  submitText,
  submitColor,
  onConfirm,
  onAutofill,
}: ConfirmationDialogProps) {
  const form = useForm({
    defaultValues: {
      confirmationText: '',
    },
  });

  return (
    <>
      <DialogHeader title={title} />

      <p className="text-dim">{description}</p>

      {destructiveAction && (
        <p className="font-medium text-red">
          {destructiveActionMessage ?? <Translate id="common.destructiveAction" />}
        </p>
      )}

      <form className="col gap-4" onSubmit={handleSubmit(form, onConfirm)}>
        <ControlledInput
          ref={(ref) => void (ref && setTimeout(() => ref.focus(), 0))}
          control={form.control}
          name="confirmationText"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          label={
            <Translate
              id="common.confirmationDialogText"
              values={{
                value: (children) => <span className="font-medium text-default">{children}</span>,
                confirmationText,
              }}
            />
          }
          onDoubleClick={(event) => {
            if (event.ctrlKey || event.metaKey) {
              form.setValue('confirmationText', confirmationText);
              onAutofill?.();
            }
          }}
        />

        <DialogFooter>
          <CloseDialogButton>
            <Translate id="common.cancel" />
          </CloseDialogButton>

          <Button
            type="submit"
            color={submitColor}
            disabled={form.watch('confirmationText') !== confirmationText}
            loading={form.formState.isSubmitting}
          >
            {submitText}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
