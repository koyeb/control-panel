import { useMutation } from '@tanstack/react-query';

import { useGithubApp } from 'src/api/hooks/git';
import { useOrganization } from 'src/api/hooks/session';
import { useApiMutationFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('serviceForm.source.git');

export function GithubAppLinks() {
  const t = T.useTranslate();

  const organization = useOrganization();
  const githubApp = useGithubApp();

  const { mutate: resync } = useMutation({
    ...useApiMutationFn('resyncRepositories', {
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
