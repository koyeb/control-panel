import { InputEnd, Spinner } from '@koyeb/design-system';

export function InputEndSpinner({ show }: { show: boolean }) {
  if (!show) {
    return null;
  }

  return (
    <InputEnd background={false}>
      <Spinner className="size-4" />
    </InputEnd>
  );
}
