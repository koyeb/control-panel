import clsx from 'clsx';
import { useRef, useState } from 'react';

import { Input } from '@koyeb/design-system';
import { onKeyDownPositiveInteger } from 'src/application/restrict-keys';

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
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onClick={() => {
        if (tries === 0) {
          next();
        } else {
          inputRef.current?.focus();
          formRef.current?.requestSubmit?.();
        }
      }}
      className="col h-full justify-between gap-4 text-center text-3xl font-semibold"
    >
      <p>Can you guess how many requests your services handled this year?</p>

      <img src={imgCroissants3} className="w-full" />

      <div className="col h-72 justify-evenly">
        <div>
          <p className="text-2xl">Give us your best guess</p>
          <p className={clsx('text-lg', lastAnswer === undefined && 'invisible')}>
            {tries >= 2 && <>{tries} tries remaining!</>}
            {tries === 1 && <>Last try!!!</>}
            {tries === 0 && <>You&apos;re done</>}
          </p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit}>
          <Input
            ref={inputRef}
            name="guess"
            onKeyDown={onKeyDownPositiveInteger}
            className="mx-auto max-w-32 text-xl"
            inputBoxClassName="border-strong py-2"
            inputClassName="text-center"
          />
        </form>

        {tries > 0 && (
          <p className={clsx('text-5xl', lastAnswer === undefined && 'invisible')}>
            {(lastAnswer ?? 0) < data.requests ? 'Higher!' : 'Lower!'}
          </p>
        )}

        {tries === 0 && (
          <>
            <p>{data.requests} requests!</p>

            <p className="font-normal">
              {lastAnswer === data.requests && "That's it!!!"}
              {result > 0 && result <= 2 && 'So close!!'}
              {result > 2 && result <= 3 && 'Not far!'}
              {result > 3 && result <= 4 && 'Nice try!'}
              {result > 4 && 'Can you believe it?'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
