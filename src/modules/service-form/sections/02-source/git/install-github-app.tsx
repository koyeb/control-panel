import { useMutation } from '@tanstack/react-query';

import { Alert, Button } from '@koyeb/design-system';
import { useApiMutationFn } from 'src/api/use-api';
import { useHistoryState, useLocation } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.serviceForm.source.git');

export function InstallGithubApp() {
  const { githubAppInstallationRequested } = useHistoryState<{ githubAppInstallationRequested: boolean }>();
  const location = useLocation();

  const { mutate: installGithubApp } = useMutation({
    ...useApiMutationFn('installGithubApp', {
      body: { metadata: location },
    }),
    onSuccess(result) {
      window.location.replace(result.url!);
    },
  });

  return (
    <>
      <Alert
        variant="info"
        style="outline"
        title={<T id="installGithubApp.title" />}
        description={
          <T id={`installGithubApp.${githubAppInstallationRequested ? 'requested' : 'description'}`} />
        }
      />

      <Button variant="outline" className="self-start" onClick={() => installGithubApp()}>
        <T id="installGithubApp.button" />
      </Button>
    </>
  );
}
