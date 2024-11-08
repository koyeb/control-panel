import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useForm, UseFormReturn } from 'react-hook-form';

import { Alert, Spinner } from '@koyeb/design-system';
import { getConfig } from 'src/application/config';
import { Translate } from 'src/intl/translate';
import { wait } from 'src/utils/promises';

import { ControlledInput } from './controlled';
import { IconBookMarked } from './icons';

const T = Translate.prefix('instanceSelector.instanceAssistant');

type DataType = {
  instance_type: string;
  reason: string;
};

export function InstanceAssistant() {
  const translate = T.useTranslate();

  const form = useForm({
    defaultValues: {
      query: '',
    },
  });

  const search = form.watch('query');

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

      <ExamplesList form={form} />

      <ControlledInput
        control={form.control}
        name="query"
        placeholder={translate('queryPlaceholder')}
        autoComplete="off"
      />

      <InstanceAssistantResponse query={query} />
    </div>
  );
}

type ExamplesListProps = {
  form: UseFormReturn<{ query: string }>;
};

function ExamplesList({ form }: ExamplesListProps) {
  const translate = T.useTranslate();

  return (
    <ul className="pl-3 text-dim">
      {(['small', 'high', 'ml'] as const).map((example) => (
        <li key={example}>
          <button
            type="button"
            className="cursor-pointer hover:font-bold"
            onClick={() => form.setValue('query', translate(`examples.${example}`))}
          >
            ➔ <T id={`examples.${example}`} />
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
  const { data, isLoading, isSuccess, error } = query;

  if (isLoading) {
    return (
      <span className="flex items-center gap-1 text-dim">
        <Spinner className="size-4" />
        <T id="aiLoadingText" />
      </span>
    );
  }

  if (error) {
    return <Alert variant="error" description={error.message} />;
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

  const response = await fetch(`${config.aiAssistantApiUrl}/v1/recommender/instance-type`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: search,
    }),
  });

  const data = (await response.json()) as DataType;

  return data;
}
