import {
  ServiceDeleteAfterCreateBadge,
  ServiceDeleteAfterSleepBadge,
} from 'src/components/service-lifecycle-badges';
import { createTranslate } from 'src/intl/translate';
import { Service } from 'src/model';

const T = createTranslate('pages.service.settings.lifecycle.footer');

export function FooterInfo({ service }: { service: Service }) {
  const { deleteAfterCreate, deleteAfterSleep } = service.lifeCycle;

  const afterCreate = deleteAfterCreate !== undefined && (
    <ServiceDeleteAfterCreateBadge service={service} deleteAfterCreate={deleteAfterCreate} />
  );

  const afterSleep = deleteAfterSleep !== undefined && (
    <ServiceDeleteAfterSleepBadge deleteAfterSleep={deleteAfterSleep} />
  );

  const message = () => {
    if (afterCreate && !afterSleep) {
      return <T id="afterCreate" values={{ value: afterCreate }} />;
    }

    if (!afterCreate && afterSleep) {
      return <T id="afterSleep" values={{ value: afterSleep }} />;
    }

    if (afterCreate && afterSleep) {
      return <T id="both" values={{ afterCreate, afterSleep }} />;
    }

    return <T id="none" />;
  };

  return <p className="text-dim">{message()}</p>;
}
