import { useEffect, useState } from 'react';

import { useOneClickAppsQuery } from 'src/api/hooks/catalog';
import { OneClickApp } from 'src/api/model';
import { DocumentTitle } from 'src/components/document-title';
import { ServiceEstimatedCost } from 'src/components/service-estimated-cost';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { ServiceCost } from 'src/modules/service-form/helpers/estimated-cost';
import { OneClickAppForm } from 'src/modules/service-form/one-click-app-form';
import { hasProperty } from 'src/utils/object';

const T = createTranslate('pages.deploy.oneClickApp');

export function DeployOneClickApp() {
  const t = T.useTranslate();
  const navigate = useNavigate();

  const oneClickAppParam = useSearchParams().get('one_click_app');
  const oneClickAppsQuery = useOneClickAppsQuery();
  const app = oneClickAppsQuery.data?.find(hasProperty('slug', oneClickAppParam));
  const [ready, setReady] = useState(false);

  const [cost, setCost] = useState<ServiceCost>();

  useEffect(() => {
    if (oneClickAppsQuery.isSuccess) {
      if (app === undefined) {
        navigate({
          search: (prev) => ({ ...prev, one_click_app: null }),
          replace: true,
        });
      } else {
        const url = new URL(app.deployUrl);

        navigate({
          search: {
            ...Object.fromEntries(url.searchParams),
            one_click_app: app.slug,
          },
        });
      }

      setReady(true);
    }
  }, [oneClickAppsQuery, app, navigate]);

  if (!app || !ready) {
    return null;
  }

  return (
    <div className="col gap-6">
      <DocumentTitle title={t('documentTitle', { appName: app.name }) as string} />

      <Header app={app} />

      <div className="col gap-8 xl:row">
        <div className="flex-1">
          <OneClickAppForm onCostChanged={setCost} />
        </div>

        <div className="col shrink-0 gap-8 xl:basis-80">
          <section>
            <div className="mb-2 text-sm font-medium">
              <T id="pricing" />
            </div>
            <ServiceEstimatedCost cost={cost} />
          </section>
        </div>
      </div>
    </div>
  );
}

function Header({ app }: { app: OneClickApp }) {
  return (
    <header className="mb-10 col items-center gap-4 text-center">
      <div className="rounded-md bg-black/80 p-2 dark:bg-transparent">
        <img src={app.logo} className="h-14 grayscale" />
      </div>

      <div className="col gap-1">
        <div className="text-2xl">
          <T id="title" values={{ appName: app.name }} />
        </div>
        <div className="max-w-xl text-dim">{app.description}</div>
      </div>
    </header>
  );
}
