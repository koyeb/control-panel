import { Code as BaseCode, CodeLang } from '@koyeb/design-system';

import { CopyIconButton } from 'src/components/copy-icon-button';
import { useThemeModeOrPreferred } from 'src/hooks/theme';
import { IconPlay } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.sandbox.list.noSandboxes');

// cspell:ignore randint
const pythonCode = `
import random

arr=[1,2,3,4,5,6]
n=len(arr)-1

for i in range(n):
    random_index = random.randint(0, n)
    temp = arr.pop(random_index)
    arr.append(temp)

print(arr)
`.trim();

export function NoSandboxes() {
  return (
    <div className="col gap-6">
      <p className="text-dim">
        <T id="intro.sentence" />
      </p>

      <Section number={1} title={<T id="step1.title" />}>
        <p className="text-dim">
          <T id="step1.line1" />
        </p>

        <div className="col gap-2">
          <Code lang="shell" value="$ pip install lorem" />

          <p className="text-dim">
            <T id="step1.line2" />
          </p>
        </div>

        <div className="col gap-2">
          <Code lang="shell" value="$ python -m lorem ipsum" />

          <p className="text-dim">
            <T id="step1.line3" />
          </p>
        </div>
      </Section>

      <Section number={2} title={<T id="step2.title" />}>
        <div className="col gap-2">
          <p className="text-dim">
            <T id="step2.line1" />
          </p>

          <Code lang="python" value={pythonCode} />
        </div>

        <div className="col gap-2">
          <p className="text-dim">
            <T id="step2.line2" />
          </p>

          <Code lang="shell" value="$ python -m lorem ipsum" />
        </div>

        <div className="col gap-2">
          <p className="text-dim">
            <T id="step2.line3" />
          </p>

          <Code lang="shell" value="$ python -m lorem ipsum" />
        </div>
      </Section>

      <div className="row items-center gap-3 rounded-md border border-green bg-green/5 p-3 text-base font-medium">
        <div className="flex size-6 items-center justify-center rounded-md border border-green bg-green/5 p-1">
          <IconPlay className="text-green" />
        </div>
        <T id="end.sentence" />
      </div>
    </div>
  );
}

type SectionProps = {
  number: number;
  title: React.ReactNode;
  children: React.ReactNode;
};

function Section({ number, title, children }: SectionProps) {
  return (
    <section className="rounded-md border">
      <header className="row items-center gap-3 rounded-t-md bg-muted p-3 text-base font-medium">
        <div className="flex size-6 items-center justify-center rounded-md border border-green bg-green/5">
          {number}
        </div>

        {title}
      </header>

      <div className="col gap-4 px-3 py-4">{children}</div>
    </section>
  );
}

function Code({ lang, value }: { lang: CodeLang; value: string }) {
  const theme = useThemeModeOrPreferred();

  return (
    <div className="row items-center rounded-md border bg-muted p-3">
      <BaseCode lang={lang} value={value} theme={theme} className="flex-1 overflow-auto" />

      <div className="self-start">
        <CopyIconButton text={value} className="size-8 rounded-md border bg-neutral p-2" />
      </div>
    </div>
  );
}
