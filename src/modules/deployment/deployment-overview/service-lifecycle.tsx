import { Link } from 'src/components/link';
import {
  ServiceDeleteAfterCreateBadge,
  ServiceDeleteAfterSleepBadge,
} from 'src/components/service-lifecycle-badges';
import { IconClock } from 'src/icons';
import { Translate, createTranslate } from 'src/intl/translate';
import { Service } from 'src/model';

const T = createTranslate('modules.deployment.deploymentOverview.serviceLifecycle');

export function ServiceLifecycle({ service }: { service: Service }) {
  const { deleteAfterCreate, deleteAfterSleep } = service.lifeCycle;

  const afterCreate = deleteAfterCreate !== undefined && (
    <ServiceDeleteAfterCreateBadge service={service} deleteAfterCreate={deleteAfterCreate} />
  );

  const afterSleep = deleteAfterSleep !== undefined && (
    <ServiceDeleteAfterSleepBadge deleteAfterSleep={deleteAfterSleep} />
  );

  const message = () => {
    if (afterCreate && afterSleep) {
      return <T id="both" values={{ afterCreate, afterSleep }} />;
    }

    if (afterCreate) {
      return <T id="afterCreate" values={{ afterCreate }} />;
    }

    if (afterSleep) {
      return <T id="afterSleep" values={{ afterSleep }} />;
    }
  };

  if (!afterCreate && !afterSleep) {
    return null;
  }

  return (
    <div className="col justify-between gap-2 rounded-md bg-muted/50 p-3 @sm:row @sm:items-center @sm:gap-4">
      <div className="row items-center gap-2">
        <div>
          <IconClock className="size-4 text-dim" />
        </div>

        <p>{message()}</p>
      </div>

      <Link
        to="/services/$serviceId/settings"
        hash="lifeCycle"
        params={{ serviceId: service.id }}
        className="text-link"
      >
        <Translate id="common.configure" />
      </Link>
    </div>
  );
}
