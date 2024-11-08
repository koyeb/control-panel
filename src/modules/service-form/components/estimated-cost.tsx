import { FormattedPrice } from 'src/intl/formatted';
import { Translate } from 'src/intl/translate';
import { entries } from 'src/utils/object';

import { useEstimatedCost } from '../helpers/estimated-cost';
import { ServiceForm } from '../service-form.types';

export function EstimatedCost({ form }: { form: ServiceForm }) {
  const cost = useEstimatedCost(form);

  if (cost === undefined) {
    return null;
  }

  return (
    <div className="row justify-end">
      {!Array.isArray(cost) && <Price {...cost.totalPrice} />}

      {Array.isArray(cost) && (
        <div className="row gap-8">
          {entries({ min: cost[0].totalPrice, max: cost[1].totalPrice }).map(([key, price]) => (
            <div key={key} className="col gap-1">
              <div className="text-xs text-dim">
                <Translate id={`serviceEstimatedCost.${key}`} />
              </div>
              <Price perHour={price.perHour} perMonth={price.perMonth} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type PriceProps = {
  perMonth: number;
  perHour: number;
  className?: string;
};

function Price({ perMonth, perHour, className }: PriceProps) {
  return (
    <div className={className}>
      <div className="text-base font-medium">
        <Translate
          id="serviceEstimatedCost.pricePerMonth"
          values={{ price: <FormattedPrice value={perMonth} /> }}
        />
      </div>

      <div className="text-xs text-dim">
        <Translate
          id="serviceEstimatedCost.pricePerHour"
          values={{ price: <FormattedPrice value={perHour} digits={perHour < 1 ? 4 : undefined} /> }}
        />
      </div>
    </div>
  );
}
