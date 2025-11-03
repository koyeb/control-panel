import { useMutation } from '@tanstack/react-query';

import { apiMutation } from 'src/api';
import { useAuthKit } from 'src/application/authkit';
import { useFeatureFlag } from 'src/hooks/feature-flag';
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
  const authkit = useAuthKit();
  const workosSignup = useFeatureFlag('workos-signup');

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

  const onClick = () => {
    if (workosSignup) {
      void authkit.authenticatedWithGithub(metadata ?? null);
    } else {
      mutation.mutate();
    }
  };

  return (
    <AuthButton
      type="button"
      loading={mutation.isPending || mutation.isSuccess}
      onClick={onClick}
      className={className}
    >
      <IconGithub className="size-4" />
      {children}
    </AuthButton>
  );
}
