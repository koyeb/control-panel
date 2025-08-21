import { Button } from '@koyeb/design-system';
import { useIsMutating } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useOneClickAppsQuery } from 'src/api/hooks/catalog';
import { OneClickApp } from 'src/api/model';
import { DocumentTitle } from 'src/components/document-title';
import { ServiceEstimatedCost } from 'src/components/service-estimated-cost';
import { useNavigate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { ServiceCost } from 'src/modules/service-form/helpers/estimated-cost';
import { OneClickAppForm } from 'src/modules/service-form/one-click-app-form';
import { hasProperty } from 'src/utils/object';

const T = createTranslate('pages.oneClickApps.deploy');

export function OneClickAppDeployPage({ slug }: { slug: string }) {
  const navigate = useNavigate();

  const oneClickAppsQuery = useOneClickAppsQuery();
  const app = oneClickAppsQuery.data?.find(hasProperty('slug', slug));

  const [cost, setCost] = useState<ServiceCost>();

  useEffect(() => {
    if (oneClickAppsQuery.isSuccess && app === undefined) {
      void navigate({ to: '/deploy', replace: true });
    }
  }, [oneClickAppsQuery, app, navigate]);

  const isDeploying = useIsMutating({ mutationKey: ['deployOneClickApp'] }) > 0;

  if (!app) {
    return null;
  }

  return (
    <div className="col gap-6">
      <DocumentTitle title={app.name} />

      <div className="col items-stretch gap-8 lg:row">
        <div className="col grow gap-8">
          <Header app={app} />
          <OneClickAppForm app={app} onCostChanged={setCost} />
        </div>

        {cost && (
          <div className="max-w-md lg:min-h-[calc(100vh-6rem)] lg:max-w-xs">
            <div className="lg:sticky lg:top-48">
              <ServiceEstimatedCost
                cost={cost}
                button={
                  <Button
                    size={3}
                    type="submit"
                    form="one-click-app-form"
                    loading={isDeploying}
                    className="w-full"
                  >
                    <T id="submitButton" />
                  </Button>
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Header({ app }: { app: OneClickApp }) {
  return (
    <header className="col gap-2">
      <div className="row items-center gap-3">
        <div className="rounded-md bg-black/80 p-2 dark:bg-transparent">
          <img src={app.logo} className="size-6" />
        </div>

        <div className="text-3xl">{app.name}</div>
      </div>

      <p className="text-dim">{app.description}</p>
    </header>
  );
}
