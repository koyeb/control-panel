import { Service } from 'src/api/model';
import { LinkButton } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.service.settings.duplicateService');

type DuplicateServiceCardProps = {
  service: Service;
};

export function DuplicateServiceCard({ service }: DuplicateServiceCardProps) {
  return (
    <div className="col-start-1 card row items-center gap-4 p-3">
      <div className="col flex-1 gap-2">
        <strong>
          <T id="title" />
        </strong>

        <p className="text-dim">
          <T id="description" />
        </p>
      </div>

      <LinkButton
        color="gray"
        to="/deploy"
        search={{ 'duplicate-service-id': service.id }}
        className="ml-auto"
      >
        <T id="duplicate" />
      </LinkButton>
    </div>
  );
}
