import { Spinner } from '@koyeb/design-system';
import { InputEnd } from '@koyeb/design-system/next';

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
