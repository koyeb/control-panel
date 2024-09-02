import { useExampleApps } from 'src/api/hooks/service';
import { IconArrowRight } from 'src/components/icons';
import { ExternalLink, Link } from 'src/components/link';
import { Translate } from 'src/intl/translate';
import { isDefined } from 'src/utils/generic';
import { hasProperty } from 'src/utils/object';

import { ServiceTypeItem } from './components/service-type-item';

const T = Translate.prefix('serviceCreation.serviceType');

export function ExampleAppList() {
  const exampleApps = useExampleApps();

  const apps = [
    exampleApps.find(hasProperty('slug', 'bun')),
    exampleApps.find(hasProperty('slug', 'calcom')),
    exampleApps.find(hasProperty('slug', 'ollama')),
  ].filter(isDefined);

  return (
    <>
      <span className="font-medium text-dim">
        <T id="navigation.deployOneClickApp" />
      </span>

      <ul>
        {apps.map((app) => (
          <Link key={app.slug} href={app.deployUrl}>
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

      <ExternalLink href="https://koyeb.com/deploy" className="row text-link ms-4 items-center gap-1">
        <T id="navigation.moreOneClickApps" />
        <IconArrowRight className="size-4" />
      </ExternalLink>
    </>
  );
}
