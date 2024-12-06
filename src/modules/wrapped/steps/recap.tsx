import { useUser } from 'src/api/hooks/session';

import imgCongrats from '../images/congrats.png';

export function Recap() {
  const user = useUser();

  return (
    <>
      <div className="col flex-1 justify-center gap-4">
        <p className="text-center text-3xl font-medium">That was something!</p>

        <p className="text-center text-2xl font-medium">2024 will be remembered, right {user.name}?</p>
      </div>

      <div>
        <img src={imgCongrats} />
      </div>
    </>
  );
}
