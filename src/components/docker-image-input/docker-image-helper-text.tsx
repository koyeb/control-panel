import { Spinner } from '@koyeb/design-system';
import { IconCheck } from 'src/components/icons';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('components.dockerImageInput');

type DockerImageHelperTextProps = {
  verifying: boolean;
  verified: boolean;
  error?: {
    type?: string;
    message?: React.ReactNode;
  };
  onRetry: () => void;
};

export function DockerImageHelperText({ verifying, verified, error, onRetry }: DockerImageHelperTextProps) {
  if (error) {
    return (
      <T
        id="error"
        values={{
          error: error.message,
          retry: (children) =>
            error.type === 'TIMEOUT' && (
              <button type="button" role="link" className="text-link" onClick={onRetry}>
                {children}
              </button>
            ),
        }}
      />
    );
  }

  if (verifying) {
    return (
      <span className="row items-center gap-1">
        <Spinner className="size-3" />
        <T id="pending" />
      </span>
    );
  }

  if (verified) {
    return (
      <span className="row items-center gap-1 text-green">
        <IconCheck className="size-3" />
        <T id="verified" />
      </span>
    );
  }

  return null;
}
