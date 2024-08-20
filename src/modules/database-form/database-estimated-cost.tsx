import IconInfo from 'lucide-static/icons/info.svg?react';
import IconTicketPercent from 'lucide-static/icons/ticket-percent.svg?react';

import { Tooltip } from '@koyeb/design-system';
import { FormattedPrice } from 'src/intl/formatted';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('databaseForm.estimatedCost');

export function DatabaseEstimatedCost({ cost }: { cost?: number }) {
  return (
    <div className="card col gap-4 p-4">
      <div className="row items-center gap-2 font-medium">
        <T id="title" />
        <Tooltip content={<T id="tooltip" />}>
          {(props) => <IconInfo {...props} className="size-4" />}
        </Tooltip>
      </div>

      {cost === 0 && (
        <div className="font-medium">
          <T id="free" />
        </div>
      )}

      {cost !== undefined && cost > 0 && (
        <div className="row items-center gap-1">
          <IconTicketPercent className="size-4" />

          <span>
            <T id="total" />
          </span>

          <span className="ml-auto font-medium">
            <T id="pricePerMonth" values={{ price: <FormattedPrice value={cost} /> }} />
          </span>
        </div>
      )}
    </div>
  );
}
