import { useUser } from 'src/api/hooks/session';

import { Footer } from '../components/footer';
import imgWand from '../images/wand.png';
import { WrappedData } from '../wrapped-data';

export function Introduction({ data, next }: { data: WrappedData; next: () => void }) {
  const user = useUser();

  return (
    <>
      <div className="flex-1">
        <p className="mt-8 text-center text-4xl font-medium">What a year, {user.name}!</p>
      </div>

      <div className="flex-1">
        <p className="text-center text-3xl font-medium">You deployed {data.deployments} times this year!</p>

        <img src={imgWand} className="my-8 h-48" />

        {data.deployments === 0 && (
          <p className="m-8 text-center text-xl">
            There&apos;s not much to say, actually. Come back next year!
          </p>
        )}

        {data.deployments > 0 && (
          <p className="m-8 text-center text-xl">We prepared a recap of your best Koyeb events!</p>
        )}
      </div>

      {data.deployments > 0 && (
        <Footer next={next} className="mb-8 self-center rounded-full border-2">
          Let&apos;s go!
        </Footer>
      )}
    </>
  );
}
