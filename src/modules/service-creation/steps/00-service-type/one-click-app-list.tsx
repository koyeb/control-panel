import { useOneClickApps } from 'src/api/hooks/catalog';
import { ExternalLink, Link } from 'src/components/link';
import { IconArrowRight } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { isDefined } from 'src/utils/generic';
import { hasProperty } from 'src/utils/object';

import { ServiceTypeItem } from './components/service-type-item';

// cSpell:words bun calcom ollama

const T = createTranslate('modules.serviceCreation.serviceType');

export function OneClickAppList() {
  const oneClickApps = useOneClickApps();

  const apps = [
    oneClickApps.find(hasProperty('slug', 'bun')),
    oneClickApps.find(hasProperty('slug', 'calcom')),
    oneClickApps.find(hasProperty('slug', 'ollama')),
  ].filter(isDefined);

  return (
    <>
      <span className="font-medium text-dim">
        <T id="navigation.deployOneClickApp" />
      </span>

      <ul>
        {apps.map((app) => (
          <Link key={app.slug} to={app.deployUrl}>
            <ServiceTypeItem
              icon={
                <div className="rounded-md bg-black/60 p-1.5">
                  <img src={app.logo} className="size-6 rounded-md grayscale" />
                </div>
              }
              label={app.name}
            />
          </Link>
        ))}
      </ul>

      <ExternalLink href="https://koyeb.com/deploy" className="ms-4 row items-center gap-1 text-link">
        <T id="navigation.moreOneClickApps" />
        <IconArrowRight className="size-4" />
      </ExternalLink>
    </>
  );
}
