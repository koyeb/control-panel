import { useMutation } from '@tanstack/react-query';

import { Spinner } from '@koyeb/design-system';
import { useApiMutationFn } from 'src/api/use-api';
import { IconGithub } from 'src/components/icons';
import { assert, AssertionError } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';

type GithubOAuthButtonProps = {
  action: 'signin' | 'signup';
  children: React.ReactNode;
};

export function GithubOAuthButton({ action, children }: GithubOAuthButtonProps) {
  const mutation = useMutation({
    ...useApiMutationFn('setUpOAuth', {
      query: { action },
    }),
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
    <button type="button" onClick={() => mutation.mutate()} className="github-oauth-button">
      {children}
      {mutation.isPending ? <Spinner className="size-4" /> : <IconGithub className="size-4" />}
    </button>
  );
}
