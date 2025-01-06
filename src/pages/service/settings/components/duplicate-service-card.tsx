import { Service } from 'src/api/model';
import { routes } from 'src/application/routes';
import { LinkButton } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.service.settings.duplicateService');

type DuplicateServiceCardProps = {
  service: Service;
};

export function DuplicateServiceCard({ service }: DuplicateServiceCardProps) {
  return (
    <div className="card row col-start-1 items-center gap-4 p-3">
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
        href={routes.deploy() + `?duplicate-service-id=${service.id}`}
        className="ml-auto"
      >
        <T id="duplicate" />
      </LinkButton>
    </div>
  );
}
