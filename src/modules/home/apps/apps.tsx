import { AppList } from 'src/model';

import { AppItem } from './app-item';
import { EditAppDialog } from './components/edit-app-dialog';

export function Apps({ apps }: { apps: AppList }) {
  return (
    <div className="col min-w-0 flex-1 gap-6">
      {apps.apps.map((app) => {
        const services = apps.services.get(app.id);

        if (!services?.length) {
          return null;
        }

        return (
          <AppItem
            key={app.id}
            app={app}
            services={services}
            latestDeployments={apps.latestDeployments}
            activeDeployments={apps.activeDeployments}
            activeDeploymentsReplicas={apps.activeDeploymentsReplicas}
          />
        );
      })}

      <EditAppDialog />
    </div>
  );
}
