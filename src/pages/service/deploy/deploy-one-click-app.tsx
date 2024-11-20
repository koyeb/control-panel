import { useEffect } from 'react';

import { useOneClickAppsQuery } from 'src/api/hooks/service';
import { OneClickApp } from 'src/api/model';
import { DocumentTitle } from 'src/components/document-title';
import { useSearchParam } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';
import { OneClickAppForm } from 'src/modules/service-form/one-click-app-form';
import { hasProperty } from 'src/utils/object';

const T = Translate.prefix('pages.deploy');

export function DeployOneClickApp() {
  const t = T.useTranslate();

  const [oneClickAppSlug, setOneClickAppSlug] = useSearchParam('one_click_app');
  const oneClickAppsQuery = useOneClickAppsQuery();
  const app = oneClickAppsQuery.data?.find(hasProperty('slug', oneClickAppSlug));

  useEffect(() => {
    if (oneClickAppsQuery.isSuccess && app === undefined) {
      setOneClickAppSlug(null, { replace: true });
    }
  }, [oneClickAppsQuery, app, setOneClickAppSlug]);

  if (app === undefined) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <DocumentTitle title={t('documentTitle')} />
      <Header app={app} />
      <OneClickAppForm />
    </div>
  );
}

function Header({ app }: { app: OneClickApp }) {
  return (
    <header className="col my-6 items-center gap-4 sm:my-12">
      <div className="rounded-md bg-black/60 p-1.5">
        <img src={app.logo} className="h-24 rounded-md grayscale" />
      </div>

      <div className="col max-w-md gap-2 text-center">
        <div className="text-2xl">
          <T id="oneClickApp.title" values={{ appName: app.name }} />
        </div>
        <div className="text-lg text-dim">{app.description}</div>
      </div>
    </header>
  );
}
