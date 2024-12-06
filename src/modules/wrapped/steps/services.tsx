import { Footer } from '../components/footer';
import imgComputer from '../images/computer.png';
import { WrappedData } from '../wrapped-data';

export function Services({ data, next }: { data: WrappedData; next: () => void }) {
  const mostActiveService = data.mostActiveServices[0];
  const otherActiveServices = data.mostActiveServices.slice(1);

  return (
    <>
      <p className="text-2xl font-semibold">
        You created <strong>{data.createdServices}</strong> services this year.
      </p>

      <p className="my-8 text-2xl">
        There is one that stands out. You&apos;ve been most active on{' '}
        <strong>
          {mostActiveService?.appName}/{mostActiveService?.serviceName}
        </strong>
      </p>

      {otherActiveServices.length > 1 && (
        <>
          <p className="mt-2 text-lg">Here are your top {otherActiveServices.length} services:</p>

          <ol className="list-inside list-decimal pl-4 pt-4 ">
            {otherActiveServices.map((service, index) => (
              <li key={index} className="text-lg">
                {service.appName}/{service.serviceName}
              </li>
            ))}
          </ol>
        </>
      )}

      <div className="col flex-1 items-center justify-center">
        <img src={imgComputer} />
      </div>

      <Footer next={next} />
    </>
  );
}
