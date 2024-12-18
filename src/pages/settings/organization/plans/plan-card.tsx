import { IconCheck } from 'src/components/icons';
import { FormattedPrice } from 'src/intl/formatted';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('pages.organizationSettings.plans');

type PlanCardProps = {
  name: React.ReactNode;
  description: React.ReactNode;
  price: number;
  features: React.ReactNode[];
  cta: React.ReactNode;
};

export function PlanCard({ name, description, price, features, cta }: PlanCardProps) {
  return (
    <div className="col gap-4 rounded-md border p-4 shadow-md">
      <div>
        <div className="mb-1 text-2xl font-semibold">{name}</div>

        <div>
          <T
            id="price"
            values={{
              price: (
                <span className="text-lg">
                  <FormattedPrice value={price} digits={0} />
                </span>
              ),
            }}
          />
        </div>
      </div>

      <div>{description}</div>

      <ul>
        {features.map((feature, index) => (
          <li key={index} className="row items-start gap-1 py-2">
            <div>
              <IconCheck className="size-5" />
            </div>
            <div>{feature}</div>
          </li>
        ))}
      </ul>

      <div className="mt-auto">{cta}</div>
    </div>
  );
}
