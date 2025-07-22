import { IconCheck } from 'src/icons';

type PlanCardProps = {
  name: React.ReactNode;
  description: React.ReactNode;
  price: React.ReactNode;
  features: React.ReactNode[];
  cta: React.ReactNode;
};

export function PlanCard({ name, description, price, features, cta }: PlanCardProps) {
  return (
    <div className="col gap-4 rounded-md border p-4 shadow-md">
      <div>
        <div className="mb-1 text-2xl font-semibold">{name}</div>
        <div>{price}</div>
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
