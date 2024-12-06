import { useRef, useState } from 'react';

import { Input } from '@koyeb/design-system';
import { onKeyDownPositiveInteger } from 'src/application/restrict-keys';

import { Footer } from '../components/footer';
import imgCroissants3 from '../images/croissants-3.png';
import { WrappedData } from '../wrapped-data';

export function Metrics({ data, next }: { data: WrappedData; next: () => void }) {
  const [tries, setTries] = useState(3);
  const [lastAnswer, setLastAnswer] = useState<number>();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const value = Number.parseInt(new FormData(event.currentTarget).get('guess') as string);

    if (!Number.isFinite(value) || tries <= 0) {
      return;
    }

    setLastAnswer(Number(value));
    setTries(value === data.requests ? 0 : tries - 1);
  };

  const result = Math.abs(Math.log10(data.requests) - Math.log10(lastAnswer ?? 0));

  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <p className="my-4 text-2xl">Can you guess how many requests your service handled this year?</p>

      <div className="my-4">
        <img src={imgCroissants3} className="w-full" />
      </div>

      <div className="col flex-1 justify-evenly text-lg">
        <div>
          <p className="text-center text-xl">Give us your best guess</p>
          {tries < 3 && <p className="text-center">{tries} tries remaining!</p>}
        </div>

        <form ref={formRef} onSubmit={handleSubmit}>
          <Input
            name="guess"
            onKeyDown={onKeyDownPositiveInteger}
            className="mx-auto max-w-32"
            inputBoxClassName="border-strong"
          />
        </form>

        {lastAnswer !== undefined && tries > 0 && (
          <p className="text-center text-6xl">{lastAnswer < data.requests ? 'Higher!' : 'Lower!'}</p>
        )}

        {tries === 0 && (
          <>
            <p className="text-center text-2xl">{data.requests} requests!</p>

            <p className="text-center text-lg">
              {lastAnswer === data.requests && "That's it!!!"}
              {result > 0 && result <= 2 && 'So close!!'}
              {result > 2 && result <= 3 && 'Not far!'}
              {result > 3 && result <= 4 && 'Nice try!'}
              {result > 4 && 'Can you believe it?'}
            </p>
          </>
        )}
      </div>

      <Footer next={() => (tries === 0 ? next() : formRef.current?.requestSubmit?.())} />
    </>
  );
}
