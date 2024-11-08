import { useEffect } from 'react';

import { useExampleAppsQuery } from 'src/api/hooks/service';
import { ExampleApp } from 'src/api/model';
import { DocumentTitle } from 'src/components/document-title';
import { useSearchParam } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';
import { ExampleAppForm } from 'src/modules/service-form/example-app-form';
import { hasProperty } from 'src/utils/object';

const T = Translate.prefix('pages.deploy');

export function DeployExampleApp() {
  const t = T.useTranslate();

  const [exampleAppSlug, setExampleAppSlug] = useSearchParam('example_app');
  const exampleAppsQuery = useExampleAppsQuery();
  const app = exampleAppsQuery.data?.find(hasProperty('slug', exampleAppSlug));

  useEffect(() => {
    if (exampleAppsQuery.isSuccess && app === undefined) {
      setExampleAppSlug(null, { replace: true });
    }
  }, [exampleAppsQuery, app, setExampleAppSlug]);

  if (app === undefined) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <DocumentTitle title={t('documentTitle')} />
      <Header app={app} />
      <ExampleAppForm />
    </div>
  );
}

function Header({ app }: { app: ExampleApp }) {
  return (
    <header className="col my-6 items-center gap-4 sm:my-12">
      <div className="rounded-md bg-black/60 p-1.5">
        <img src={app.logo} className="h-24 rounded-md grayscale" />
      </div>

      <div className="col max-w-md gap-2 text-center">
        <div className="text-2xl">
          <T id="exampleApp.title" values={{ appName: app.name }} />
        </div>
        <div className="text-lg text-dim">{app.description}</div>
      </div>
    </header>
  );
}
