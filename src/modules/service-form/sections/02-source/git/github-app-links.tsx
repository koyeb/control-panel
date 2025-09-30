import { useMutation } from '@tanstack/react-query';

import { apiMutation, useGithubApp, useOrganization } from 'src/api';
import { notify } from 'src/application/notify';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.serviceForm.source.git');

export function GithubAppLinks() {
  const t = T.useTranslate();

  const organization = useOrganization();
  const githubApp = useGithubApp();

  const { mutate: resync } = useMutation({
    ...apiMutation('post /v1/git/sync/organization/{organization_id}', {
      path: { organization_id: organization.id },
    }),
    onMutate() {
      notify.info(t('repositoriesSynchronized'));
    },
  });

  return (
    <p className="text-xs text-dim">
      <T
        id="githubAppLinks"
        values={{
          resynchronizeLink: (children) => (
            <button type="button" className="text-link" onClick={() => resync()}>
              {children}
            </button>
          ),
          githubAppLink: (children) => (
            <a href={githubApp?.installationUrl} className="text-link">
              {children}
            </a>
          ),
        }}
      />
    </p>
  );
}
