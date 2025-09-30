import { useMutation } from '@tanstack/react-query';

import { apiMutation } from 'src/api/api';
import { IconGithub } from 'src/icons';
import { AssertionError, assert } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';

import { AuthButton } from './auth-button';

type GithubOAuthButtonProps = {
  action: 'signin' | 'signup';
  metadata?: string;
  className?: string;
  children: React.ReactNode;
};

export function GithubOAuthButton({ action, metadata, className, children }: GithubOAuthButtonProps) {
  const mutation = useMutation({
    ...apiMutation('get /v1/account/oauth', {
      query: { action, metadata },
    }),
    meta: { token: null },
    onSuccess({ oauth_providers }) {
      const provider = oauth_providers!.find(hasProperty('id', 'github'));

      assert(
        provider !== undefined,
        new AssertionError('Cannot find github oauth provider', { oauth_providers }),
      );

      window.location.assign(provider.url!);
    },
  });

  return (
    <AuthButton
      type="button"
      loading={mutation.isPending || mutation.isSuccess}
      onClick={() => mutation.mutate()}
      className={className}
    >
      <IconGithub className="size-4" />
      {children}
    </AuthButton>
  );
}
