import { useMutation } from '@tanstack/react-query';

import { Alert, Button } from '@koyeb/design-system';
import { useApiMutationFn } from 'src/api/use-api';
import { useLocation } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('serviceForm.source.git');

export function InstallGithubApp() {
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
        description={<T id="installGithubApp.description" />}
      />

      <Button variant="outline" className="self-start" onClick={() => installGithubApp()}>
        <T id="installGithubApp.button" />
      </Button>
    </>
  );
}
