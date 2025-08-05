import { Button } from '@koyeb/design-system';
import { useIsMutating } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useOneClickAppsQuery } from 'src/api/hooks/catalog';
import { OneClickApp } from 'src/api/model';
import { DocumentTitle } from 'src/components/document-title';
import { LinkButton } from 'src/components/link';
import { ServiceEstimatedCost } from 'src/components/service-estimated-cost';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { IconChevronLeft } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { ServiceCost } from 'src/modules/service-form/helpers/estimated-cost';
import { OneClickAppForm } from 'src/modules/service-form/one-click-app-form';
import { hasProperty } from 'src/utils/object';

const T = createTranslate('pages.deploy.oneClickApp');

export function DeployOneClickApp() {
  const navigate = useNavigate();

  const oneClickAppParam = useSearchParams().get('one-click-app');
  const oneClickAppsQuery = useOneClickAppsQuery();
  const app = oneClickAppsQuery.data?.find(hasProperty('slug', oneClickAppParam));

  const [cost, setCost] = useState<ServiceCost>();

  useEffect(() => {
    if (oneClickAppsQuery.isSuccess) {
      if (app === undefined) {
        navigate({
          search: (prev) => ({ ...prev, 'one-click-app': null }),
          replace: true,
        });
      } else {
        const url = new URL(app.deployUrl);

        navigate({
          search: {
            ...Object.fromEntries(url.searchParams),
            'one-click-app': app.slug,
          },
          replace: true,
        });
      }
    }
  }, [oneClickAppsQuery, app, navigate]);

  const isDeploying = useIsMutating({ mutationKey: ['deployOneClickApp'] }) > 0;

  if (!app) {
    return null;
  }

  return (
    <div className="col gap-6">
      <DocumentTitle title={app.name} />

      <div className="col items-start gap-8 lg:row">
        <div className="col grow gap-8">
          <Header app={app} />

          <OneClickAppForm onCostChanged={setCost} />

          <LinkButton to="/one-click-apps" color="gray" className="self-start">
            <IconChevronLeft className="size-4" />
            <T id="back" />
          </LinkButton>
        </div>

        {cost && (
          <div className="top-32 max-w-md lg:sticky lg:max-w-xs">
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
