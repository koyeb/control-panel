import { useForm } from 'react-hook-form';

import { Button, ButtonColor, Dialog } from '@koyeb/design-system';
import { handleSubmit } from 'src/hooks/form';
import { Translate } from 'src/intl/translate';

import { ControlledInput } from './controlled';

type ConfirmationDialogProps = {
  open: boolean;
  onClose: () => void;
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
  open,
  onClose,
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
      isOpen={open}
      onClose={onClose}
      onClosed={form.reset}
      title={title}
      description={description}
      width="lg"
    >
      {destructiveAction && (
        <p className="mb-4 font-medium text-red">
          {destructiveAction && (destructiveActionMessage ?? <Translate id="common.destructiveAction" />)}
        </p>
      )}

      <form className="col gap-4" onSubmit={handleSubmit(form, onConfirm)}>
        <ControlledInput
          ref={(ref) => ref && setTimeout(() => ref.focus(), 0)}
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

        <footer className="row mt-2 justify-end gap-2">
          <Button variant="ghost" color="gray" onClick={onClose}>
            <Translate id="common.cancel" />
          </Button>

          <Button
            type="submit"
            color={submitColor}
            disabled={form.watch('confirmationText') !== confirmationText}
            loading={form.formState.isSubmitting}
          >
            {submitText}
          </Button>
        </footer>
      </form>
    </Dialog>
  );
}
