import { IconEarth, IconScale3d } from 'src/components/icons';
import { FormattedPrice } from 'src/intl/formatted';
import { createTranslate } from 'src/intl/translate';
import { ServiceCost } from 'src/modules/service-form/helpers/estimated-cost';
import { entries } from 'src/utils/object';

const T = createTranslate('components.serviceEstimatedCost');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasAutoscaling(cost: ServiceCost): cost is [any, any] {
  return Array.isArray(cost);
}

type ServiceEstimatedCostProps = {
  cost?: ServiceCost;
};

export function ServiceEstimatedCost({ cost }: ServiceEstimatedCostProps) {
  if (!cost) {
    return null;
  }

  const description = () => {
    if (hasAutoscaling(cost)) {
      return <T id="descriptionScaling" />;
    }

    if (cost.instance.id === 'free') {
      return <T id="descriptionFreeInstance" />;
    }

    return <T id="descriptionFixedScaling" />;
  };

  return (
    <div className="card col gap-4 p-4">
      <div>
        <div className="text-base font-medium">
          <T id="title" />
        </div>
        <div className="text-xs text-dim">{description()}</div>
      </div>

      <Scaling cost={cost} />
      <Region cost={cost} />

      <hr />

      <Total cost={cost} />
    </div>
  );
}

type ScalingLineProps = {
  cost: ServiceCost;
};

function Scaling({ cost }: ScalingLineProps) {
  return (
    <div className="divide-y rounded border bg-muted px-2 dark:bg-muted/50">
      <div className="py-2">
        <div className="row items-center gap-1">
          <IconScale3d className="size-3.5" />

          {!hasAutoscaling(cost) && (
            <T
              id="fixedInstanceCount"
              values={{ count: cost.instanceCount, instance: cost.instance.displayName }}
            />
          )}

          {hasAutoscaling(cost) && (
            <T
              id="autoScalingInstanceCount"
              values={{
                min: cost[0].instanceCount,
                max: cost[1].instanceCount,
                instance: cost[0].instance.displayName,
              }}
            />
          )}
        </div>

        {hasAutoscaling(cost) && (
          <div className="text-xs text-dim">
            <T id="autoScalingEnabled" />
          </div>
        )}
      </div>

      <div className="py-2">
        {!hasAutoscaling(cost) && <Price {...cost.instancesPrice} />}

        {hasAutoscaling(cost) && (
          <AutoscalingPrice min={cost[0].instancesPrice} max={cost[1].instancesPrice} />
        )}
      </div>
    </div>
  );
}

type RegionLineProps = {
  cost: ServiceCost;
};

function Region({ cost }: RegionLineProps) {
  if (!hasAutoscaling(cost) && cost.regionCount <= 1) {
    return null;
  }

  return (
    <div className="-mt-2 rounded border bg-muted p-2 dark:bg-muted/50">
      <div className="row items-center gap-1">
        <IconEarth className="size-3.5" />
        <T id="regionCount" values={{ count: (hasAutoscaling(cost) ? cost[0] : cost).regionCount }} />
      </div>
      <div className="text-xs text-dim">
        {!hasAutoscaling(cost) ? (
          <T
            id="regionDescriptionFixedScaling"
            values={{ instanceCount: cost.instanceCount, instanceName: cost.instance.displayName }}
          />
        ) : (
          <T
            id="regionDescriptionScaling"
            values={{
              minInstanceCount: cost[0].instanceCount,
              maxInstanceCount: cost[1].instanceCount,
              instanceName: cost[0].instance.displayName,
            }}
          />
        )}
      </div>
    </div>
  );
}

type TotalLineProps = {
  cost: ServiceCost;
};

function Total({ cost }: TotalLineProps) {
  const total = () => {
    if (hasAutoscaling(cost)) {
      return <AutoscalingPrice min={cost[0].totalPrice} max={cost[1].totalPrice} />;
    }

    if (cost.instance.id === 'free') {
      return <T id="free" />;
    }

    return <Price {...cost.totalPrice} className="text-end" />;
  };

  return (
    <div className="row items-start justify-between gap-2">
      <div>
        <T id="total" />
      </div>

      <div>{total()}</div>
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
      <div className="text-xs font-medium">
        <T
          id="pricePerHour"
          values={{ price: <FormattedPrice value={perHour} digits={perHour < 1 ? 4 : undefined} /> }}
        />
      </div>
      <div className="text-xs text-dim">
        <T id="pricePerMonth" values={{ price: <FormattedPrice value={perMonth} /> }} />
      </div>
    </div>
  );
}

type AutoscalingPriceProps = {
  min: { perMonth: number; perHour: number };
  max: { perMonth: number; perHour: number };
};

function AutoscalingPrice({ min, max }: AutoscalingPriceProps) {
  return (
    <div className="row gap-8">
      {entries({ min, max }).map(([key, price]) => (
        <div key={key} className="col gap-1">
          <div className="text-xs text-dim">
            <T id={key} />
          </div>
          <Price perHour={price.perHour} perMonth={price.perMonth} />
        </div>
      ))}
    </div>
  );
}
