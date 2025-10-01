import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';

import { apiMutation, useUser } from 'src/api';
import { IconGithub } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { AssertionError, assert } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';

const T = createTranslate('pages.userSettings.general.githubAccount');

export function GithubAccount() {
  const user = useUser();

  const { mutate, isPending } = useMutation({
    ...apiMutation('get /v1/account/oauth', {
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
      <div className="row items-center justify-between gap-4 p-3">
        <div>
          <div className="mb-2 font-medium">
            <T id="label" />
          </div>

          {user?.githubUser && (
            <p className="text-dim">
              <T id="accountRegistered" values={{ githubUser: user.githubUser }} />
            </p>
          )}

          {!user?.githubUser && (
            <>
              <p className="text-dim">
                <T id="noGithubAccountRegistered" />
              </p>
            </>
          )}
        </div>

        {!user?.githubUser && (
          <Button onClick={() => mutate()} loading={isPending}>
            <IconGithub className="size-5" />
            <T id="registerAccount" />
          </Button>
        )}
      </div>

      <footer className="text-xs text-dim">
        <T id="footer" />
      </footer>
    </div>
  );
}
