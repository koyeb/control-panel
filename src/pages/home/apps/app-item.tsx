import { HelpTooltip } from '@koyeb/design-system';
import { App, Service } from 'src/api/model';
import { createTranslate } from 'src/intl/translate';

import { AppActions } from './components/app-actions';
import { ServiceItem } from './service-item';

const T = createTranslate('pages.home');

type AppItemProps = {
  app: App;
  services: Service[];
};

export function AppItem({ app, services }: AppItemProps) {
  return (
    <div className="col gap-2">
      <AppHeader app={app} />

      <div className="col gap-4">
        {services.map((service) => (
          <ServiceItem key={service.id} app={app} service={service} />
        ))}

        {services.length === 0 && <NoServicesFallback />}
      </div>
    </div>
  );
}

function AppHeader({ app }: { app: App }) {
  return (
    <div className="row items-center gap-4">
      <div className="row items-center gap-2">
        <span className="font-medium">{app.name}</span>

        <HelpTooltip icon="info">
          <T id="appTooltip" />
        </HelpTooltip>
      </div>

      <AppActions app={app} />
    </div>
  );
}

function NoServicesFallback() {
  return (
    <div className="col gap-4 text-dim">
      <T id="noServices" />
    </div>
  );
}
