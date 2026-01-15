import { LinkButton } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';
import { Service } from 'src/model';

const T = createTranslate('pages.service.settings.duplicate');

type DuplicateServiceCardProps = {
  service: Service;
};

export function DuplicateServiceCard({ service }: DuplicateServiceCardProps) {
  return (
    <section className="col-start-1 card col gap-4 p-3">
      <div className="col gap-2">
        <strong>
          <T id="title" />
        </strong>

        <p className="text-dim">
          <T id="description" />
        </p>
      </div>

      <div className="row items-center gap-4">
        <LinkButton color="gray" to="/services/deploy" search={{ 'duplicate-service-id': service.id }}>
          <T id="duplicate" />
        </LinkButton>
      </div>
    </section>
  );
}
