import imgComputer from '../images/computer.png';
import { WrappedData } from '../wrapped-data';

export function Services({ data, next }: { data: WrappedData; next: () => void }) {
  const mostActiveService = data.mostActiveServices[0];
  const otherActiveServices = data.mostActiveServices.slice(1);

  return (
    <div onClick={next} className="col h-full justify-evenly gap-4 text-left text-3xl font-semibold">
      <p>You created {data.createdServices} services this year.</p>

      <p>
        There is one that stands out. You&apos;ve been most active on{' '}
        {`${mostActiveService?.appName}/${mostActiveService?.serviceName}`}
      </p>

      {otherActiveServices.length > 1 && (
        <div className="col gap-4 font-normal">
          <p className="text-2xl">Here are your top services:</p>

          <ol className="list-inside list-decimal text-xl">
            {otherActiveServices.map((service, index) => (
              <li key={index}>
                {service.appName}/{service.serviceName}
              </li>
            ))}
          </ol>
        </div>
      )}

      <img src={imgComputer} className="mx-auto h-32" />
    </div>
  );
}
