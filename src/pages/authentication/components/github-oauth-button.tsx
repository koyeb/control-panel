import { useMutation } from '@tanstack/react-query';

import { useApiMutationFn } from 'src/api/use-api';
import { IconGithub } from 'src/components/icons';
import { useSearchParam } from 'src/hooks/router';
import { assert, AssertionError } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';

import { AuthButton } from './auth-button';

type GithubOAuthButtonProps = {
  action: 'signin' | 'signup';
  className?: string;
  children: React.ReactNode;
};

export function GithubOAuthButton({ action, className, children }: GithubOAuthButtonProps) {
  const [next] = useSearchParam('next');

  const mutation = useMutation({
    ...useApiMutationFn('setUpOAuth', {
      token: undefined,
      query: { action, metadata: next ?? undefined },
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
