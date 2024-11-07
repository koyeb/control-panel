import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Alert, Spinner } from '@koyeb/design-system';
import { getConfig } from 'src/application/config';
import { Translate } from 'src/intl/translate';
import { wait } from 'src/utils/promises';

import { ControlledInput } from './controlled';
import { IconBookMarked, IconChevronDown, IconChevronRight } from './icons';

const T = Translate.prefix('instanceSelector.instanceAssistant');

type DataType = {
  instance_type: string;
  reason: string;
};

export function InstanceAssistant() {
  const [showExamples, setShowExamples] = useState(false);
  const form = useForm({
    defaultValues: {
      q: '',
    },
  });
  const translate = T.useTranslate();

  const search = form.watch('q');

  const query = useQuery({
    enabled: search.length > 0,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: false,
    queryKey: ['instanceAssistant', search],
    async queryFn({ signal }) {
      if (!(await wait(500, signal))) {
        return null;
      }
      return queryAIAssistant(search);
    },
  });

  return (
    <div className="card xl:col hidden gap-2 p-4">
      <span className="font-medium">
        <T id="title" />
      </span>

      <span className="text-dim">
        <T id="content" />
      </span>

      <div>
        <button className="flex items-center" onClick={() => setShowExamples((prev) => !prev)}>
          {showExamples ? <IconChevronDown /> : <IconChevronRight />}
          <span className="text-dim">
            <T id="loadExamples" />
          </span>
        </button>

        {showExamples && <ExamplesList form={form} />}
      </div>

      <ControlledInput
        autoComplete="off"
        control={form.control}
        name="q"
        placeholder={translate('queryPlaceholder')}
      />

      <InstanceAssistantResponse query={query} />
    </div>
  );
}

type ExamplesListProps = {
  form: ReturnType<typeof useForm<{ q: string }>>;
};

function ExamplesList({ form }: ExamplesListProps) {
  const translate = T.useTranslate();
  const examples = ['examples.small', 'examples.high', 'examples.ml'] as const;

  return (
    <ul className="pl-3 text-dim">
      {examples.map((example) => (
        <li key={example}>
          <button
            className="cursor-pointer hover:font-bold"
            onClick={() => form.setValue('q', translate(example))}
          >
            ➔ <T id={example} />
          </button>
        </li>
      ))}
    </ul>
  );
}

type InstanceAssistantResponseProps = {
  query: UseQueryResult<DataType | null>;
};

function InstanceAssistantResponse({ query }: InstanceAssistantResponseProps) {
  const { data, isLoading, isSuccess, error: queryError } = query;

  if (isLoading) {
    return (
      <span className="flex items-center gap-1 text-dim">
        <Spinner className="size-4" />
        <T id="aiLoadingText" />
      </span>
    );
  }

  if (queryError) {
    return <Alert variant="error" description={queryError?.message} />;
  }

  if (isSuccess && data) {
    return (
      <blockquote className="flex flex-col gap-2 whitespace-pre-line border-l-4 pl-2 hover:border-green">
        <div className="flex gap-1 font-bold">
          <IconBookMarked />
          <T id="aiReplyHeader" values={{ recommendedInstanceType: data.instance_type }} />
        </div>
        <div>{data.reason}</div>
      </blockquote>
    );
  }

  return null;
}

async function queryAIAssistant(search: string) {
  const config = getConfig();

  const resp = await fetch(`${config.aiAssistantApiUrl}/v1/recommender/instance-type`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: search,
    }),
  });

  const data = (await resp.json()) as DataType;

  return data;
}
