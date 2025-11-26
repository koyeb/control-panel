import { Code as BaseCode, Button, CodeLang, Spinner } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';

import { apiMutation, useOrganization } from 'src/api';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { DocumentationLink } from 'src/components/documentation-link';
import { Link } from 'src/components/link';
import { useThemeModeOrPreferred } from 'src/hooks/theme';
import { IconPlay, IconRefreshCcw } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.sandbox.list.noSandboxes');

// cspell:ignore randint
const pythonCode = `
# main.py
from koyeb import Sandbox

sandbox = Sandbox.create(
  image="ubuntu",
  name="hello-world",
  wait_ready=True,
)

result = sandbox.exec("echo 'Hello World'")
print(result.stdout.strip())

sandbox.delete()
`.trim();

export function NoSandboxes() {
  return (
    <div className="col gap-6">
      <p className="text-dim">
        <T id="intro.sentence" />
      </p>

      <Section number={1} title={<T id="step1.title" />}>
        <div className="col gap-2">
          <p className="text-dim">
            <T id="step1.line1" />
          </p>

          <Code lang="shell" prefix="$ " value="pip install koyeb-sdk" />
        </div>

        <div className="col gap-2">
          <p className="text-dim">
            <T id="step1.line2" values={{ link: docs }} />
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
            <T
              id="step2.line2"
              values={{
                link: (children) => (
                  <Link to="/settings/api" className="text-default underline">
                    {children}
                  </Link>
                ),
              }}
            />
          </p>

          <ApiTokenCode />
        </div>

        <div className="col gap-2">
          <p className="text-dim">
            <T id="step2.line3" />
          </p>

          <Code lang="shell" prefix="$ " value="python main.py" />
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

const docs = (children: React.ReactNode) => (
  <DocumentationLink path="/docs/sandboxes" className="text-default underline">
    {children}
  </DocumentationLink>
);

function ApiTokenCode() {
  const organization = useOrganization();

  const mutation = useMutation({
    ...apiMutation('post /v1/credentials', {
      body: {
        name: 'Sandbox API token',
        type: 'ORGANIZATION',
        organization_id: organization?.id,
      },
    }),
  });

  const Icon = mutation.isPending ? Spinner : IconRefreshCcw;

  const end = () => {
    if (mutation.isSuccess) {
      return null;
    }

    return (
      <Button variant="outline" color="gray" onClick={() => mutation.mutate()} className="bg-neutral">
        <Icon className="size-4" />
        <T id="step2.generateToken" />
      </Button>
    );
  };

  return (
    <Code
      lang="shell"
      prefix="$ "
      value={`export KOYEB_API_TOKEN=${mutation.data?.credential?.id ?? ''}`}
      end={end()}
    />
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

type CodeProps = {
  lang: CodeLang;
  value: string;
  prefix?: string;
  end?: React.ReactNode;
};

function Code({ lang, value, prefix = '', end }: CodeProps) {
  const theme = useThemeModeOrPreferred();

  return (
    <div className="row items-center rounded-md border bg-muted p-3">
      <BaseCode lang={lang} value={prefix + value} theme={theme} className="flex-1 overflow-auto" />

      <div className="self-start">
        {end ?? <CopyIconButton text={value} className="size-8 rounded-md border bg-neutral p-2" />}
      </div>
    </div>
  );
}
