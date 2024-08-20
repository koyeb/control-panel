import { useMutation } from '@tanstack/react-query';
import IconGithub from 'lucide-static/icons/github.svg?react';

import { Button } from '@koyeb/design-system';
import { useUser } from 'src/api/hooks/session';
import { useApiMutationFn } from 'src/api/use-api';
import { Translate } from 'src/intl/translate';
import { AssertionError, assert } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';

const T = Translate.prefix('pages.userSettings.general.githubAccount');

export function GithubAccount() {
  const user = useUser();

  const { mutate, isPending } = useMutation({
    ...useApiMutationFn('getOAuthProviders', {
      query: { action: 'register' },
    }),
    onSuccess({ oauth_providers }) {
      const provider = oauth_providers!.find(hasProperty('id', 'github'));

      assert(
        provider !== undefined,
        new AssertionError('Cannot find github oauth provider', { oauth_providers }),
      );

      window.open(provider.url);
    },
  });

  return (
    <div className="card">
      <div className="col gap-4 p-4">
        <div>
          <T id="label" />
        </div>

        {user.githubUser && (
          <p>
            <T id="accountRegistered" values={{ githubUser: user.githubUser }} />
          </p>
        )}

        {!user.githubUser && (
          <>
            <p className="text-dim">
              <T id="noGithubAccountRegistered" />
            </p>

            <Button onClick={() => mutate()} loading={isPending} className="self-start">
              <IconGithub className="size-5" />
              <T id="registerAccount" />
            </Button>
          </>
        )}
      </div>

      <footer className="text-xs text-dim">
        <T id="footer" />
      </footer>
    </div>
  );
}
