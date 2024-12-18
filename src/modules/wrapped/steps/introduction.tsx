import { useUser } from 'src/api/hooks/session';

import imgWand from '../images/wand.png';
import { WrappedData } from '../wrapped-data';

export function Introduction({ data, next }: { data: WrappedData; next: () => void }) {
  const user = useUser();

  return (
    <div onClick={next} className="col h-full justify-between gap-4 text-center text-3xl font-semibold">
      <p className="my-8">What a year, {user.name}!</p>

      <p>You deployed {data.deployments} times this year!</p>

      <div>
        <img src={imgWand} className="h-48" />
      </div>

      {data.deployments === 0 && <p>There&apos;s not much to say, actually. Come back next year!</p>}

      {data.deployments > 0 && <p>We prepared a recap of your best Koyeb events!</p>}

      {data.deployments > 0 && (
        <div>
          <button onClick={next} className="rounded-full border-2 px-5 py-3">
            Let&apos;go!
          </button>
        </div>
      )}
    </div>
  );
}
