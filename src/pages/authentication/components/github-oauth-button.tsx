import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';

import { Spinner } from '@koyeb/design-system';
import { useApiMutationFn } from 'src/api/use-api';
import { IconGithub } from 'src/components/icons';
import { useSearchParam } from 'src/hooks/router';
import { assert, AssertionError } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';

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
    <button
      type="button"
      onClick={() => mutation.mutate()}
      className={clsx(
        'row w-full items-center justify-center gap-2 rounded-md bg-[#0F0F0F] px-4 py-2 font-medium text-white',
        className,
      )}
    >
      {mutation.isPending ? <Spinner className="size-4" /> : <IconGithub className="size-4" />}
      {children}
    </button>
  );
}
