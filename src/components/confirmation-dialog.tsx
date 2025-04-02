import { useForm } from 'react-hook-form';

import { Button, ButtonColor } from '@koyeb/design-system';
import { handleSubmit } from 'src/hooks/form';
import { Translate } from 'src/intl/translate';

import { ControlledInput } from './controlled';
import { CloseDialogButton, Dialog, DialogFooter, DialogHeader } from './dialog';

type ConfirmationDialogProps = {
  id: string;
  resourceId?: string;
  title: React.ReactNode;
  description: React.ReactNode;
  destructiveAction?: boolean;
  destructiveActionMessage?: React.ReactNode;
  confirmationText: string;
  submitText: React.ReactNode;
  submitColor?: ButtonColor;
  onConfirm: () => Promise<unknown>;
};

export function ConfirmationDialog({
  id,
  resourceId,
  title,
  description,
  destructiveAction,
  destructiveActionMessage,
  confirmationText,
  submitText,
  submitColor = 'red',
  onConfirm,
}: ConfirmationDialogProps) {
  const form = useForm({
    defaultValues: {
      confirmationText: '',
    },
  });

  return (
    <Dialog
      id={id}
      context={resourceId ? { resourceId } : undefined}
      onClosed={form.reset}
      className="col w-full max-w-xl gap-4"
    >
      <DialogHeader title={title} />

      <p className="text-dim">{description}</p>

      {destructiveAction && (
        <p className="font-medium text-red">
          {destructiveAction && (destructiveActionMessage ?? <Translate id="common.destructiveAction" />)}
        </p>
      )}

      <form className="col gap-4" onSubmit={handleSubmit(form, onConfirm)}>
        <ControlledInput
          ref={(ref) => void (ref && setTimeout(() => ref.focus(), 0))}
          control={form.control}
          name="confirmationText"
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
    </Dialog>
  );
}
