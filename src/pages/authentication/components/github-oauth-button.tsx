import { useMutation } from '@tanstack/react-query';

import { apiMutation } from 'src/api';
import { useAuthKit } from 'src/application/authkit';
import { FeatureFlag } from 'src/hooks/feature-flag';
import { IconGithub } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { AssertionError, assert } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';

import { AuthButton } from './auth-button';

const T = createTranslate('pages.authentication.githubOAuth');

type GithubOAuthButtonProps = {
  action: 'signin' | 'signup';
  metadata?: string;
  className?: string;
  children: React.ReactNode;
};

export function GithubOAuthButton({ action, metadata, className, children }: GithubOAuthButtonProps) {
  const authKit = useAuthKit();

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
    <FeatureFlag
      feature="workos-signup"
      fallback={
        <AuthButton
          type="button"
          loading={mutation.isPending || mutation.isSuccess}
          onClick={() => mutation.mutate()}
          className={className}
        >
          <IconGithub className="size-4" />
          {children}
        </AuthButton>
      }
    >
      <AuthButton type="button" onClick={() => void authKit.signIn({ next: metadata })} className={className}>
        <T id="button" />
      </AuthButton>
      <div className="mt-4 row items-center gap-1 text-dim">
        <IconGithub className="size-4" />
        <T id="details" />
      </div>
    </FeatureFlag>
  );
}
