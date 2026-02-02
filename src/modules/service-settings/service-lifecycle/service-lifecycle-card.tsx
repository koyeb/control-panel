import { createTranslate } from 'src/intl/translate';
import { Service } from 'src/model';

import { ServiceLifecycleForm } from './service-lifecycle-form';

const T = createTranslate('pages.service.settings.lifecycle');

export function ServiceLifeCycleCard({ service }: { service: Service }) {
  return (
    <section id="lifeCycle" className="col-start-1 card col gap-4 p-3">
      <div className="col gap-2">
        <strong>
          <T id="title" />
        </strong>

        <p className="text-dim">
          <T id="description" />
        </p>
      </div>

      <ServiceLifecycleForm service={service} />
    </section>
  );
}
