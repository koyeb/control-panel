import { Code, CodeLang, Tab, Tabs } from '@koyeb/design-system';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { apiQuery } from 'src/api';
import { createValidationGuard } from 'src/application/validation';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { ControlledSelect } from 'src/components/forms';
import { IconEye, IconEyeOff } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { DatabaseDeployment, DatabaseRole, LogicalDatabase } from 'src/model';
import { getName, hasProperty } from 'src/utils/object';

import {
  DatabaseClient,
  DatabaseConnectionDetails,
  DatabaseSnippetFn,
  databaseClientSnippets,
} from './snippets';

const T = createTranslate('pages.database.overview.connectionDetails');
const clients = Array.from(databaseClientSnippets.keys());

type ConnectionDetailsProps = {
  deployment: DatabaseDeployment;
};

export function ConnectionDetails({ deployment }: ConnectionDetailsProps) {
  const form = useForm({
    defaultValues: {
      role: deployment.roles?.[0]?.name ?? '',
      database: deployment.databases?.[0]?.name ?? '',
    },
  });

  const role = deployment.roles?.find(hasProperty('name', form.watch('role')));
  const database = deployment.databases?.find(hasProperty('name', form.watch('database')));

  const [selectedClient, setSelectedClient] = useState(clients[0]!);
  const client = databaseClientSnippets.get(selectedClient)!;

  const onDatabaseClientSelected = (client: DatabaseClient) => {
    setSelectedClient(client);
  };

  return (
    <section className="divide-y rounded-md border">
      <header className="col justify-between gap-4 px-3 py-4 md:row md:items-center">
        <div className="font-medium">
          <T id="title" />
        </div>

        <form className="col gap-4 md:row">
          <ControlledSelect
            control={form.control}
            name="role"
            items={deployment.roles ?? []}
            getKey={getName}
            itemToString={getName}
            itemToValue={getName}
            renderItem={getName}
            className="min-w-64"
          />

          <ControlledSelect
            control={form.control}
            name="database"
            items={deployment.databases ?? []}
            getKey={getName}
            itemToString={getName}
            itemToValue={getName}
            renderItem={getName}
            className="min-w-64"
          />
        </form>
      </header>

      <div className="col gap-3 p-3">
        <Tabs className="flex-wrap justify-start">
          {clients.map((client, index) => (
            <Tab
              key={index}
              selected={client === selectedClient}
              onClick={() => onDatabaseClientSelected(client)}
              className="flex-1"
            >
              <T id={client} />
            </Tab>
          ))}
        </Tabs>

        {client.map(({ filename, lang, snippet }) => (
          <SnippetFile
            key={filename}
            deployment={deployment}
            role={role}
            database={database}
            filename={filename}
            lang={lang}
            snippet={snippet}
          />
        ))}
      </div>
    </section>
  );
}

type SnippetFileProps = {
  deployment: DatabaseDeployment;
  role?: DatabaseRole;
  database?: LogicalDatabase;
  filename: string;
  lang: CodeLang;
  snippet: DatabaseSnippetFn;
};

function SnippetFile({ deployment, role, database, filename, lang, snippet }: SnippetFileProps) {
  const password = useRolePassword(role);

  const details = (passwordVisible: boolean): DatabaseConnectionDetails => ({
    host: deployment.host ?? '',
    role: role?.name ?? '',
    password: passwordVisible && password !== null ? password : '*******',
    database: database?.name ?? '',
  });

  const [passwordVisible, setPasswordVisible] = useState(false);
  const PasswordVisibilityIcon = passwordVisible ? IconEyeOff : IconEye;

  return (
    <div>
      <div className="row justify-between rounded-t-md bg-black/80 p-3 text-white dark:bg-muted/50">
        <div className="font-bold">{filename}</div>

        <div className="row items-center gap-4">
          <button type="button" onClick={() => setPasswordVisible(!passwordVisible)}>
            <PasswordVisibilityIcon className="size-5" />
          </button>

          <CopyIconButton text={snippet(details(true))} className="size-5" />
        </div>
      </div>

      <Code
        lang={lang}
        theme="dark"
        value={snippet(details(passwordVisible))}
        className="overflow-x-auto rounded-b-md bg-black p-3 whitespace-pre-wrap scrollbar-green dark:bg-muted"
      />
    </div>
  );
}

function useRolePassword(role?: { secretId: string }) {
  const secretId = role?.secretId;

  const { isSuccess, data } = useQuery({
    ...apiQuery('post /v1/secrets/{id}/reveal', { path: { id: secretId! } }),
    enabled: secretId !== undefined,
  });

  if (!isSuccess || !isDatabaseSecretValue(data.value)) {
    return null;
  }

  return data.value.password;
}

const isDatabaseSecretValue = createValidationGuard(
  z.object({
    password: z.string(),
  }),
);
