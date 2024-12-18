import { useUser } from 'src/api/hooks/session';

import imgCongrats1 from '../images/congrats-1.png';
import imgCongrats2 from '../images/congrats-2.png';

export function Recap({ next }: { next: () => void }) {
  const user = useUser();

  return (
    <div onClick={next} className="col h-full justify-between gap-4 text-center text-3xl font-semibold">
      <img src={imgCongrats1} className="max-w-64" />

      <div className="col gap-4">
        <p>That was something!</p>
        <p className="text-2xl">2024 will be remembered, right {user.name}?</p>
      </div>

      <img src={imgCongrats2} />
    </div>
  );
}
